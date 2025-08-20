import os, requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from backend_db import upsert_fixtures, recent_form_score, fdr_from_composite, fetch_all_managers
import re

ENTRY_RE = re.compile(r"/entry/(\d+)/")

def _parse_entry_id(url: str | None) -> int | None:
    if not url:
        return None
    m = ENTRY_RE.search(url)
    return int(m.group(1)) if m else None

def _managers_maps() -> tuple[dict[int, str], dict[int, str]]:
    """
    Build entry_id -> owner / team_name maps from your managers table.
    Handles both 'fpl_entry_id' and 'fpl_team_url' (fallback).
    Accepts either 'owner' or 'owner_name' column names.
    """
    owners = fetch_all_managers()  # raw DB rows (dicts)
    entry_to_owner: dict[int, str] = {}
    entry_to_team: dict[int, str] = {}

    for m in owners:
        # owner field can be 'owner' or 'owner_name' depending on your fetch function
        owner_name = m.get("owner") or m.get("owner_name") or m.get("name")
        if not owner_name:
            continue
        eid = m.get("fpl_entry_id")
        if not eid:
            eid = _parse_entry_id(m.get("fpl_team_url"))
        if not eid:
            continue
        eid = int(eid)
        entry_to_owner[eid] = owner_name
        team_name = m.get("team_name") or m.get("team")
        if team_name:
            entry_to_team[eid] = team_name

    return entry_to_owner, entry_to_team

FPL_BASE = "https://fantasy.premierleague.com/api"

def current_season_label() -> str:
    now = datetime.now(timezone.utc)
    y = now.year
    start = y if now.month >= 7 else (y - 1)
    return f"{start}-{str((start + 1) % 100).zfill(2)}"

def refresh_h2h_fixtures_for_league(league_id: int, league_name: str) -> int:
    """
    Pulls every GW’s fixtures from the FPL H2H API for the active season,
    maps to your owners, computes FDR from opponent RECENT FORM (last 5),
    and upserts into fixtures_h2h. Returns number of rows upserted.
    """
    season = current_season_label()
    entry_to_owner, entry_to_team = _managers_maps()

    # Pre-cache composites on demand to reduce DB hits
    comp_cache: dict[str, float] = {}

    def owner_comp(owner: str) -> float:
        if owner not in comp_cache:
            comp_cache[owner] = recent_form_score(owner, season, limit_matches=5)["composite"]
        return comp_cache[owner]

    fixtures_rows: List[Dict[str, Any]] = []
    headers = {"User-Agent": "tfpl-site"}  # be polite

    for gw in range(1, 39):  # up to 38
        page = 1
        while True:
            url = f"{FPL_BASE}/leagues-h2h-matches/league/{league_id}/"
            params = {"event": gw, "page": page}
            r = requests.get(url, params=params, headers=headers, timeout=25)
            r.raise_for_status()
            payload = r.json()
            results = payload.get("results") or []
            if not results and not payload.get("has_next"):
                break

            for fx in results:
                # Entrants
                home_entry = fx.get("entry_1_entry")
                away_entry = fx.get("entry_2_entry")
                if home_entry is None or away_entry is None:
                    continue
                home_owner = entry_to_owner.get(int(home_entry))
                away_owner = entry_to_owner.get(int(away_entry))
                if not home_owner or not away_owner:
                    # skip if either side isn't one of your managers
                    continue

                # Times & status
                kickoff = fx.get("kickoff_time") or fx.get("event_start_time")
                kickoff_utc = None
                if kickoff:
                    kickoff_utc = datetime.fromisoformat(kickoff.replace("Z", "+00:00"))
                finished = bool(fx.get("finished"))
                home_score = fx.get("entry_1_points")
                away_score = fx.get("entry_2_points")

                # Recent-form difficulty (opponent strength)
                away_comp = owner_comp(away_owner)
                home_comp = owner_comp(home_owner)
                home_fdr = fdr_from_composite(away_comp)
                away_fdr = fdr_from_composite(home_comp)

                fixtures_rows.append({
                    "season": season,
                    "league_id": league_id,
                    "gw": int(gw),
                    "fixture_id": int(fx["id"]),
                    "kickoff_utc": kickoff_utc,
                    "finished": finished,
                    "home_entry_id": int(home_entry),
                    "home_team_name": entry_to_team.get(int(home_entry)),
                    "home_owner": home_owner,
                    "home_score": home_score,
                    "away_entry_id": int(away_entry),
                    "away_team_name": entry_to_team.get(int(away_entry)),
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
