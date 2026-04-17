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
from backend_db import insert_table_snapshot, get_latest_table_snapshot
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
