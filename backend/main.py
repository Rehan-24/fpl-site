from fastapi import FastAPI, Query, Header, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
#from managers.index import router as managers_router
#from news.index import router as news_router
from fastapi import BackgroundTasks
#from admin.seed import router as seed_router
from managers_db_version import router as managers_router
from news_db_version import router as news_router
from backend_db import (
    insert_table_snapshot, get_latest_table_snapshot,
    upsert_season_stats, fetch_all_managers, get_overall_ranks_for_season,
)
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime as _dt, timezone as _tz
from fastapi import APIRouter, Depends, HTTPException, Header
import os
import threading, time
from typing import List, Tuple
from fixtures_refresh import refresh_h2h_fixtures_for_league, current_season_label
import threading, traceback
import os
import json
import subprocess
from typing import Optional
import hashlib, re, requests
import datetime as dt_mod
import pandas as pd
import math
import pandas as pd
import traceback, logging
logger = logging.getLogger("uvicorn.error")

# Prevent overlapping cron runs
_CRON_LOCK = threading.Lock()

def _fail(stage: str, err: Exception):
    # log full traceback to Render logs and return a concise message to the client
    logger.error("Rebuild failed at %s: %s\n%s", stage, err, traceback.format_exc())
    raise HTTPException(status_code=500, detail=f"{stage} failed: {type(err).__name__}: {err}")


def _to_json_safe(v):
    # Treat pandas/float NaN/inf as None; stringify other weirds
    try:
        if v is None:
            return None
        # pandas-friendly check
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        if pd.isna(v):  # catches numpy/pandas NaN
            return None
        return v
    except Exception:
        return None
    
class TableSnapshotIn(BaseModel):
    league: str
    gw: Optional[int] = None
    payload: Dict[str, Any]
    source: str = "backend"
    schema_version: int = 1

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Config ---
BASE_DIR = os.path.dirname(__file__)
RESULTS_DIR = os.path.join(BASE_DIR, "results")
LATEST_DIR = os.path.join(RESULTS_DIR, "latest")
os.makedirs(LATEST_DIR, exist_ok=True)

ADMIN_KEY = os.environ.get("API_KEY", "")
SCRIPT_PATH = os.path.join(BASE_DIR, "src", "fpl_management.py")
# The script is expected to write this Excel file per league:
EXCEL_NAME_TEMPLATE = "{league}_results_v3.xlsx"

_REFRESH_LOCK = threading.Lock()
_REFRESH_STATE = {
    "running": False,
    "started_at": None,
    "finished_at": None,
    "season": None,
    "per_league": [],   # list of {"league": str, "rows": int}
    "error": None,
}

# --- Routers ---
#app.include_router(news_router, prefix="/api")
# Keep the original base so existing calls keep working:
#app.include_router(managers_router, prefix="/api")
# Also mount under /api/managers for the new owner endpoints you’re testing:
#app.include_router(managers_router, prefix="/api/managers")

#app.include_router(seed_router, prefix="/api", tags=["admin"])
app.include_router(managers_router, prefix="/api", tags=["managers"])
app.include_router(news_router,     prefix="/api", tags=["news"])


router_admin = APIRouter(prefix="/api/admin", tags=["admin"])

def _require_api_key(x_api_key: str = Header(None)):
    expected = os.environ.get("BOT_API_KEY") or os.environ.get("API_KEY")
    if not expected or not x_api_key or x_api_key.strip() != expected.strip():
        raise HTTPException(status_code=401, detail="unauthorized")
    return True

def _refresh_worker(leagues: List[Tuple[str, int]]):
    global _REFRESH_STATE
    with _REFRESH_LOCK:
        _REFRESH_STATE.update({
            "running": True,
            "started_at": time.time(),
            "finished_at": None,
            "season": current_season_label(),
            "per_league": [],
            "error": None,
        })
    try:
        results = []
        for name, lid in leagues:
            n = refresh_h2h_fixtures_for_league(league_id=lid, league_name=name)
            results.append({"league": name, "rows": n})
        with _REFRESH_LOCK:
            _REFRESH_STATE["per_league"] = results
    except Exception as e:
        with _REFRESH_LOCK:
            _REFRESH_STATE["error"] = f"{type(e).__name__}: {e}"
    finally:
        with _REFRESH_LOCK:
            _REFRESH_STATE["running"] = False
            _REFRESH_STATE["finished_at"] = time.time()
            
# add next to /api/admin/refresh-fixtures
def _refresh_range_worker(leagues: List[Tuple[str, int]], start_gw: int, end_gw: int):
    global _REFRESH_STATE
    with _REFRESH_LOCK:
        _REFRESH_STATE.update({
            "running": True,
            "started_at": time.time(),
            "finished_at": None,
            "season": current_season_label(),
            "per_league": [],
            "error": None,
        })
    try:
        results = []
        for name, lid in leagues:
            n = refresh_h2h_fixtures_for_league(
                league_id=lid,
                league_name=name,
                start_gw=start_gw,
                end_gw=end_gw,
            )
            results.append({"league": name, "rows": n})
        with _REFRESH_LOCK:
            _REFRESH_STATE["per_league"] = results
    except Exception as e:
        with _REFRESH_LOCK:
            _REFRESH_STATE["error"] = f"{type(e).__name__}: {e}"
    finally:
        with _REFRESH_LOCK:
            _REFRESH_STATE["running"] = False
            _REFRESH_STATE["finished_at"] = time.time()

@router_admin.post("/refresh-fixtures-range")
def refresh_fixtures_range(
    background: BackgroundTasks,
    start_gw: int = Query(1),
    end_gw: int = Query(38),
    _: bool = Depends(_require_api_key),
):
    if start_gw < 1 or end_gw > 38:
        raise HTTPException(status_code=400, detail="start_gw/end_gw must be within 1..38")
    if start_gw > end_gw:
        start_gw, end_gw = end_gw, start_gw

    ligs = []
    if os.environ.get("H2H_PREMIER_LEAGUE_ID"):
        ligs.append(("Premier", int(os.environ["H2H_PREMIER_LEAGUE_ID"])))
    if os.environ.get("H2H_CHAMPIONSHIP_LEAGUE_ID"):
        ligs.append(("Championship", int(os.environ["H2H_CHAMPIONSHIP_LEAGUE_ID"])))

    with _REFRESH_LOCK:
        if _REFRESH_STATE["running"]:
            return {"status": "already-running", "season": _REFRESH_STATE["season"]}

    background.add_task(_refresh_range_worker, ligs, start_gw, end_gw)
    return {
        "status": "started",
        "season": current_season_label(),
        "leagues": [name for name, _ in ligs],
        "start_gw": start_gw,
        "end_gw": end_gw,
    }


@router_admin.post("/refresh-fixtures")
def refresh_fixtures(background: BackgroundTasks, _: bool = Depends(_require_api_key)):
    ligs = []
    if os.environ.get("H2H_PREMIER_LEAGUE_ID"):
        ligs.append(("Premier", int(os.environ["H2H_PREMIER_LEAGUE_ID"])))
    if os.environ.get("H2H_CHAMPIONSHIP_LEAGUE_ID"):
        ligs.append(("Championship", int(os.environ["H2H_CHAMPIONSHIP_LEAGUE_ID"])))

    with _REFRESH_LOCK:
        if _REFRESH_STATE["running"]:
            return {"status": "already-running", "season": _REFRESH_STATE["season"]}

    background.add_task(_refresh_worker, ligs)
    return {
        "status": "started",
        "season": current_season_label(),
        "leagues": [name for name, _ in ligs],
    }

@router_admin.get("/refresh-fixtures/status")
def refresh_fixtures_status(_: bool = Depends(_require_api_key)):
    with _REFRESH_LOCK:
        return dict(_REFRESH_STATE)
    
@router_admin.post("/rebuild-matchups")
def rebuild_matchups_admin(_: bool = Depends(_require_api_key)):
    from backend_db import rebuild_manager_matchups
    n = rebuild_manager_matchups()
    return {"status": "ok", "pairs": n}


app.include_router(router_admin)

# --- Auth helper ---
def require_admin(x_api_key: str = Header("")):
    if not ADMIN_KEY or x_api_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="forbidden")


# --- Helpers ---
def excel_path_for_league(league: str) -> str:
    # Prefer backend/results, fall back to backend/src/results
    primary = os.path.join(RESULTS_DIR, EXCEL_NAME_TEMPLATE.format(league=league))
    fallback = os.path.join(BASE_DIR, "src", "results", EXCEL_NAME_TEMPLATE.format(league=league))
    return primary if os.path.exists(primary) else fallback

def latest_json_path_for_league(league: str) -> str:
    return os.path.join(LATEST_DIR, f"{league}.json")

def run_management_script(league: str, gw: Optional[int] = None) -> None:
    # Calls the fpl_management.py script.
    # - If gw is provided: python src/fpl_management.py <league> <gw> -o
    # - Else:               python src/fpl_management.py <league> -o
    
    if not os.path.isfile(SCRIPT_PATH):
        raise RuntimeError(f"Script not found at {SCRIPT_PATH}")

    # Run from src/ so relative imports/paths resolve
    cmd = ["python", "fpl_management.py", league]
    if gw is not None:
        cmd.append(str(gw))
    cmd.append("-o")

    result = subprocess.run(
        cmd,
        cwd=os.path.join(BASE_DIR, "src"),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode, cmd,
            output=result.stdout,
            stderr=result.stderr,
        )


def excel_to_latest_json(league: str, preferred_sheet: Optional[str] = None) -> dict:
    xlsx = excel_path_for_league(league)
    if not os.path.exists(xlsx):
        raise FileNotFoundError(f"Excel not found: {xlsx}")

    xls = pd.ExcelFile(xlsx)
    sheets = list(xls.sheet_names)

    # pick sheet
    sheet_name = None
    if preferred_sheet and preferred_sheet in sheets:
        sheet_name = preferred_sheet
    else:
        gw_sheets = []
        for name in sheets:
            m = re.fullmatch(r"GW(\d+)", str(name).strip())
            if m:
                gw_sheets.append((int(m.group(1)), name))
        if gw_sheets:
            sheet_name = sorted(gw_sheets, key=lambda t: t[0])[-1][1]
        else:
            sheet_name = sheets[0]  # last resort

    # read with header row at index 1 first; fall back to 0
    try:
        df = pd.read_excel(xlsx, sheet_name=sheet_name, header=1, engine="openpyxl")
    except Exception:
        df = pd.read_excel(xlsx, sheet_name=sheet_name, header=0, engine="openpyxl")

    # drop "Unnamed" columns produced by merged cells
    df = df.loc[:, ~df.columns.astype(str).str.startswith("Unnamed")]
    
    # dump the stuff we don't need
    df = df.iloc[:20]
    df = df.drop(columns=["Reward*", "Title"], errors="ignore")


    # sort like your table then add Position
    try:
        df_sorted = df.sort_values(by=["Points", "Score"], ascending=[False, False]).reset_index(drop=True)
    except Exception:
        # if those columns are missing, just keep as-is
        df_sorted = df.reset_index(drop=True)

    if "Position" not in df_sorted.columns:
        df_sorted.insert(0, "Position", range(1, len(df_sorted) + 1))
        
    desired = [
        "Points", "Wins", "Draws", "Losses", "GP", "Games Left",
        "Score", "Score Against", "Plus/Minus",
        "GW Transfers", "GW Transfer Hit",
        "Total Transfers Made", "Total Transfer Hit",
        "GW Points on Bench", "Season Points on Bench",
        "Highest Point Total Possible", "Current Team Value",
        "Triple Captain 1", "Bench Boost 1", "Free Hit 1", "Wildcard 1",
        "Triple Captain 2", "Bench Boost 2", "Free Hit 2", "Wildcard 2",
    ]
    cols = [c for c in desired if c in df_sorted.columns] + \
        [c for c in df_sorted.columns if c not in desired and c not in ("Position","Team")]
    df_sorted = df_sorted[["Position","Team", *cols]]

    # coerce to JSON-safe scalars
    def _jsonify(v):
        try:
            if v is None:
                return None
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return None
            if pd.isna(v):
                return None
            return v
        except Exception:
            return None

    rows = [{k: _jsonify(v) for k, v in rec.items()} for rec in df_sorted.to_dict(orient="records")]

    out_path = latest_json_path_for_league(league)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "league": league,
            "sheet": sheet_name,
            "generated_at": time.time(),
            "rows": rows
        }, f, ensure_ascii=False)

    return {"league": league, "sheet": sheet_name, "rows": rows}

def fetch_current_gw() -> int:
    
    # Ask FPL for the current GW. Prefer `is_current`, then `is_next`,
    # else fallback to the highest event whose deadline has passed.
    
    r = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/", timeout=10)
    r.raise_for_status()
    j = r.json()
    events = j.get("events", [])
    # 1) is_current
    for e in events:
        if e.get("is_current"):
            return int(e["id"])
    # 2) is_next
    for e in events:
        if e.get("is_next"):
            return int(e["id"])
    # 3) fallback by deadline time
    now = dt_mod.datetime.utcnow()
    past = []
    for e in events:
        dt = e.get("deadline_time")
        if not dt:
            continue
        try:
            # deadline_time is ISO8601 in UTC, e.g. "2025-08-15T17:30:00Z"
            # strip 'Z' if present
            if dt.endswith("Z"):
                dt = dt[:-1]
            dtu = dt_mod.datetime.fromisoformat(dt)
            if dtu <= now:
                past.append((int(e["id"]), dtu))
        except Exception:
            continue
    if past:
        return sorted(past, key=lambda t: t[0])[-1][0]
    # worst case
    return 1

def resolve_gw_param(gw_param: Optional[str]) -> int:
    """
    Accepts None / "auto" / "current" / "" to mean current GW.
    Accepts a numeric string like "1" -> 1.
    """
    if gw_param is None:
        return fetch_current_gw()
    s = str(gw_param).strip().lower()
    if s in {"", "auto", "current"}:
        return fetch_current_gw()
    if not s.isdigit():
        raise HTTPException(status_code=400, detail="gw must be an integer, 'auto', or 'current'")
    return int(s)

def _sanitize(obj):
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(x) for x in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    try:
        if pd.isna(obj):
            return None
    except Exception:
        pass
    return obj

def _rebuild_worker(leagues_list: list[str], gw_mode: str):
    """
    Background job:
      - gw_mode: "current" (resolve dynamically) or a number as string ("1", "7", ...)
    """
    try:
        # Resolve GW once for all leagues if "current", else use provided numeric
        try:
            resolved_gw = resolve_gw_param(gw_mode)
        except Exception:
            # Fallback just in case
            resolved_gw = fetch_current_gw()

        for lg in leagues_list:
            try:
                # 1) Run the legacy script for this league/GW
                run_management_script(lg, resolved_gw)
                # 2) Convert specifically that GW sheet -> latest JSON
                excel_to_latest_json(lg, preferred_sheet=f"GW{resolved_gw}")
            except Exception as e:
                # Log but keep going with other leagues
                print(f"[cron] rebuild error for {lg}: {e}\n{traceback.format_exc()}")
        print(f"[cron] rebuild finished for {leagues_list} gw={resolved_gw}")
    finally:
        # Always release the lock
        if _CRON_LOCK.locked():
            _CRON_LOCK.release()


@app.post("/api/tables/snapshot", tags=["tables"])
def post_table_snapshot(s: TableSnapshotIn, _: None = Depends(require_admin)):
    # Admin-protected write
    insert_table_snapshot(s.league, s.gw, s.payload, s.source, s.schema_version)
    return {"ok": True}

@app.get("/api/tables/latest", tags=["tables"])
def get_table_latest(league: str, gw: int | None = None):
    row = get_latest_table_snapshot(league, gw)
    if not row:
        raise HTTPException(status_code=404, detail="No snapshot found")
    g = row.get("generated_at")
    if isinstance(g, _dt):
         row["generated_at"] = g.astimezone(_tz.utc).isoformat().replace("+00:00", "Z")
    elif isinstance(g, str):
        s = g.strip().replace(" ", "T")
        if s.endswith("+00:00") or s.endswith("+00"):
            s = s.split("+")[0] + "Z"
        elif s[-1].isdigit():
            s = s + "Z"  # assume UTC if no tz info
        row["generated_at"] = s
    return row


# --------------- Season summary helpers ---------------

_KNOWN_CHIP_KEYS = {
    "Wildcard 1", "Wildcard 2",
    "Triple Captain", "Triple Captain 1", "Triple Captain 2",
    "Bench Boost", "Bench Boost 1", "Bench Boost 2",
    "Free Hit", "Free Hit 1", "Free Hit 2",
    "AssMan",
}

_PREMIER_PRIZES = {
    1: "Champion $230", 2: "Champions League $110", 3: "Champions League $100",
    4: "Champions League $90", 5: "Europa League $55", 6: "Europa League $45",
    7: "Conference League $35",
}
_CHAMP_PRIZES = {
    1: "Champion $65", 2: "Promotion $45", 3: "Promotion $40", 4: "Promotion $30",
    5: "Upper Mid $25", 6: "Upper Mid $20", 7: "Upper Mid $15",
}

# League version labels per season
_LEAGUE_VERSIONS = {
    "premier":      {"2025-26": "v5", "2024-25": "v4"},
    "championship": {"2025-26": "v3", "2024-25": "v2"},
}

DATA_DIR = os.path.join(BASE_DIR, "data")


def _load_season_rows(league: str, season: Optional[str]) -> list:
    """Return the rows list for the given league+season.

    Any season with a frozen data/{league}_gw38_{season}.json snapshot is
    served from that file -- this is what keeps an archived season's page
    showing that season's table once a newer season's data starts landing
    in league_table_snapshots. "2024-25" additionally checks the older,
    season-unsuffixed filename for backward compatibility. Only a season
    with no frozen file at all falls through to "latest DB snapshot",
    which is only correct for the season that's actually still live.
    """
    if season:
        path = os.path.join(DATA_DIR, f"{league}_gw38_{season}.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("rows", data) if isinstance(data, dict) else data
    if season == "2024-25":
        path = os.path.join(DATA_DIR, f"{league}_gw38.json")
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("rows", data) if isinstance(data, dict) else data
    # default: latest DB snapshot -- only correct for the live season
    row = get_latest_table_snapshot(league)
    if not row:
        return []
    return row.get("payload", {}).get("rows", [])


@app.get("/api/season-summary", tags=["seasons"])
def get_season_summary(league: str, season: Optional[str] = None):
    from collections import Counter
    rows = _load_season_rows(league, season)
    if not rows:
        raise HTTPException(status_code=404, detail="No data found for this season")

    total = len(rows)
    prizes = _PREMIER_PRIZES if league.lower() == "premier" else _CHAMP_PRIZES
    sorted_by_pos = sorted(rows, key=lambda r: int(r.get("Position") or 99))

    # Top 7 — use row's own Title Reward when present (2024-25), else prize dict
    top7 = []
    for r in sorted_by_pos[:7]:
        pos = int(r.get("Position") or 0)
        row_reward = (r.get("Title Reward") or "").strip()
        top7.append({
            "position": pos, "team": r.get("Team"), "owner": r.get("Owner"),
            "wins": r.get("Wins"), "draws": r.get("Draws"), "losses": r.get("Losses"),
            "points": r.get("Points"), "score": r.get("Score"),
            "title_reward": row_reward or prizes.get(pos, ""),
        })

    # Relegated / promoted
    if league.lower() == "premier":
        relegated = [
            {"position": int(r.get("Position") or 0), "team": r.get("Team"),
             "owner": r.get("Owner"), "points": r.get("Points")}
            for r in sorted_by_pos if int(r.get("Position") or 0) >= 17
        ]
        promoted = []
    else:
        promoted = [
            {"position": int(r.get("Position") or 0), "team": r.get("Team"),
             "owner": r.get("Owner"), "points": r.get("Points"),
             "title_reward": (r.get("Title Reward") or "").strip() or prizes.get(int(r.get("Position") or 0), "")}
            for r in sorted_by_pos[:4]
        ]
        relegated = []

    # Score movers
    sorted_by_score = sorted(rows, key=lambda r: int(r.get("Score") or 0), reverse=True)
    score_rank_map = {r.get("Team"): idx + 1 for idx, r in enumerate(sorted_by_score)}
    deltas = []
    for r in rows:
        team = r.get("Team")
        pts_rank = int(r.get("Position") or 0)
        score_rank = score_rank_map.get(team, 0)
        deltas.append({
            "team": team, "owner": r.get("Owner"),
            "pts_rank": pts_rank, "score_rank": score_rank,
            "delta": pts_rank - score_rank,
        })
    biggest_up   = max(deltas, key=lambda x: x["delta"])
    biggest_down = min(deltas, key=lambda x: x["delta"])

    # Chip usage — discover columns dynamically
    first_row = rows[0]
    chip_keys = [k for k in first_row.keys() if k in _KNOWN_CHIP_KEYS]
    chip_usage = []
    for chip in chip_keys:
        vals = [str(r.get(chip, "")) for r in rows]
        used_gws = [int(v.replace("GW", "")) for v in vals if v.startswith("GW")]
        used_count = len(used_gws)
        peak_gw = f"GW{Counter(used_gws).most_common(1)[0][0]}" if used_gws else None
        chip_usage.append({
            "chip": chip, "used": used_count, "total": total,
            "pct": round(used_count / total * 100) if total else 0,
            "peak_gw": peak_gw,
        })

    # Overall FPL rank — look up from season_stats for all owners in this snapshot
    owner_names = [r.get("Owner") for r in rows if r.get("Owner")]
    owner_to_team = {r.get("Owner"): r.get("Team") for r in rows}
    try:
        rank_rows = get_overall_ranks_for_season(season or "2025-26", owner_names)
        if rank_rows:
            best = min(rank_rows, key=lambda x: x["overall_rank"])
            worst = max(rank_rows, key=lambda x: x["overall_rank"])
            avg_rank = round(sum(r["overall_rank"] for r in rank_rows) / len(rank_rows))
            overall_rank = {
                "best":  {"team": owner_to_team.get(best["owner_name"]),  "owner": best["owner_name"],  "rank": best["overall_rank"]},
                "worst": {"team": owner_to_team.get(worst["owner_name"]), "owner": worst["owner_name"], "rank": worst["overall_rank"]},
                "average": {"rank": avg_rank},
            }
        else:
            overall_rank = None
    except Exception:
        overall_rank = None

    return {
        "season": season or "2025-26",
        "league": league,
        "top7": top7,
        "relegated": relegated,
        "promoted": promoted,
        "score_movers": {"biggest_up": biggest_up, "biggest_down": biggest_down},
        "chip_usage": chip_usage,
        "overall_rank": overall_rank,
        "all_rows": sorted_by_pos,
    }


_STATIC_SEASON_META = {
    "premier": {
        "2023-24": {"version": "v3", "champion": "Maguire's Men", "manager": "Marvin Ling"},
        "2022-23": {"version": "v2", "champion": "joel FC",       "manager": "Joel Matthew"},
        "2021-22": {"version": "v1", "champion": "Cheeks FC",     "manager": "Rehan Khan"},
    },
    "championship": {},
}

@app.get("/api/seasons", tags=["seasons"])
def get_seasons(league: str):
    league_key = league.lower()
    versions = _LEAGUE_VERSIONS.get(league_key, {})
    result = []
    # Live seasons backed by DB/JSON snapshots
    for season in ["2025-26", "2024-25"]:
        rows = _load_season_rows(league_key, season)
        if not rows:
            continue
        sorted_rows = sorted(rows, key=lambda r: int(r.get("Position") or 99))
        top = next((r for r in sorted_rows if int(r.get("Position") or 99) == 1), None)
        result.append({
            "season": season,
            "version": versions.get(season, ""),
            "champion": top.get("Team") if top else None,
            "manager": top.get("Owner") if top else None,
        })
    # Older static-only seasons
    for season, meta in _STATIC_SEASON_META.get(league_key, {}).items():
        result.append({"season": season, **meta})
    return {"seasons": result}


_FPL_ENTRY_RE = re.compile(r"/entry/(\d+)/")

def _parse_fpl_entry_id(url: Optional[str]) -> Optional[int]:
    if not url:
        return None
    m = _FPL_ENTRY_RE.search(url)
    return int(m.group(1)) if m else None


@app.post("/api/admin/backfill-season-stats", tags=["admin"])
def admin_backfill_season_stats(
    season: str = Query("2025-26"),
    dry_run: bool = Query(False),
    _: None = Depends(require_admin),
):
    """
    Populate season_stats for the given season from the final table snapshots + FPL API.
    Writes: placement, league_points, total_score, team_name, fpl_entry_id, overall_rank.
    Set dry_run=true to preview without writing.
    """
    # Build owner -> fpl_entry_id map from the manager table
    all_managers = fetch_all_managers()
    owner_to_eid: dict[str, int] = {}
    for m in all_managers:
        name = (m.get("owner_name") or "").strip()
        if not name:
            continue
        eid = _parse_fpl_entry_id(m.get("fpl_team_url"))
        if eid:
            owner_to_eid[name.lower()] = eid

    rows_to_upsert = []
    errors = []

    for league in ["premier", "championship"]:
        snapshot_rows = _load_season_rows(league, season)
        for row in snapshot_rows:
            owner = (row.get("Owner") or "").strip()
            if not owner:
                continue
            eid = owner_to_eid.get(owner.lower())

            overall_rank = None
            if eid:
                try:
                    resp = requests.get(
                        f"https://fantasy.premierleague.com/api/entry/{eid}/",
                        timeout=10,
                        headers={"User-Agent": "tFPL-site/1.0"},
                    )
                    if resp.ok:
                        overall_rank = resp.json().get("summary_overall_rank")
                except Exception as e:
                    errors.append(f"{owner} (eid={eid}): {e}")

            placement = int(row.get("Position") or 0) or None
            league_points = int(row.get("Points") or 0) or None
            total_score = int(row.get("Score") or 0) or None

            rows_to_upsert.append({
                "owner_name": owner,
                "season": season,
                "fpl_entry_id": eid,
                "team_name": row.get("Team"),
                "placement": placement,
                "league_points": league_points,
                "total_score": total_score,
                "overall_rank": overall_rank,
            })

    if dry_run:
        return {"dry_run": True, "would_upsert": rows_to_upsert, "errors": errors}

    count = upsert_season_stats(rows_to_upsert)
    return {"upserted": count, "season": season, "errors": errors}


@app.post("/api/cron/trigger-rebuild")
def cron_trigger_rebuild(
    background: BackgroundTasks,
    token: str = Query(""),
    leagues: str = Query("premier,championship"),
    gw: str = Query("current"),
):
    """
    Lightweight endpoint for external schedulers (cron-job.org, etc.).
    Returns immediately with {"status":"started"} while the rebuild happens in background.
      - token: must match env CRON_TOKEN
      - leagues: comma-separated (default: "premier,championship")
      - gw: "current" (default) or an integer as a string, e.g. "1"
    """
    # Auth
    if token != os.environ.get("CRON_TOKEN", ""):
        raise HTTPException(status_code=403, detail="forbidden")

    # No overlap: if a run is in progress, just acknowledge and exit quickly
    if _CRON_LOCK.locked():
        return {"status": "already-running"}

    # Acquire and schedule background work
    _CRON_LOCK.acquire()
    leagues_list = [l.strip() for l in leagues.split(",") if l.strip()]
    background.add_task(_rebuild_worker, leagues_list, gw)

    # Return immediately (cron-job.org has a 30s timeout)
    return {"status": "started", "leagues": leagues_list, "gw": gw}


# --- API: Standings (serve prebuilt JSON) ---
@app.get("/api/standings")
def get_standings(request: Request, league: str = Query("premier")):
    path = os.path.join(LATEST_DIR, f"{league}.json")
    if not os.path.exists(path):
        return {"error": f"missing {league}.json"}

    mtime = os.path.getmtime(path)
    last_modified_http = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(mtime))
    stat = os.stat(path)
    etag = f'W/"{hashlib.md5(f"{stat.st_mtime_ns}-{stat.st_size}".encode()).hexdigest()}"'

    inm = request.headers.get("If-None-Match")
    ims = request.headers.get("If-Modified-Since")
    if inm == etag or (ims and ims == last_modified_http):
        return Response(status_code=304)

    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    payload = _sanitize(payload)  # <-- sanitize here

    resp = JSONResponse({"updated_at": mtime, "league": league, "data": payload})
    resp.headers["ETag"] = etag
    resp.headers["Last-Modified"] = last_modified_http
    resp.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    return resp



# --- API: Generate Excel on demand (legacy) ---
@app.get("/api/generate")
def generate_excel(league: str = Query("premier"), gw: int = Query(38)):
    try:
        run_management_script(league, gw)
        xlsx = excel_path_for_league(league)
        if os.path.exists(xlsx):
            return {"message": "Excel generated", "file": os.path.basename(xlsx)}
        return {"error": "Excel file not generated"}
    except subprocess.CalledProcessError as e:
        return {"error": f"Script failed: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}


# --- API: Download Excel ---
@app.get("/api/download")
def download_excel(file: str = Query(...)):
    path = os.path.join(RESULTS_DIR, file)
    if not os.path.isfile(path):
        return JSONResponse(status_code=404, content={"error": "File not found"})
    return FileResponse(path, filename=file)


# --- API: Admin rebuild (runs script -> writes latest JSON) ---
@app.post("/api/admin/rebuild")
def admin_rebuild(
    league: str = Query("premier"),
    gw: Optional[str] = Query(None),  # accept "auto", "current", or a number as string
    _: None = Depends(require_admin),
):
    try:
        # Resolve GW
        resolved_gw: Optional[int]
        if gw is None or str(gw).lower() in {"auto", "current", ""}:
            resolved_gw = fetch_current_gw()
        else:
            # numeric string -> int
            if not str(gw).isdigit():
                raise HTTPException(status_code=400, detail="gw must be an integer, 'auto', or 'current'")
            resolved_gw = int(gw)

        # 1) Run script for that GW
        run_management_script(league, resolved_gw)

        # 2) Convert the specific GW sheet to JSON (so UI matches the run)
        data = excel_to_latest_json(league, preferred_sheet=f"GW{resolved_gw}")
        
        try:
            insert_table_snapshot(league, resolved_gw, {"rows": data.get("rows", [])}, source="cron", schema_version=1)
        except Exception as _e:
            logger.error("snapshot insert failed for %s gw %s: %s", league, resolved_gw, _e)        

        return {
            "status": "ok",
            "league": league,
            "gw": resolved_gw,
            "json_path": f"/backend/results/latest/{league}.json",
            "rows": len(data.get("rows", [])),
        }
    except subprocess.CalledProcessError as e:
        detail = f"script failed: {e.stderr or e.stdout or str(e)}"
        raise HTTPException(status_code=500, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/admin/rebuild-all")
def admin_rebuild_all(
    leagues: str = Query("premier,championship"),
    gw: Optional[str] = Query(None),  # accepts None/"auto"/"current"/""
    _: None = Depends(require_admin),
):
    """
    Rebuild multiple leagues for a specific GW or the current GW.
    - leagues: comma-separated list, e.g. "premier,championship"
    - gw: int as string OR 'auto'/'current'/'' (defaults to current GW)
    """
    try:
        resolved_gw = resolve_gw_param(gw)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid gw: {e}")

    leagues_list = [l.strip() for l in leagues.split(",") if l.strip()]
    if not leagues_list:
        raise HTTPException(status_code=400, detail="no leagues provided")

    results = {}
    for lg in leagues_list:
        try:
            # 1) Run the script for that GW
            run_management_script(lg, resolved_gw)

            # 2) Convert specifically the GW sheet we just built (e.g., "GW7")
            data = excel_to_latest_json(lg, preferred_sheet=f"GW{resolved_gw}")
            
            try:
                insert_table_snapshot(lg, resolved_gw, {"rows": data.get("rows", [])}, source="cron", schema_version=1)
            except Exception as _e:
                logger.error("snapshot insert failed for %s gw %s: %s", lg, resolved_gw, _e)

            results[lg] = {
                "status": "ok",
                "gw": resolved_gw,
                "rows": len(data.get("rows", [])),
            }
        except Exception as e:
            results[lg] = {"status": "error", "gw": resolved_gw, "error": str(e)}

    return {
        "status": "ok",
        "gw": resolved_gw,
        "results": results,
    }
    
# PUBLIC rebuild: no API key, optional gw; omitting gw lets script choose "current"
@app.post("/api/rebuild")
def public_rebuild(league: str = Query("premier"), gw: Optional[str] = Query(None)):
    # 1) resolve GW
    try:
        resolved_gw = resolve_gw_param(gw)
    except Exception as e:
        _fail("resolve_gw", e)

    # 2) run legacy script
    try:
        run_management_script(league, resolved_gw)
    except subprocess.CalledProcessError as e:
        _fail("script", f"{e.stderr or e.stdout or str(e)}")
    except Exception as e:
        _fail("script", e)

    # 3) convert Excel → JSON (prefer the GW sheet we just built)
    try:
        data = excel_to_latest_json(league, preferred_sheet=f"GW{resolved_gw}")
        # NEW: snapshot it
        try:
            insert_table_snapshot(league, resolved_gw, {"rows": data.get("rows", [])}, source="manual", schema_version=1)
        except Exception as _e:
            logger.error("snapshot insert failed for %s gw %s: %s", league, resolved_gw, _e)
    except Exception as e:
        _fail("excel_to_json", e)

    return {
        "status": "ok",
        "league": league,
        "gw": resolved_gw,
        "json_path": f"/backend/results/latest/{league}.json",
        "rows": len(data.get("rows", [])),
    }

@app.get("/api/health")
def health():
    payload = {}
    for lg in ["premier", "championship"]:
        p = latest_json_path_for_league(lg)
        payload[lg] = {
            "exists": os.path.exists(p),
            "updated_at": os.path.getmtime(p) if os.path.exists(p) else None,
        }
    # NEW: show if admin key is present (length only)
    payload["admin_key_set"] = bool(ADMIN_KEY)
    payload["admin_key_len"] = len(ADMIN_KEY or "")
    return payload

@app.get("/ping")
def ping():
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────
# FA CUP ROUTES
# ─────────────────────────────────────────────────────────────────────────────

from facup_db import get_bracket, get_gw_scores, SEASON as FACUP_SEASON
from facup_scores import refresh_facup_scores, SEED_ENTRY_MAP

_FACUP_LOCK = threading.Lock()

@app.get("/api/facup/bracket", tags=["facup"])
def get_facup_bracket(season: str = Query(FACUP_SEASON)):
    """
    Return the full bracket state for a season.
    Called by the frontend useFACupBracket hook — cached via Cache-Control.
    """
    try:
        rows = get_bracket(season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Convert datetime fields to ISO strings for JSON serialisation
    for row in rows:
        if hasattr(row.get("updated_at"), "isoformat"):
            row["updated_at"] = row["updated_at"].isoformat()

    resp = JSONResponse({"season": season, "bracket": rows})
    resp.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    return resp


@app.get("/api/facup/seeding", tags=["facup"])
def get_facup_seeding_endpoint(season: str = Query(FACUP_SEASON)):
    """
    The frozen seeding for a season (who is seed #N, their team/league/
    score/reason), written once at freeze time. Empty until that
    season's facup_freeze.py has actually been run -- use
    /api/facup/projected-seeding instead for a live pre-freeze guess.
    """
    from facup_db import get_seeding
    try:
        rows = get_seeding(season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    resp = JSONResponse({"season": season, "seeding": rows})
    resp.headers["Cache-Control"] = "public, max-age=300"
    return resp


@app.get("/api/facup/scores", tags=["facup"])
def get_facup_scores(gw: int = Query(...)):
    """
    Return stored GW scores for all FA Cup managers for a given GW.
    Frontend uses this to show live scores on matchup cards.
    """
    try:
        rows = get_gw_scores(gw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    for row in rows:
        if hasattr(row.get("fetched_at"), "isoformat"):
            row["fetched_at"] = row["fetched_at"].isoformat()

    resp = JSONResponse({"gw": gw, "scores": rows})
    resp.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    return resp


@app.post("/api/facup/refresh", tags=["facup"])
def trigger_facup_refresh(
    background: BackgroundTasks,
    gw: str = Query("current"),
    _: bool = Depends(_require_api_key),
):
    """
    Admin-protected manual trigger to refresh FA Cup scores for a GW.
    The cron job calls this automatically — you can also hit it from the
    admin panel or curl to force an update.
    """
    if _FACUP_LOCK.locked():
        return {"status": "already-running"}

    def _worker():
        with _FACUP_LOCK:
            resolved = resolve_gw_param(gw)
            refresh_facup_scores(resolved)

    background.add_task(_worker)
    return {"status": "started", "gw": gw}


@app.post("/api/admin/facup-repair-r32", tags=["facup"])
def admin_facup_repair_r32(_: None = Depends(require_admin)):
    """
    One-time data repair for the GW32 bracket corruption where R1 winners
    were advanced to wrong R32 slots (r32[1,2,3] instead of r32[15,8,7]).

    This endpoint:
      1. Seeds r32[7], r32[8], r32[15] with the correct R1 winners.
      2. Clears stale interim-score winners from r32[2] and r32[3] so they
         get re-resolved with final GW32 scores on the next refresh.
      3. Clears the wrong r16[1] entries (hands/ur-dads-fav-team) that were
         advanced from those interim winners.

    After calling this, trigger POST /api/facup/refresh?gw=32 to re-resolve
    the affected matchups and advance the correct winners into R16.

    NOTE: r32[1] (M6) ran with Soccer Team (39) as the wrong participant and
    Soccer Team won — that result stands.  Soccer Team therefore also appears
    as seed2 in r32[15] (M20); if they win there too the admin should
    manually rule on the duplicate (e.g. give Cheeks FC a walkover).
    """
    import psycopg as pg
    from facup_db import DB_URL, SEASON as FS

    ops = []
    with pg.connect(DB_URL) as conn, conn.cursor() as cur:

        # ── 1. Slot correct R1 winners into empty R32 seed2 slots ────────────
        # r32[7]  (M12): FC Wincinnati (4) vs ur dads fav team (36, entry 6542694)
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed2 = 36, entry_id2 = 6542694, updated_at = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 7
               AND seed2 IS NULL
        """, (FS,))
        ops.append({"slot": "r32[7] seed2", "rows": cur.rowcount})

        # r32[8]  (M13): Cincy Til I Cry (3) vs hands (35, entry 4285068)
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed2 = 35, entry_id2 = 4285068, updated_at = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 8
               AND seed2 IS NULL
        """, (FS,))
        ops.append({"slot": "r32[8] seed2", "rows": cur.rowcount})

        # r32[15] (M20): Cheeks FC (2) vs Soccer Team (39, entry 5356734)
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed2 = 39, entry_id2 = 5356734, updated_at = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 15
               AND seed2 IS NULL
        """, (FS,))
        ops.append({"slot": "r32[15] seed2", "rows": cur.rowcount})

        # ── 2. Clear interim winners from r32[2] and r32[3] ──────────────────
        # The cron captured scores mid-GW32 and stored the wrong winner.
        # Only clear if winner_seed still matches the expected wrong value.

        # r32[2] (M7): 2026 Champions (16) beat hands (35) on final scores 49-48
        #              but interim run stored hands (35) as winner.
        cur.execute("""
            UPDATE public.facup_bracket
               SET winner_seed = NULL, winner_entry = NULL, updated_at = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 2
               AND winner_seed = 35
        """, (FS,))
        ops.append({"slot": "r32[2] winner cleared", "rows": cur.rowcount})

        # r32[3] (M8): wizards (8) beat ur dads fav team (36) 64-44
        #              but interim run stored ur dads fav team (36) as winner.
        cur.execute("""
            UPDATE public.facup_bracket
               SET winner_seed = NULL, winner_entry = NULL, updated_at = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 3
               AND winner_seed = 36
        """, (FS,))
        ops.append({"slot": "r32[3] winner cleared", "rows": cur.rowcount})

        # ── 3. Clear wrong r16[1] entries (hands 35, ur dads fav team 36) ────
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed1 = NULL, entry_id1 = NULL,
                   seed2 = NULL, entry_id2 = NULL,
                   winner_seed = NULL, winner_entry = NULL,
                   score1 = NULL, score2 = NULL,
                   goals1 = NULL, goals2 = NULL,
                   updated_at = now()
             WHERE season = %s AND round = 'r16' AND matchup_idx = 1
               AND seed1 = 35
        """, (FS,))
        ops.append({"slot": "r16[1] cleared", "rows": cur.rowcount})

    return {
        "status": "repaired",
        "ops": ops,
        "next_step": "POST /api/facup/refresh?gw=32 to re-resolve R32 and advance correct winners to R16",
    }


@app.post("/api/admin/facup-repair-r32b", tags=["facup"])
def admin_facup_repair_r32b(_: None = Depends(require_admin)):
    """
    Second-pass data repair for remaining R32 bracket issues:

    1. R32[1]:  Soccer Team (39) was a wrong participant — should be somethimg (24).
                Fix seed2/entry_id2, set correct winner (seed24 won 56-48).
    2. R32[10]: I miss jamie vardy (14) was recorded as winner but Cech Mate (19)
                actually had more points (73 vs 67). Fix winner.
    3. R32[13]: Peps Lads (23) was recorded as winner but Beans and Rice (10)
                actually had more points (58 vs 50). Fix winner.
    4. R32[16] and R32[17]: Phantom rows that shouldn't exist — delete them.
    5. R16[0].seed2:  Update from Soccer Team (39) → somethimg (24).
    6. R16[5].seed1:  Update from I miss jamie vardy (14) → Cech Mate (19).
    7. R16[6].seed2:  Update from Peps Lads (23) → Beans and Rice (10).
    8. Sync all bracket scores from facup_gw_scores.
    """
    import psycopg as pg
    from psycopg.rows import dict_row
    from facup_db import DB_URL, SEASON as FS, sync_bracket_scores

    ops = []
    with pg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:

        # ── 1. Fix R32[1]: correct participant is somethimg (seed24, entry 4319478) ──
        # Original bug placed Soccer Team (39) here instead.
        # Correct match: Bend It Like Declan (seed9, 48pts) vs somethimg (seed24, 56pts)
        # → somethimg wins
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed2        = 24,
                   entry_id2    = 4319478,
                   winner_seed  = 24,
                   winner_entry = 4319478,
                   updated_at   = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 1
        """, (FS,))
        ops.append(f"r32[1]: fixed seed2=24 (somethimg), winner=seed24; affected={cur.rowcount}")

        # ── 2. Fix R32[10]: correct winner is Cech Mate (seed19, 73pts > 67pts) ──
        # Early cron captured interim score 13-0 and resolved to wrong winner seed14.
        cur.execute("""
            UPDATE public.facup_bracket
               SET winner_seed  = 19,
                   winner_entry = 4350516,
                   updated_at   = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 10
        """, (FS,))
        ops.append(f"r32[10]: fixed winner=seed19 (Cech Mate); affected={cur.rowcount}")

        # ── 3. Fix R32[13]: correct winner is Beans and Rice (seed10, 58pts > 50pts) ──
        # Early cron resolved tie as 0-0 but Peps Lads won goals tiebreaker (2 vs 0).
        # Final scores show Beans and Rice clearly won.
        cur.execute("""
            UPDATE public.facup_bracket
               SET winner_seed  = 10,
                   winner_entry = 5596813,
                   updated_at   = now()
             WHERE season = %s AND round = 'r32' AND matchup_idx = 13
        """, (FS,))
        ops.append(f"r32[13]: fixed winner=seed10 (Beans and Rice); affected={cur.rowcount}")

        # ── 4. Delete phantom R32[16] and R32[17] ──
        cur.execute("""
            DELETE FROM public.facup_bracket
             WHERE season = %s AND round = 'r32' AND matchup_idx IN (16, 17)
        """, (FS,))
        ops.append(f"r32[16,17]: deleted phantom rows; affected={cur.rowcount}")

        # ── 5. Fix R16[0].seed2: somethimg (24) beat Soccer Team in R32[1] ──
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed2        = 24,
                   entry_id2    = 4319478,
                   updated_at   = now()
             WHERE season = %s AND round = 'r16' AND matchup_idx = 0
        """, (FS,))
        ops.append(f"r16[0]: fixed seed2=24 (somethimg); affected={cur.rowcount}")

        # ── 6. Fix R16[5].seed1: Cech Mate (19) actually won R32[10] ──
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed1        = 19,
                   entry_id1    = 4350516,
                   updated_at   = now()
             WHERE season = %s AND round = 'r16' AND matchup_idx = 5
        """, (FS,))
        ops.append(f"r16[5]: fixed seed1=19 (Cech Mate); affected={cur.rowcount}")

        # ── 7. Fix R16[6].seed2: Beans and Rice (10) actually won R32[13] ──
        cur.execute("""
            UPDATE public.facup_bracket
               SET seed2        = 10,
                   entry_id2    = 5596813,
                   updated_at   = now()
             WHERE season = %s AND round = 'r16' AND matchup_idx = 6
        """, (FS,))
        ops.append(f"r16[6]: fixed seed2=10 (Beans and Rice); affected={cur.rowcount}")

    # ── 8. Sync all bracket scores from facup_gw_scores ──
    synced = sync_bracket_scores(FS)
    ops.append(f"sync_bracket_scores: updated {synced} rows")

    return {"status": "repaired", "ops": ops}


@app.post("/api/admin/facup-full-reset", tags=["facup"])
def admin_facup_full_reset(_: None = Depends(require_admin)):
    """
    Full bracket reset implementing the corrected 40-team design:
      R1  (GW31): 8 matches — seeds 25-40 play in
      R32 (GW32): 16 matches — seeds 1-24 + 8 R1 winners
      R16/QF/SF/Final/3rd: empty slots for future rounds

    Wipes all existing 2025-26 bracket rows and re-inserts from scratch.
    After calling this, run:
      POST /api/facup/refresh?gw=31  → resolves R1 + advances to R32
      POST /api/facup/refresh?gw=32  → resolves R32 + advances to R16
    """
    import psycopg as pg
    from psycopg.rows import dict_row
    from facup_db import DB_URL, SEASON as FS

    # Seed → entry_id map (same as facup_scores.py SEED_ENTRY_MAP)
    SEED_ENTRY: dict[int, int] = {
        1:6679946, 2:3577847, 3:4141448, 4:5252413, 5:4087698, 6:6683423,
        7:1520141, 8:7349746, 9:1270351, 10:5596813, 11:5361599, 12:5849758,
        13:6790800, 14:4483868, 15:5066840, 16:7934939, 17:617475, 18:1906849,
        19:4350516, 20:6197359, 21:3239682, 22:4342758, 23:4690925, 24:4319478,
        25:5466499, 26:4080174, 27:4137251, 28:6802392, 29:1512563, 30:6921329,
        31:7937084, 32:6812648, 33:5130249, 34:4286391, 35:4285068, 36:6542694,
        37:4088389, 38:6527451, 39:5356734, 40:7977200,
    }

    # R1: 8 matches (GW31), seeds 25-40
    # M1:25v40 M2:26v39 M3:27v38 M4:28v37 M5:29v36 M6:30v35 M7:31v34 M8:32v33
    r1_rows = [
        (FS, "r1", 0, 31, 25, 40, SEED_ENTRY[25], SEED_ENTRY[40]),
        (FS, "r1", 1, 31, 26, 39, SEED_ENTRY[26], SEED_ENTRY[39]),
        (FS, "r1", 2, 31, 27, 38, SEED_ENTRY[27], SEED_ENTRY[38]),
        (FS, "r1", 3, 31, 28, 37, SEED_ENTRY[28], SEED_ENTRY[37]),
        (FS, "r1", 4, 31, 29, 36, SEED_ENTRY[29], SEED_ENTRY[36]),
        (FS, "r1", 5, 31, 30, 35, SEED_ENTRY[30], SEED_ENTRY[35]),
        (FS, "r1", 6, 31, 31, 34, SEED_ENTRY[31], SEED_ENTRY[34]),
        (FS, "r1", 7, 31, 32, 33, SEED_ENTRY[32], SEED_ENTRY[33]),
    ]

    # R32: 16 matches (GW32), seeds 1-24 pre-seeded; R1 winner slots have NULL seed2
    # slot 0: seed1 vs WM8 | slot 3: seed8 vs WM1 | slot 4: seed5 vs WM4
    # slot 7: seed4 vs WM5 | slot 8: seed3 vs WM6 | slot 11: seed6 vs WM3
    # slot 12: seed7 vs WM2 | slot 15: seed2 vs WM7
    def e(s): return SEED_ENTRY.get(s)
    r32_rows = [
        (FS, "r32",  0, 32,  1, None, e(1),  None),   # seed1 vs WM8
        (FS, "r32",  1, 32,  9,   24, e(9),  e(24)),
        (FS, "r32",  2, 32, 16,   17, e(16), e(17)),
        (FS, "r32",  3, 32,  8, None, e(8),  None),   # seed8 vs WM1
        (FS, "r32",  4, 32,  5, None, e(5),  None),   # seed5 vs WM4
        (FS, "r32",  5, 32, 13,   20, e(13), e(20)),
        (FS, "r32",  6, 32, 12,   21, e(12), e(21)),
        (FS, "r32",  7, 32,  4, None, e(4),  None),   # seed4 vs WM5
        (FS, "r32",  8, 32,  3, None, e(3),  None),   # seed3 vs WM6
        (FS, "r32",  9, 32, 11,   22, e(11), e(22)),
        (FS, "r32", 10, 32, 14,   19, e(14), e(19)),
        (FS, "r32", 11, 32,  6, None, e(6),  None),   # seed6 vs WM3
        (FS, "r32", 12, 32,  7, None, e(7),  None),   # seed7 vs WM2
        (FS, "r32", 13, 32, 10,   23, e(10), e(23)),
        (FS, "r32", 14, 32, 15,   18, e(15), e(18)),
        (FS, "r32", 15, 32,  2, None, e(2),  None),   # seed2 vs WM7
    ]

    # R16/QF/SF/Final/3rd: empty placeholders
    empty_rounds = (
        [("r16", i, 33) for i in range(8)] +
        [("qf",  i, 34) for i in range(4)] +
        [("sf",  i, 35) for i in range(2)] +
        [("final", 0, 36), ("3rd", 0, 36)]
    )
    empty_rows = [(FS, rnd, idx, gw) for rnd, idx, gw in empty_rounds]

    with pg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        # Wipe existing bracket
        cur.execute("DELETE FROM public.facup_bracket WHERE season = %s", (FS,))
        deleted = cur.rowcount

        # Insert R1
        cur.executemany("""
            INSERT INTO public.facup_bracket
                (season, round, matchup_idx, gw, seed1, seed2, entry_id1, entry_id2)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, r1_rows)

        # Insert R32
        cur.executemany("""
            INSERT INTO public.facup_bracket
                (season, round, matchup_idx, gw, seed1, seed2, entry_id1, entry_id2)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, r32_rows)

        # Insert empty future rounds
        cur.executemany("""
            INSERT INTO public.facup_bracket (season, round, matchup_idx, gw)
            VALUES (%s, %s, %s, %s)
        """, empty_rows)

    return {
        "status": "reset",
        "deleted": deleted,
        "inserted": {"r1": len(r1_rows), "r32": len(r32_rows), "future_rounds": len(empty_rows)},
        "next_steps": [
            "POST /api/facup/refresh?gw=31  → fetch R1 scores + advance winners to R32",
            "POST /api/facup/refresh?gw=32  → fetch R32 scores + advance winners to R16",
        ],
    }


@app.get("/api/admin/facup-debug", tags=["facup"])
def admin_facup_debug(_: None = Depends(require_admin)):
    """
    Inspect current DB state: bracket rows + gw_scores for rounds r32 and r16.
    Useful for diagnosing 0-0 scores or missing entry_ids.
    """
    import psycopg as pg
    from psycopg.rows import dict_row
    from facup_db import DB_URL, SEASON as FS

    with pg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT round, matchup_idx, gw,
                   seed1, seed2, entry_id1, entry_id2,
                   score1, score2, goals1, goals2,
                   winner_seed, winner_entry
            FROM public.facup_bracket
            WHERE season = %s AND round IN ('r32','r16','qf','sf','final','3rd')
            ORDER BY
                CASE round WHEN 'r32' THEN 1 WHEN 'r16' THEN 2 WHEN 'qf' THEN 3
                           WHEN 'sf' THEN 4 WHEN 'final' THEN 5 WHEN '3rd' THEN 6 END,
                matchup_idx
        """, (FS,))
        bracket_rows = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT gw, entry_id, display_name, gw_points, gw_goals, fetched_at
            FROM public.facup_gw_scores
            WHERE gw IN (32, 33, 34, 35, 36)
            ORDER BY gw, entry_id
        """)
        score_rows = [dict(r) for r in cur.fetchall()]

    return {"bracket": bracket_rows, "gw_scores": score_rows}


@app.post("/api/admin/facup-fix-entry-ids", tags=["facup"])
def admin_facup_fix_entry_ids(_: None = Depends(require_admin)):
    """
    For every bracket row where entry_id1/entry_id2 is NULL but the seed is known,
    populate the entry_id from SEED_ENTRY_MAP. Then sync all bracket scores from
    facup_gw_scores. Call this if resolved matches show 0-0 scores.
    """
    import psycopg as pg
    from psycopg.rows import dict_row
    from facup_db import DB_URL, SEASON as FS, sync_bracket_scores
    from facup_scores import SEED_ENTRY_MAP

    ops = []
    with pg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        # Fix missing entry_id1
        cur.execute("""
            SELECT round, matchup_idx, seed1
            FROM public.facup_bracket
            WHERE season = %s AND entry_id1 IS NULL AND seed1 IS NOT NULL
        """, (FS,))
        for row in cur.fetchall():
            eid = SEED_ENTRY_MAP.get(row["seed1"])
            if eid:
                cur.execute("""
                    UPDATE public.facup_bracket
                    SET entry_id1 = %s, updated_at = now()
                    WHERE season = %s AND round = %s AND matchup_idx = %s
                """, (eid, FS, row["round"], row["matchup_idx"]))
                ops.append(f"set entry_id1={eid} (seed {row['seed1']}) on {row['round']}[{row['matchup_idx']}]")

        # Fix missing entry_id2
        cur.execute("""
            SELECT round, matchup_idx, seed2
            FROM public.facup_bracket
            WHERE season = %s AND entry_id2 IS NULL AND seed2 IS NOT NULL
        """, (FS,))
        for row in cur.fetchall():
            eid = SEED_ENTRY_MAP.get(row["seed2"])
            if eid:
                cur.execute("""
                    UPDATE public.facup_bracket
                    SET entry_id2 = %s, updated_at = now()
                    WHERE season = %s AND round = %s AND matchup_idx = %s
                """, (eid, FS, row["round"], row["matchup_idx"]))
                ops.append(f"set entry_id2={eid} (seed {row['seed2']}) on {row['round']}[{row['matchup_idx']}]")

    # Now sync scores
    synced = sync_bracket_scores(FS)
    return {"status": "done", "entry_id_fixes": ops, "scores_synced": synced}


@app.get("/api/facup/seasons", tags=["facup"])
def get_facup_seasons():
    """
    Return all FA Cup seasons with champion info.
    Champion name is read live from the DB final-round winner;
    falls back to static metadata for seasons without DB records.
    """
    import psycopg as pg
    from psycopg.rows import dict_row
    from facup_db import DB_URL

    # Static metadata — label and fallback champion for seasons not yet in DB
    STATIC_META: dict[str, dict] = {
        "2025-26": {"label": "2025-26 (v2)", "champion": "Marvin Ling"},
        "2024-25": {"label": "2024-25 (v1)", "champion": "Chandler Ashman"},
    }

    db_rows: dict[str, dict] = {}
    try:
        with pg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute("""
                SELECT b.season,
                       (SELECT gs.display_name
                          FROM public.facup_gw_scores gs
                         WHERE gs.entry_id = b.winner_entry
                         LIMIT 1) AS champion_team
                FROM public.facup_bracket b
                WHERE b.round = 'final'
                  AND b.winner_seed IS NOT NULL
                ORDER BY b.season DESC
            """)
            db_rows = {r["season"]: r for r in cur.fetchall()}
    except Exception:
        pass

    result = []
    for season in sorted(STATIC_META, reverse=True):
        meta = STATIC_META[season]
        db   = db_rows.get(season, {})
        champion = meta.get("champion") or db.get("champion_team") or None
        result.append({
            "season":   season,
            "label":    meta.get("label", season),
            "champion": champion,
            "href":     f"/facup/{season}",
        })

    return {"seasons": result}


def _compute_live_facup_seeds():
    """
    Shared setup for the live FA Cup projection endpoints: resolves last
    season's three trophy winners, pulls current-season standings, and
    computes this season's seed order. Raises HTTPException(503) with an
    explanatory detail if any of that isn't available yet.
    """
    from facup_seeding import compute_seeding
    from fixtures_refresh import last_season_label
    import psycopg as pg
    from psycopg.rows import dict_row
    from facup_db import DB_URL as FACUP_DB_URL

    # Fallback for seasons whose live facup_bracket final-round result is
    # unavailable (e.g. wiped by a bracket reset run after the season
    # ended) -- the live lookup below is still tried first, in case a
    # season's winner_entry is genuinely just not resolved yet.
    LAST_SEASON_FACUP_WINNER_FALLBACK = {
        "2025-26": "Marvin Ling",
    }

    last_season = last_season_label()

    prem_last = _load_season_rows("premier", last_season)
    champ_last = _load_season_rows("championship", last_season)
    prem_winner_row = next((r for r in prem_last if int(r.get("Position") or 0) == 1), None)
    champ_winner_row = next((r for r in champ_last if int(r.get("Position") or 0) == 1), None)
    if not prem_winner_row or not champ_winner_row:
        raise HTTPException(status_code=503, detail=f"No final standings on file for {last_season} yet")

    facup_winner = None
    try:
        with pg.connect(FACUP_DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute("""
                select winner_entry from public.facup_bracket
                where season = %s and round = 'final' and winner_entry is not null
            """, (last_season,))
            row = cur.fetchone()
            if row and row["winner_entry"]:
                cur.execute("""
                    select owner_name from public.manager
                    where coalesce(entry_id, (substring(fpl_team_url from '/entry/(\\d+)/'))::int) = %s
                """, (row["winner_entry"],))
                owner_row = cur.fetchone()
                facup_winner = owner_row["owner_name"] if owner_row else None
    except Exception:
        facup_winner = None

    if not facup_winner:
        facup_winner = LAST_SEASON_FACUP_WINNER_FALLBACK.get(last_season)

    if not facup_winner:
        raise HTTPException(status_code=503, detail=f"No FA Cup winner on file for {last_season} yet")

    prem_snap = get_latest_table_snapshot("premier")
    champ_snap = get_latest_table_snapshot("championship")
    prem_rows = (prem_snap or {}).get("payload", {}).get("rows", [])
    champ_rows = (champ_snap or {}).get("payload", {}).get("rows", [])
    if not prem_rows or not champ_rows:
        raise HTTPException(status_code=503, detail="No current standings available yet")

    try:
        seeds = compute_seeding(
            prem_rows, champ_rows,
            facup_winner, prem_winner_row["Owner"], champ_winner_row["Owner"],
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return seeds, last_season, facup_winner, prem_winner_row["Owner"], champ_winner_row["Owner"]


@app.get("/api/facup/projected-seeding", tags=["facup"])
def get_facup_projected_seeding(auto_qualify: int = Query(16)):
    """
    Live projected FA Cup seeding for the season currently in progress,
    computed fresh from current standings on every request -- nothing is
    cached or stored. Not final; the real seeding locks at the season's
    GW22 freeze.

    GW1-22 are "qualifying weeks": the top `auto_qualify` seeds (16 by
    default) go straight through to the Round of 32. Everyone else
    plays a single Qualification Round, paired best-remaining vs
    worst-remaining -- e.g. seed 17 vs seed 40, seed 18 vs seed 39, and
    so on. Only seeding + the Qualification Round are returned here,
    since Round of 32 pairing depends on who actually wins those
    matches.
    """
    from facup_seeding import compute_round1

    seeds, last_season, facup_winner, prem_winner, champ_winner = _compute_live_facup_seeds()

    r1 = compute_round1(seeds, auto_qualify=auto_qualify)
    basis = "score" if sum(s.score for s in seeds) > 0 else "alphabetical (preseason -- no scores yet)"

    resp = JSONResponse({
        "last_season": last_season,
        "facup_winner": facup_winner,
        "prem_winner": prem_winner,
        "champ_winner": champ_winner,
        "basis": basis,
        "auto_qualify": auto_qualify,
        "seeds": [s.__dict__ for s in seeds],
        "qualification_round": r1["round1"],
        "shape": r1["shape"],
    })
    resp.headers["Cache-Control"] = "public, max-age=300"
    return resp


@app.get("/api/facup/hypothetical-bracket", tags=["facup"])
def get_facup_hypothetical_bracket(auto_qualify: int = Query(16)):
    """
    "If the Cup started today" -- a full hypothetical bracket through
    every round, computed fresh from current standings on every
    request. Only the Qualification Round pairings are actually
    determined by seeding; everything past that assumes the better
    seed wins, purely for preview purposes (see
    facup_seeding.compute_hypothetical_bracket).
    """
    from facup_seeding import compute_hypothetical_bracket

    seeds, last_season, facup_winner, prem_winner, champ_winner = _compute_live_facup_seeds()

    bracket = compute_hypothetical_bracket(seeds, auto_qualify=auto_qualify)
    basis = "score" if sum(s.score for s in seeds) > 0 else "alphabetical (preseason -- no scores yet)"

    resp = JSONResponse({
        "last_season": last_season,
        "facup_winner": facup_winner,
        "prem_winner": prem_winner,
        "champ_winner": champ_winner,
        "basis": basis,
        "auto_qualify": auto_qualify,
        **bracket,
    })
    resp.headers["Cache-Control"] = "public, max-age=300"
    return resp


@app.post("/api/cron/trigger-facup", tags=["facup"])
def cron_facup(
    background: BackgroundTasks,
    token: str = Query(""),
    gw: str = Query("current"),
):
    """
    Lightweight cron endpoint for cron-job.org.
    Add a second cron job pointing here — same schedule as your league cron.
    Auth: ?token=<CRON_TOKEN>  (same env var you already use)
    """
    if token != os.environ.get("CRON_TOKEN", ""):
        raise HTTPException(status_code=403, detail="forbidden")

    if _FACUP_LOCK.locked():
        return {"status": "already-running"}

    _FACUP_LOCK.acquire()

    def _worker():
        try:
            resolved = resolve_gw_param(gw)
            refresh_facup_scores(resolved)
        finally:
            if _FACUP_LOCK.locked():
                _FACUP_LOCK.release()

    background.add_task(_worker)
    return {"status": "started", "gw": gw}
