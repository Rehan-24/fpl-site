# backend/managers/index.py
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
import os, json

router = APIRouter()

DATA_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "managers.json")
)

ALLOWED_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

def _load_all():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load managers.json: {e}")

def _save_all(all_rows):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(all_rows, f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save managers.json: {e}")

@router.get("/managers")
def get_managers(owner: str = None):
    managers = _load_all()
    if owner:
        owner_lc = owner.lower()
        match = next((m for m in managers if str(m.get("name", "")).lower() == owner_lc), None)
        if not match:
            raise HTTPException(status_code=404, detail="Manager not found")
        return match
    return managers

@router.get("/user/{id}")
def get_user(id: str):
    managers = _load_all()
    id = id.strip()
    
    user = next(
        (
            m for m in managers 
            if str(m.get("discord_id", "")).strip() == id
            or str(m.get("name", "")).strip().lower() == id.lower()
        ),
        None
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/user/{id}")
def update_user(id: str, updates: Dict[str, Any] = Body(...)):
    """
    Update a manager by discord_id.
    Allowed fields: bio, favorite_club, social_url, image_url.
    """
    if not isinstance(updates, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    filtered = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    managers = _load_all()
    id = id.strip()

    idx = next(
        (
            i for i, m in enumerate(managers)
            if str(m.get("discord_id", "")).strip() == id
            or str(m.get("name", "")).strip().lower() == id.lower()
        ),
        None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="User not found")

    managers[idx].update(filtered)
    _save_all(managers)

    return {"ok": True, "updated": filtered, "user": managers[idx]}

@router.get("/username/{name}")
def get_user(name: str):
    managers = _load_all()
    name_str = str(name).strip()
    user = next(
        (m for m in managers if str(m.get("name", "")).strip() == name_str),
        None
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/username/{name}")
def update_user(name: str, updates: Dict[str, Any] = Body(...)):
    """
    Update a manager by name.
    Allowed fields: bio, favorite_club, social_url, image_url.
    """
    if not isinstance(updates, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    filtered = {k: v for k, v in updates.items() if k in ALLOWED_FIELDS}
    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    managers = _load_all()
    name_str = str(name).strip()
    idx = next(
        (i for i, m in enumerate(managers)
         if str(m.get("name", "")).strip() == name_str),
        None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="User not found")

    managers[idx].update(filtered)
    _save_all(managers)

    return {"ok": True, "updated": filtered, "user": managers[idx]}

# ===== New helpers for owner mapping, ranks, and entry IDs =====

def _load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def get_manager_by_owner(owner_name: str):
    rows = _load_all()
    owner_lower = owner_name.strip().lower()
    for r in rows:
        if str(r.get("name","")).strip().lower() == owner_lower:
            return r
    return None

def parse_entry_id_from_url(url: str) -> str | None:
    # e.g. https://fantasy.premierleague.com/entry/3577847/history
    if not url: return None
    m = re.search(r"/entry/(\d+)/", url)
    return m.group(1) if m else None

def load_last_season_ranks():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    prem = _load_json(os.path.join(base, "premier_gw38.json")) or []
    champ = _load_json(os.path.join(base, "championship_gw38.json")) or []
    rank_map = {}
    for row in prem:
        owner = str(row.get("Owner","")).strip()
        pos = int(row.get("Position")) if row.get("Position") is not None else None
        if owner and pos is not None:
            rank_map[owner.lower()] = ("Premier", pos, len(prem))
    for row in champ:
        owner = str(row.get("Owner","")).strip()
        pos = int(row.get("Position")) if row.get("Position") is not None else None
        if owner and pos is not None and owner.lower() not in rank_map:
            rank_map[owner.lower()] = ("Championship", pos, len(champ))
    return rank_map

RANKS_CACHE = load_last_season_ranks()

PREMIER_LEAGUE_ID = 723566
CHAMPIONSHIP_LEAGUE_ID = 850022

def league_id_for_manager(mgr: dict) -> int | None:
    league = str(mgr.get("current_league","") or "").lower()
    if "prem" in league: return PREMIER_LEAGUE_ID
    if "champ" in league: return CHAMPIONSHIP_LEAGUE_ID
    return None

# ===== API: season stats (all-time; uses whatever seasons we have) =====
@router.get("/owner/{owner}/season-stats")
def season_stats(owner: str):
    owner_clean = owner.strip()
    rows = []
    # Last season from GW38 snapshots (use whichever league contains the owner)
    rank_info = RANKS_CACHE.get(owner_clean.lower())
    if rank_info:
        league_name, pos, league_size = rank_info
        # Try to find full row for points/score
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        fname = "premier_gw38.json" if league_name == "Premier" else "championship_gw38.json"
        slab = _load_json(os.path.join(base, fname)) or []
        row = next((r for r in slab if str(r.get("Owner","")).strip().lower() == owner_clean.lower()), None)
        points = int(row.get("Points")) if row and row.get("Points") is not None else 0
        score  = int(row.get("Score")) if row and row.get("Score") is not None else 0
        rows.append({
            "season": "2024-25",
            "placement": pos,
            "points": points,
            "score": score,
            "overallRank": None
        })
    # ALL-TIME footer
    if rows:
        rows.append({
            "season": "ALL-TIME",
            "placement": None,
            "points": sum(r["points"] for r in rows if r["season"]!="ALL-TIME"),
            "score": sum(r["score"]  for r in rows if r["season"]!="ALL-TIME"),
            "overallRank": None
        })
    return {"stats": rows}

# ===== API: matchups (all-time). Uses local history store if present; else empty. =====
HISTORY_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "results", "history", "matches_all.json"))

def load_history():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@router.get("/owner/{owner}/matchups")
def matchups_all_time(owner: str):
    owner_lower = owner.strip().lower()
    hist = load_history()  # list of dicts: {event, date, entry_1, entry_2, points_1, points_2, team_1, team_2, owner_1, owner_2}
    vs = {}
    for m in hist:
        if str(m.get("owner_1","")).strip().lower() == owner_lower or str(m.get("owner_2","")).strip().lower() == owner_lower:
            me_is_1 = str(m.get("owner_1","")).strip().lower() == owner_lower
            my_pts = m.get("points_1") if me_is_1 else m.get("points_2")
            op_pts = m.get("points_2") if me_is_1 else m.get("points_1")
            opp = m.get("owner_2") if me_is_1 else m.get("owner_1")
            opp_team = m.get("team_2") if me_is_1 else m.get("team_1")
            key = (opp or "").strip().lower()
            if not key:
                continue
            bucket = vs.setdefault(key, {"opponentTeamId": key, "opponentTeam": opp_team or opp or "Unknown", "w":0,"l":0,"d":0})
            if my_pts is None or op_pts is None:
                continue
            if my_pts > op_pts: bucket["w"] += 1
            elif my_pts < op_pts: bucket["l"] += 1
            else: bucket["d"] += 1
    return {"scope":"all_time", "vs": list(vs.values())}

# ===== API: fixtures (next 3) with FDR using fallback from ranks until >=5 games =====
@router.get("/owner/{owner}/fixtures")
def fixtures_next(owner: str):
    mgr = get_manager_by_owner(owner)
    if not mgr:
        raise HTTPException(status_code=404, detail="Owner not found")
    league_id = league_id_for_manager(mgr)
    entry_id = parse_entry_id_from_url(mgr.get("fpl_team_url","") or "")
    if not league_id or not entry_id:
        return {"fixtures": []}

    # live fetch FPL matches for this league; paginate
    url_base = f"https://fantasy.premierleague.com/api/leagues-h2h-matches/league/{league_id}/"
    page = 1
    results = []
    try:
        import requests
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
        # fetch error -> empty fixtures
        return {"fixtures": []}

    # filter to this entry's fixtures and those not yet played (no winner? or is_result=False)
    upcoming = []
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    for m in results:
        # fields (names follow FPL payload conventions; may need adjustment)
        e = m.get("event")                     # gw
        a = m.get("entry_1_entry") or m.get("team_h_entry") or m.get("league_entry_1")
        b = m.get("entry_2_entry") or m.get("team_a_entry") or m.get("league_entry_2")
        # identify if my match
        if str(a) != str(entry_id) and str(b) != str(entry_id):
            continue
        # FPL payload often has 'finished' or 'started'; use kickoff if available
        kickoff = m.get("kickoff_time")
        is_finished = bool(m.get("finished") or m.get("winner"))
        if is_finished:
            continue
        # opponent
        opp_entry = b if str(a) == str(entry_id) else a
        opp_name = m.get("entry_2_player_name") if str(a)==str(entry_id) else m.get("entry_1_player_name")
        opp_team = m.get("entry_2_name") if str(a)==str(entry_id) else m.get("entry_1_name")
        homeAway = 'H' if str(a)==str(entry_id) else 'A'

        # FDR using fallback: if we don't have last-5 for opponent (we likely don't here), map by ranks
        # RANKS_CACHE keyed by owner name; try opponent owner first else neutral 3
        owner_key = (opp_name or "").strip().lower()
        if owner_key in RANKS_CACHE:
            _, pos, size = RANKS_CACHE[owner_key]
            # map rank to difficulty 1..5 where 1 easiest => turn into 5 toughest (we return difficulty for ME)
            # top rank (1) should be toughest => 5
            percentile = (pos - 1) / max(1, size - 1)
            fdr = 5 - round(percentile * 4)
        else:
            fdr = 3

        upcoming.append({
            "gw": e or None,
            "date": kickoff or now.isoformat(),
            "opponentTeamId": str(opp_entry),
            "opponentTeam": opp_team or "Opponent",
            "opponentManagerId": str(opp_entry),
            "opponentManager": opp_name or "Unknown",
            "homeAway": homeAway,
            "fdr": int(fdr)
        })

    # return next 3 by gw ascending
    upcoming.sort(key=lambda x: (x["gw"] or 99))
    return {"fixtures": upcoming[:3] if len(upcoming)>3 else upcoming}

@router.post("/admin/ingest")
def admin_ingest():
    """Trigger ingestion of H2H matches for both leagues and rebuild history + recent_form.
    Call this from a cron or manually after the GW deadline."""
    try:
        import subprocess, sys, os
        script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts", "ingest_h2h.py"))
        subprocess.check_call([sys.executable, script])
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    
@router.get("/debug/owner/{owner}")
def debug_owner(owner: str):
    """
    Debug endpoint to verify owner mapping and matchup data.
    """
    mgr = get_manager_by_owner(owner)
    if not mgr:
        raise HTTPException(status_code=404, detail="Owner not found in managers.json")

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
        "manager_found": True,
        "fpl_team_url": mgr.get("fpl_team_url"),
        "history_file_exists": os.path.exists("backend/results/history/matches_all.json"),
        "num_matches_in_history": len(hist),
        "num_opponents_found": len(opps),
        "sample_opponents": list(opps.items())[:5],  # first few opponents + match counts
    }


