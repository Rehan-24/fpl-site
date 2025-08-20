import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from backend_db import upsert_fixtures, recent_form_score, fdr_from_composite, fetch_all_managers
import re

FPL_BASE = "https://fantasy.premierleague.com/api"
ENTRY_RE = re.compile(r"/entry/(\d+)/")

def _parse_entry_id(url: str | None) -> int | None:
    if not url:
        return None
    m = ENTRY_RE.search(url)
    return int(m.group(1)) if m else None

def _managers_maps() -> tuple[dict[int, str], dict[int, str]]:
    owners = fetch_all_managers()
    entry_to_owner: dict[int, str] = {}
    entry_to_team: dict[int, str] = {}
    for m in owners:
        owner_name = m.get("owner") or m.get("owner_name") or m.get("name")
        if not owner_name:
            continue
        eid = m.get("fpl_entry_id") or _parse_entry_id(m.get("fpl_team_url"))
        if not eid:
            continue
        eid = int(eid)
        entry_to_owner[eid] = owner_name
        team_name = m.get("team_name") or m.get("team")
        if team_name:
            entry_to_team[eid] = team_name
    return entry_to_owner, entry_to_team

def _gw_window_from_bootstrap() -> tuple[int, int]:
    """
    Decide which GWs to fetch:
    - Prefer the one flagged 'is_next'
    - Else use 'is_current'
    - Return [start, start+2] (i.e., next 3 GWs), clamped to 1..38
    """
    try:
        r = requests.get(f"{FPL_BASE}/bootstrap-static/", timeout=10)
        r.raise_for_status()
        events = r.json().get("events", [])
        nxt = next((int(e["id"]) for e in events if e.get("is_next")), None)
        cur = next((int(e["id"]) for e in events if e.get("is_current")), None)
        if nxt:
            start = max(1, nxt - 1)   # include previous GW to lock in finished scores
            return start, min(38, nxt + 2)
        start = cur or 1
        return start, min(38, start + 2)
    except Exception:
        # fall back conservatively
        return 1, 3

def current_season_label() -> str:
    now = datetime.now(timezone.utc)
    y = now.year
    start = y if now.month >= 7 else (y - 1)
    return f"{start}-{str((start + 1) % 100).zfill(2)}"

def refresh_h2h_fixtures_for_league(league_id: int, league_name: str) -> int:
    season = current_season_label()
    entry_to_owner, entry_to_team = _managers_maps()

    # cache recent-form composites per owner to avoid repeated DB reads
    comp_cache: dict[str, float] = {}
    def owner_comp(owner: str) -> float:
        v = comp_cache.get(owner)
        if v is None:
            v = recent_form_score(owner, season, limit_matches=5)["composite"]
            comp_cache[owner] = v
        return v

    start_gw, end_gw = _gw_window_from_bootstrap()
    fixtures_rows: List[Dict[str, Any]] = []
    headers = {"User-Agent": "tfpl-site"}

    for gw in range(start_gw, end_gw + 1):
        page = 1
        while True:
            url = f"{FPL_BASE}/leagues-h2h-matches/league/{league_id}/"
            params = {"event": gw, "page": page}
            r = requests.get(url, params=params, headers=headers, timeout=20)
            r.raise_for_status()
            payload = r.json()
            results = payload.get("results") or []
            if not results and not payload.get("has_next"):
                break

            for fx in results:
                he = fx.get("entry_1_entry")
                ae = fx.get("entry_2_entry")
                if he is None or ae is None:
                    continue

                home_owner = entry_to_owner.get(int(he))
                away_owner = entry_to_owner.get(int(ae))
                if not home_owner or not away_owner:
                    # skip fixtures not between your managers
                    continue

                kickoff = fx.get("kickoff_time") or fx.get("event_start_time")
                kickoff_utc = datetime.fromisoformat(kickoff.replace("Z", "+00:00")) if kickoff else None
                finished = bool(fx.get("finished"))
                home_score = fx.get("entry_1_points")
                away_score = fx.get("entry_2_points")

                hc = owner_comp(home_owner)
                ac = owner_comp(away_owner)
                home_fdr = fdr_from_composite(ac)   # difficulty vs opponent
                away_fdr = fdr_from_composite(hc)

                fixtures_rows.append({
                    "season": season,
                    "league_id": int(league_id),
                    "gw": int(gw),
                    "fixture_id": int(fx["id"]),
                    "kickoff_utc": kickoff_utc,
                    "finished": finished,
                    "home_entry_id": int(he),
                    "home_team_name": entry_to_team.get(int(he)),
                    "home_owner": home_owner,
                    "home_score": home_score,
                    "away_entry_id": int(ae),
                    "away_team_name": entry_to_team.get(int(ae)),
                    "away_owner": away_owner,
                    "away_score": away_score,
                    "home_fdr": home_fdr,
                    "away_fdr": away_fdr,
                })

            if not payload.get("has_next"):
                break
            page += 1

    if fixtures_rows:
        upsert_fixtures(fixtures_rows)
    return len(fixtures_rows)
