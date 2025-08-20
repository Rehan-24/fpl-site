import os, requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from .backend_db import upsert_fixtures, recent_form_score, fdr_from_composite, fetch_all_managers

FPL_BASE = "https://fantasy.premierleague.com/api"

def current_season_label() -> str:
    now = datetime.now(timezone.utc)
    y = now.year
    start = y if now.month >= 7 else (y - 1)
    return f"{start}-{str((start + 1) % 100).zfill(2)}"

def _managers_maps() -> Tuple[Dict[int, str], Dict[int, str]]:
    """
    Build entry_id -> owner / team_name maps from your managers table.
    Requires 'fpl_entry_id' & 'team_name' to be present in the table.
    """
    owners = fetch_all_managers()  # [{ owner, fpl_entry_id, team_name }, ...]
    entry_to_owner = {}
    entry_to_team = {}
    for m in owners:
        eid = m.get("fpl_entry_id")
        if not eid: continue
        entry_to_owner[int(eid)] = m["owner"]
        if m.get("team_name"): entry_to_team[int(eid)] = m["team_name"]
    return entry_to_owner, entry_to_team

def refresh_h2h_fixtures_for_league(league_id: int, league_name: str) -> None:
    """
    Pulls every GW’s fixtures from FPL H2H API for the active season, maps to your owners,
    and computes FDR using opponent RECENT FORM (last N completed matches) as of refresh time.
    """
    season = current_season_label()
    entry_to_owner, entry_to_team = _managers_maps()

    # Precompute recent-form composite per OWNER once (reduces DB round-trips)
    # We compute from 'their' recent completed matches in THIS season.
    def owner_composite(owner: str) -> float:
        return recent_form_score(owner, season, limit_matches=5)["composite"]

    # FPL H2H endpoint is paginated by GW and page
    fixtures_rows: List[Dict[str, Any]] = []
    for gw in range(1, 39):  # up to 38
        url = f"{FPL_BASE}/leagues-h2h-matches/league/{league_id}/?event={gw}&page=1"
        while url:
            r = requests.get(url, timeout=25)
            r.raise_for_status()
            payload = r.json()

            for fx in payload.get("results", []):
                fixture_id = fx["id"]
                home_entry = fx["entry_1_entry"]
                away_entry = fx["entry_2_entry"]
                home_owner = entry_to_owner.get(home_entry)
                away_owner = entry_to_owner.get(away_entry)
                if not home_owner or not away_owner:
                    continue  # skip non-mapped entries

                # kickoff parsing (API fields vary slightly year-to-year)
                kickoff_utc = None
                # Try multiple keys, safest is use event kickoff if present:
                if fx.get("event_start_time"):
                    kickoff_utc = datetime.fromisoformat(fx["event_start_time"].replace("Z", "+00:00"))

                finished = bool(fx.get("finished"))
                home_score = fx.get("entry_1_points")
                away_score = fx.get("entry_2_points")

                # Compute RECENT-FORM FDR (opponent strength)
                # FDR for home perspective uses AWAY owner's recent composite, and vice-versa
                away_comp = owner_composite(away_owner)
                home_comp = owner_composite(home_owner)
                home_fdr = fdr_from_composite(away_comp)
                away_fdr = fdr_from_composite(home_comp)

                fixtures_rows.append({
                    "season": season,
                    "league_id": league_id,
                    "gw": gw,
                    "fixture_id": fixture_id,
                    "kickoff_utc": kickoff_utc,
                    "finished": finished,
                    "home_entry_id": home_entry,
                    "home_team_name": entry_to_team.get(home_entry),
                    "home_owner": home_owner,
                    "home_score": home_score,
                    "away_entry_id": away_entry,
                    "away_team_name": entry_to_team.get(away_entry),
                    "away_owner": away_owner,
                    "away_score": away_score,
                    "home_fdr": home_fdr,
                    "away_fdr": away_fdr,
                })

            url = payload.get("next")  # None or absolute next page

    upsert_fixtures(fixtures_rows)
