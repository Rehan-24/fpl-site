import os, re, subprocess, sys, json
from datetime import datetime, timezone
from typing import Dict, Any
from psycopg import connect
from fastapi import APIRouter, HTTPException, Body, Header
from backend_db import fetch_manager_by_owner, fetch_manager_by_discord, update_manager_fields
from backend_db import (
    fetch_all_managers,
    fetch_manager_by_owner,
    fetch_manager_by_discord,
    update_manager_fields_by_owner,
    update_manager_fields_by_discord,
    latest_standing_for_owner,
)

router = APIRouter()
DB_URL = os.getenv("SUPABASE_DB_URL")
ALLOWED_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

# ---------- Helpers (FPL URL parsing) ----------

def parse_entry_id_from_url(url: str) -> str | None:
    if not url: return None
    m = re.search(r"/entry/(\d+)/", url)
    return m.group(1) if m else None

PREMIER_LEAGUE_ID = 723566
CHAMPIONSHIP_LEAGUE_ID = 850022

def league_id_for_manager(mgr: dict) -> int | None:
    league = str(mgr.get("current_league","") or "").lower()
    if "prem" in league: return PREMIER_LEAGUE_ID
    if "champ" in league: return CHAMPIONSHIP_LEAGUE_ID
    return None

def _row_to_manager(row):
    # adapt to your actual columns
    return {
        "name": row["owner_name"],
        "team": row["team"],
        "favorite_club": row["favorite_club"],
        "bio": row["bio"],
        "image_url": row["image_url"],
        "dynamic_image_url": row["dynamic_image_url"],
        "fpl_team_url": row["fpl_team_url"],
        "social_url": row["social_url"],
        "placements": row["placements"],
        "titles": row["titles"],
        "trophies": row["trophies"],
        "discord_id": str(row["discord_id"]) if row["discord_id"] is not None else None,
    }

def _get_by_id_or_name(cur, id_or_name: str):
    v = id_or_name.strip()
    # 1) try discord_id text match
    cur.execute("""
        select *
        from public.manager
        where discord_id is not null and discord_id::text = %s
        limit 1
    """, (v,))
    r = cur.fetchone()
    if r: return r
    # 2) try owner_name exact (case-insensitive)
    cur.execute("""
        select *
        from public.manager
        where lower(owner_name) = lower(%s)
        limit 1
    """, (v,))
    return cur.fetchone()

# ---------- API parity with legacy JSON routes ----------

@router.get("/managers")
def get_managers(owner: str | None = None):
    if owner:
        row = fetch_manager_by_owner(owner)
        if not row:
            raise HTTPException(status_code=404, detail="Manager not found")
        return row
    return fetch_all_managers()


@router.get("/user/{id_or_name}")
def get_user(id_or_name: str):
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")
    with connect(DB_URL) as conn, conn.cursor(row_factory=dict) as cur:
        row = _get_by_id_or_name(cur, id_or_name)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return _row_to_manager(row)

@router.post("/user/{id_or_name}")
def update_user(
    id_or_name: str,
    updates: dict = Body(...),
    actor_id: str = Header(default="")  # bot sends interaction.user.id here
):
    if not DB_URL:
        raise HTTPException(status_code=500, detail="DB not configured")
    if not isinstance(updates, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    fields = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    with connect(DB_URL) as conn, conn.cursor(row_factory=dict) as cur:
        row = _get_by_id_or_name(cur, id_or_name)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        # simple “self or mod” check — allow if actor matches record or if actor is in MOD_IDS
        mods = set(filter(None, (os.getenv("DISCORD_MOD_IDS","").split(",") if os.getenv("DISCORD_MOD_IDS") else [])))
        if str(row.get("discord_id") or "") != str(actor_id).strip() and str(actor_id).strip() not in mods:
            raise HTTPException(status_code=403, detail="Not allowed")

        sets = []
        params = []
        for k, v in fields.items():
            sets.append(f"{k} = %s")
            params.append(v)
        sets.append("updated_at = now()")

        params.append(row["id"])  # pk
        cur.execute(f"""
            update public.manager
            set {", ".join(sets)}
            where id = %s
        """, params)
        conn.commit()

        # return fresh row
        cur.execute("select * from public.manager where id = %s", (row["id"],))
        return _row_to_manager(cur.fetchone())

# ---------- Season stats (now from standings_row) ----------

@router.get("/owner/{owner}/season-stats")
def season_stats(owner: str):
    latest = latest_standing_for_owner(owner)
    if not latest:
        return {"stats": []}
    rows = [{
        "season": "CURRENT",
        "placement": latest["position"],
        "points": latest["points"],
        "score":  latest["score"],
        "overallRank": None,
    }]
    # mimic ALL-TIME footer (sum over what we have; for now just current)
    rows.append({
        "season": "ALL-TIME",
        "placement": None,
        "points": rows[0]["points"],
        "score":  rows[0]["score"],
        "overallRank": None
    })
    return {"stats": rows}

# ---------- Matchups (kept as file-based aggregation like before) ----------

HISTORY_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "results", "history", "matches_all.json"))
def load_history():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@router.get("/owner/{owner}/matchups")
def matchups_all_time(owner: str):
    mgr = fetch_manager_by_owner(owner)
    if not mgr:
        raise HTTPException(status_code=404, detail="Owner not found")

    my_entry_id = parse_entry_id_from_url(mgr.get("fpl_team_url", "") or "")
    owner_lower = owner.strip().lower()

    hist = load_history() or []
    vs: dict[str, dict] = {}

    for m in hist:
        a_id = (m.get("entry_1_entry") or "") and str(m.get("entry_1_entry"))
        b_id = (m.get("entry_2_entry") or "") and str(m.get("entry_2_entry"))
        a_pts, b_pts = m.get("entry_1_points"), m.get("entry_2_points")
        a_name = (m.get("entry_1_player_name") or "").strip()
        b_name = (m.get("entry_2_player_name") or "").strip()
        a_team = (m.get("entry_1_name") or a_name or "Unknown").strip()
        b_team = (m.get("entry_2_name") or b_name or "Unknown").strip()

        me_is_a = bool(my_entry_id and a_id == my_entry_id)
        me_is_b = bool(my_entry_id and b_id == my_entry_id)
        if not (me_is_a or me_is_b):
            me_is_a = (not my_entry_id) and (a_name.lower() == owner_lower)
            me_is_b = (not my_entry_id) and (b_name.lower() == owner_lower)
        if not (me_is_a or me_is_b):
            continue

        my_pts = a_pts if me_is_a else b_pts
        op_pts = b_pts if me_is_a else a_pts
        if my_pts is None or op_pts is None:
            continue

        opp_id   = b_id if me_is_a else a_id
        opp_team = b_team if me_is_a else a_team
        opp_name = b_name if me_is_a else a_name
        key = opp_id or opp_name.lower() or opp_team

        bucket = vs.setdefault(key, {
            "opponentTeamId": opp_id or key,
            "opponentTeam": opp_team or opp_name or "Unknown",
            "w": 0, "l": 0, "d": 0
        })
        if my_pts > op_pts: bucket["w"] += 1
        elif my_pts < op_pts: bucket["l"] += 1
        else: bucket["d"] += 1

    def score(r): return r["w"] - r["l"] + 0.25*r["d"]
    out = sorted(vs.values(), key=score, reverse=True)
    return {"scope":"all_time","vs": out}

# ---------- Fixtures (kept as live FPL fetch like before) ----------

@router.get("/owner/{owner}/fixtures")
def fixtures_next(owner: str):
    mgr = fetch_manager_by_owner(owner)
    if not mgr:
        raise HTTPException(status_code=404, detail="Owner not found")
    league_id = league_id_for_manager(mgr)
    entry_id = parse_entry_id_from_url(mgr.get("fpl_team_url","") or "")
    if not league_id or not entry_id:
        return {"fixtures": []}

    import requests
    url_base = f"https://fantasy.premierleague.com/api/leagues-h2h-matches/league/{league_id}/"
    page = 1
    results = []
    try:
        while True:
            r = requests.get(url_base, params={"page": page}, headers={"User-Agent":"tfpl-site"})
            if r.status_code != 200:
                break
            j = r.json()
            res = j.get("results", [])
            results.extend(res)
            if not j.get("has_next") or not res:
                break
            page += 1
    except Exception:
        return {"fixtures": []}

    upcoming = []
    now = datetime.now(timezone.utc)
    for m in results:
        e = m.get("event")
        a = m.get("entry_1_entry") or m.get("team_h_entry") or m.get("league_entry_1")
        b = m.get("entry_2_entry") or m.get("team_a_entry") or m.get("league_entry_2")
        if str(a) != str(entry_id) and str(b) != str(entry_id):
            continue
        if m.get("finished") or m.get("winner"):
            continue

        opp_entry = b if str(a) == str(entry_id) else a
        opp_name = m.get("entry_2_player_name") if str(a)==str(entry_id) else m.get("entry_1_player_name")
        opp_team = m.get("entry_2_name")        if str(a)==str(entry_id) else m.get("entry_1_name")
        homeAway = 'H' if str(a)==str(entry_id) else 'A'

        # crude FDR using last-season rank map (optional enhancement later)
        opp_key = (opp_name or "").strip().lower()
        fdr = 3  # neutral
        upcoming.append({
            "gw": e or None,
            "date": m.get("kickoff_time") or now.isoformat(),
            "opponentTeamId": str(opp_entry),
            "opponentTeam": opp_team or "Opponent",
            "opponentManagerId": str(opp_entry),
            "opponentManager": opp_name or "Unknown",
            "homeAway": homeAway,
            "fdr": int(fdr)
        })

    upcoming.sort(key=lambda x: (x["gw"] or 99))
    return {"fixtures": upcoming[:3] if len(upcoming)>3 else upcoming}

# ---------- Admin passthrough for your ingest script (unchanged) ----------

@router.post("/admin/ingest")
def admin_ingest():
    try:
        script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts", "ingest_h2h.py"))
        subprocess.check_call([sys.executable, script])
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@router.get("/debug/owner/{owner}")
def debug_owner(owner: str):
    mgr = fetch_manager_by_owner(owner)
    if not mgr:
        raise HTTPException(status_code=404, detail="Owner not found")
    entry_id = parse_entry_id_from_url(mgr.get("fpl_team_url", "") or "")
    hist = load_history()
    opps = {}
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
