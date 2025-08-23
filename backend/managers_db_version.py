import os, re, subprocess, sys, json, requests
import psycopg
from psycopg.rows import dict_row
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body, Header, Query
from backend_db import get_season_stats_for_owner
from backend_db import get_manager_fixtures
from fixtures_refresh import current_season_label
from backend_db import (
    fetch_all_managers,
    fetch_manager_by_owner,
    fetch_manager_by_discord,
    latest_standing_for_owner,
)
from backend_db import list_manager_seasons
from backend_db import get_matchups_for_owner as db_get_matchups_for_owner


router = APIRouter()
DB_URL = os.getenv("SUPABASE_DB_URL")
ADMIN_KEY = os.getenv("ADMIN_API_KEY", "")
ALLOWED_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

HISTORY_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "results", "history"))
os.makedirs(HISTORY_DIR, exist_ok=True)

# ---------- Helpers ----------
def parse_entry_id_from_url(url: str) -> Optional[str]:
    if not url:
        return None
    m = re.search(r"/entry/(\d+)/", url)
    return m.group(1) if m else None

PREMIER_LEAGUE_ID = 723566
CHAMPIONSHIP_LEAGUE_ID = 850022

def league_id_for_manager(mgr: dict) -> Optional[int]:
    league = str(mgr.get("current_league", "") or "").lower()
    if "prem" in league: return PREMIER_LEAGUE_ID
    if "champ" in league: return CHAMPIONSHIP_LEAGUE_ID
    return None

def _row_to_manager(row: Dict[str, Any]) -> Dict[str, Any]:
    # tolerate either team/team_name columns, etc.
    team = row.get("team") or row.get("team_name")

    # compute a total_experience fallback if years_playing is missing
    years_playing = row.get("years_playing")
    premier_years = row.get("premier_years")
    championship_years = row.get("championship_years")
    total_experience = (
        years_playing
        if years_playing is not None
        else (
            (premier_years or 0) + (championship_years or 0)
            if (premier_years is not None or championship_years is not None)
            else None
        )
    )

    return {
        "name": row.get("owner_name"),
        "team": team,

        # profile bits
        "favorite_club": row.get("favorite_club"),
        "bio": row.get("bio"),
        "image_url": row.get("image_url"),
        "dynamic_image_url": row.get("dynamic_image_url"),
        "fpl_team_url": row.get("fpl_team_url"),
        "social_url": row.get("social_url"),
        "current_league": row.get("current_league"),

        # 🟢 stats needed by the Stats card
        "years_playing": years_playing,
        "premier_years": premier_years,
        "championship_years": championship_years,
        "promotions": row.get("promotions"),
        "relegations": row.get("relegations"),
        "best_finish": row.get("best_finish"),
        "placements": row.get("placements"),

        # convenient alias so UI can show “Total Experience”
        "total_experience": total_experience,

        # trophies/title metadata you already had
        "titles": row.get("titles"),
        "titles_list": row.get("titles_list"),
        "trophies": row.get("trophies") or [],

        # misc
        "discord_id": str(row["discord_id"]) if row.get("discord_id") is not None else None,
    }


def _get_by_id_or_name(cur, id_or_name: str) -> Optional[Dict[str, Any]]:
    v = id_or_name.strip()
    # 1) try discord_id text match
    cur.execute("""
        select * from public.manager
        where discord_id is not null and discord_id::text = %s
        limit 1
    """, (v,))
    r = cur.fetchone()
    if r:
        return r
    # 2) owner_name (case-insensitive)
    cur.execute("""
        select * from public.manager
        where lower(owner_name) = lower(%s)
        limit 1
    """, (v,))
    return cur.fetchone()

def _fixtures_payload(owner: str, show_all: bool, limit: int | None):
    season = current_season_label()
    rows = get_manager_fixtures(
        owner,
        season,
        include_past=bool(show_all),
        limit_next=(None if show_all else (limit or 3)),
    )
    return {"season": season, "fixtures": rows}

def current_gw():
    r = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/", timeout=10)
    r.raise_for_status()
    events = r.json().get("events", [])
    # prefer next else current; when between deadlines, next is fine
    nxt = next((e for e in events if e.get("is_next")), None)
    cur = next((e for e in events if e.get("is_current")), None)
    ev = nxt or cur
    if not ev: raise RuntimeError("No event found")
    return int(ev["id"])


# --- Fixtures (DB-backed, supports ?all=1 & ?limit=3) ---

# Canonical path
@router.get("/managers/owner/{owner}/fixtures")
def fixtures_owner_canonical(owner: str, all: bool = Query(False), limit: int | None = Query(None)):
    return _fixtures_payload(owner, all, limit)

# Alias path used by your UI (/api/managers/{owner}/fixtures)
@router.get("/managers/{owner}/fixtures")
def fixtures_owner_alias(owner: str, all: bool = Query(False), limit: int | None = Query(None)):
    return _fixtures_payload(owner, all, limit)

# Season stats
#@router.get("/managers/owner/{owner}/season-stats")
#def season_stats_canonical(owner: str):
#    return season_stats(owner)  # reuse your function below

@router.get("/managers/{owner}/seasons")
def seasons_for_owner(owner: str):
    rows = list_manager_seasons(owner)
    # normalize keys for frontend
    out = []
    for r in rows:
        out.append({
            "season": r.get("season"),
            "league": r.get("league"),
            "placement": r.get("placement"),
            "points": r.get("league_points"),
            "score": r.get("total_score"),
            "overallRank": r.get("overall_rank"),
        })
    return {"owner": owner, "seasons": out}

# (optional) keep legacy path but serve real data now
@router.get("/managers/{owner}/season-stats")
def season_stats(owner: str):
    rows = get_season_stats_for_owner(owner)
    return {"stats": rows}

# Matchups
@router.get("/managers/owner/{owner}/matchups")
def matchups_canonical(owner: str):
    return matchups_all_time(owner)

# ---------- API parity with legacy JSON routes ----------
@router.get("/managers")
def get_managers(owner: Optional[str] = None):
    if owner:
        row = fetch_manager_by_owner(owner)
        if not row:
            raise HTTPException(status_code=404, detail="Manager not found")
        return _row_to_manager(row)
    return [ _row_to_manager(r) for r in fetch_all_managers() ]

@router.get("/user/{id_or_name}")
def get_user(id_or_name: str):
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            row = _get_by_id_or_name(cur, id_or_name)
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            return _row_to_manager(row)

@router.post("/user/{id_or_name}")
def update_user(
    id_or_name: str,
    updates: Dict[str, Any] = Body(...),
    x_actor_id: str = Header(default="", alias="X-Actor-Id"),  # prefer explicit header from bot
    actor_id_hdr: str = Header(default="", alias="Actor-Id"),  # fallback if you used Actor-Id
    x_api_key: str = Header(default="", alias="X-Api-Key"),    # optional admin/bot key
):
    """
    Back-compat update by discord_id OR owner_name. Only allows profile fields.
    Permission model:
      - If BOT_API_KEY env var is set and X-Api-Key matches, bypass actor check.
      - Else, require the actor id to match the record's discord_id OR to be in DISCORD_MOD_IDS.
      - Set ENFORCE_ACTOR=0 to disable the actor check entirely (development).
    """
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")
    if not isinstance(updates, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    fields = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            row = _get_by_id_or_name(cur, id_or_name)
            if not row:
                raise HTTPException(status_code=404, detail="User not found")

            # --- permissions ---
            enforce = (os.getenv("ENFORCE_ACTOR", "1") != "0")
            bot_key = os.getenv("API_KEY", "")
            if enforce:
                # If a bot key is configured and provided, allow
                if bot_key and x_api_key and x_api_key == bot_key:
                    pass
                else:
                    actor = (x_actor_id or actor_id_hdr or "").strip()
                    mods = set(
                        s.strip()
                        for s in (os.getenv("DISCORD_MOD_IDS", "") or "").split(",")
                        if s.strip()
                    )
                    if str(row.get("discord_id") or "") != actor and actor not in mods:
                        raise HTTPException(status_code=403, detail="Not allowed")

            # --- update ---
            sets = [f"{k} = %s" for k in fields.keys()]
            params = list(fields.values())
            sets.append("updated_at = now()")
            params.append(row["id"])  # pk

            cur.execute(f"""
                update public.manager
                set {", ".join(sets)}
                where id = %s
                returning *
            """, params)
            updated = cur.fetchone()
            conn.commit()
            return {"ok": True, "updated": fields, "user": _row_to_manager(updated)}

# ---------- Season stats (DB) ----------
@router.get("/managers/{owner}/season-stats")
def season_stats(owner: str):
    latest = latest_standing_for_owner(owner)
    if not latest:
        return {"stats": []}
    rows = [{
        "season": "CURRENT",
        "placement": latest.get("position"),
        "points": latest.get("points"),
        "score":  latest.get("score"),
        "overallRank": None,
    }]
    rows.append({
        "season": "ALL-TIME",
        "placement": None,
        "points": rows[0]["points"],
        "score":  rows[0]["score"],
        "overallRank": None
    })
    return {"stats": rows}

# ---------- Matchups (file-backed, unchanged) ----------
HISTORY_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "results", "history", "matches_all.json"))
def load_history():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@router.get("/managers/{owner}/matchups")
def matchups_all_time(owner: str):
    vs = db_get_matchups_for_owner(owner)
    # shape is already consumable by your UI; adjust keys as needed
    return {"scope": "all_time", "vs": vs}

# ---------- Admin passthrough ----------
@router.post("/admin/ingest")
def admin_ingest():
    """
    Runs scripts/ingest_h2h.py and returns its stdout/stderr so we can see why it failed.
    Also sets CWD to the script folder to make relative paths inside the script work.
    """
    try:
        script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts", "ingest_h2h.py"))
        script_dir = os.path.dirname(script)

        # Pass through env; sometimes the script needs league IDs or DB URL
        env = os.environ.copy()

        res = subprocess.run(
            [sys.executable, script],
            cwd=script_dir,                  # <-- critical if the script uses relative paths
            env=env,
            capture_output=True,
            text=True,
        )
        ok = (res.returncode == 0)
        # Return the tail of stdout/stderr to keep payload small but useful
        tail = 4000
        return {
            "ok": ok,
            "returncode": res.returncode,
            "stdout": res.stdout[-tail:],
            "stderr": res.stderr[-tail:],
        }
    except Exception as e:
        return {"ok": False, "error": repr(e)}

@router.get("/debug/owner/{owner}")
def debug_owner(owner: str):
    mgr = fetch_manager_by_owner(owner)
    if not mgr:
        raise HTTPException(status_code=404, detail="Owner not found")
    entry_id = parse_entry_id_from_url(mgr.get("fpl_team_url", "") or "")
    hist = load_history()
    opps: Dict[str, int] = {}
    for m in hist:
        if not entry_id:
            continue
        if str(m.get("entry_1_entry")) == str(entry_id) or str(m.get("entry_2_entry")) == str(entry_id):
            opp_id = str(m.get("entry_2_entry")) if str(m.get("entry_1_entry")) == str(entry_id) else str(m.get("entry_1_entry"))
            opps[opp_id] = opps.get(opp_id, 0) + 1
    return {
        "owner": owner,
        "entry_id": entry_id,
        "history_file_exists": os.path.exists(HISTORY_FILE),
        "num_matches_in_history": len(hist),
        "num_opponents_found": len(opps),
        "sample_opponents": list(opps.items())[:5],
    }
    
@router.get("/admin/fixtures-stats")
def fixtures_stats():
    import psycopg
    from psycopg.rows import dict_row
    DB_URL = os.getenv("SUPABASE_DB_URL")
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute("SELECT season, COUNT(*) AS n FROM public.fixtures_h2h GROUP BY season ORDER BY season DESC;")
        by_season = cur.fetchall()
        cur.execute("SELECT DISTINCT league_id FROM public.fixtures_h2h ORDER BY 1;")
        leagues = [r["league_id"] for r in cur.fetchall()]
        cur.execute("SELECT home_owner AS owner FROM public.fixtures_h2h LIMIT 1;")
        sample_owner = (cur.fetchone() or {}).get("owner")
    return {"by_season": by_season, "leagues": leagues, "sample_owner": sample_owner}

@router.post("/admin/refresh-fpl-links")
def refresh_fpl_links_endpoint(
    gw: str = Query("current"),                         # accept query param (?gw=current or ?gw=12)
    x_api_key: str = Header(default="", alias="X-Api-Key")
):
    if x_api_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")

    # resolve current GW if requested
    if gw == "current":
        gw = str(current_gw())
    else:
        gw = str(int(gw))  # normalize

    sql = """
      update public.manager m
      set fpl_team_url =
        case
          when m.fpl_team_url ~ '/entry/[0-9]+/event/[0-9]+' then
            regexp_replace(m.fpl_team_url, '/event/[0-9]+', '/event/' || %s::text, 'g')
          when m.fpl_team_url ~ '/entry/[0-9]+/history/?$' then
            regexp_replace(m.fpl_team_url, '/history/?$', '/event/' || %s::text)
          when m.fpl_team_url ~ '/entry/[0-9]+/?$' then
            m.fpl_team_url || '/event/' || %s::text
          else
            'https://fantasy.premierleague.com/entry/' || m.fpl_entry_id::text || '/event/' || %s::text
        end
      where m.fpl_entry_id is not null
    """
    with psycopg.connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(sql, (gw, gw, gw, gw))
        updated = cur.rowcount
        conn.commit()

    return {"ok": True, "gw": int(gw), "updated": updated}

