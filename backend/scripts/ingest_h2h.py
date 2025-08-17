"""
Ingest all H2H matches from FPL for leagues, normalize them,
and build recent-form per entry (last games). Outputs:

- backend/results/history/matches_all.json
- backend/results/history/recent_form.json

Run:
    python backend/scripts/ingest_h2h.py
"""

import os
import json
import time
import sys
from typing import List, Dict, Any
from datetime import datetime
import requests

# --- League IDs (provided) ---
PREMIER_LEAGUE_ID = 723566
CHAMPIONSHIP_LEAGUE_ID = 850022

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # /backend
OUT_DIR = os.path.join(BASE_DIR, "results", "history")
os.makedirs(OUT_DIR, exist_ok=True)

# --------- Fetch & Normalize --------- #

def fetch_league_matches(league_id: int) -> List[Dict[str, Any]]:
    """
    Pulls ALL pages from the official H2H matches endpoint for a league.
    Note: Must be run server-side (CORS blocks browser).
    """
    url = f"https://fantasy.premierleague.com/api/leagues-h2h-matches/league/{league_id}/"
    page = 1
    all_rows: List[Dict[str, Any]] = []
    headers = {"User-Agent": "tfpl-site/ingest-script"}

    while True:
        r = requests.get(url, params={"page": page}, headers=headers, timeout=20)
        if r.status_code != 200:
            # Stop if error (network, rate-limit, etc.)
            break

        try:
            j = r.json()
        except Exception:
            break

        results = j.get("results", [])
        all_rows.extend(results)

        has_next = j.get("has_next")
        if not has_next or not results:
            break

        page += 1
        time.sleep(0.25)  # be polite

    return all_rows


def normalize_row(r: Dict[str, Any]) -> Dict[str, Any]:
    """
    FPL fields vary slightly over the years—normalize to a consistent shape.
    """
    # Gameweek / timing
    event = r.get("event")
    kickoff_time = r.get("kickoff_time")
    finished = bool(r.get("finished") or (r.get("started") and (r.get("winner") is not None)))

    # Entry IDs
    entry_1_entry = r.get("entry_1_entry") or r.get("team_h_entry") or r.get("league_entry_1")
    entry_2_entry = r.get("entry_2_entry") or r.get("team_a_entry") or r.get("league_entry_2")

    # Names (owner + team)
    entry_1_player_name = r.get("entry_1_player_name") or r.get("entry_1_name")
    entry_2_player_name = r.get("entry_2_player_name") or r.get("entry_2_name")
    entry_1_name = r.get("entry_1_name") or r.get("entry_1_player_name")
    entry_2_name = r.get("entry_2_name") or r.get("entry_2_player_name")

    # Scores
    entry_1_points = r.get("entry_1_points")
    entry_2_points = r.get("entry_2_points")
    if entry_1_points is None:
        entry_1_points = r.get("team_h_score")
    if entry_2_points is None:
        entry_2_points = r.get("team_a_score")

    return {
        "event": event,
        "kickoff_time": kickoff_time,
        "finished": finished,
        "entry_1_entry": str(entry_1_entry) if entry_1_entry is not None else None,
        "entry_2_entry": str(entry_2_entry) if entry_2_entry is not None else None,
        "entry_1_player_name": entry_1_player_name,
        "entry_2_player_name": entry_2_player_name,
        "entry_1_name": entry_1_name,
        "entry_2_name": entry_2_name,
        "entry_1_points": entry_1_points,
        "entry_2_points": entry_2_points,
    }


# --------- Recent Form Builder --------- #

def _result_tag(my_points, opp_points) -> str:
    if my_points is None or opp_points is None:
        return "D"  # treat unknown as draw to avoid bias
    if my_points > opp_points:
        return "W"
    if my_points < opp_points:
        return "L"
    return "D"


def build_recent_form(rows: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Produce: { entry_id: [ {date, gf, ga, result}, ... ] }
    Sorted by date asc (string compare ok for ISO).
    """
    game_map: Dict[str, List[Dict[str, Any]]] = {}

    for r in rows:
        date = r.get("kickoff_time") or ""  # ISO or empty
        # team 1 perspective
        a_id = r.get("entry_1_entry")
        b_id = r.get("entry_2_entry")
        a_pts = r.get("entry_1_points")
        b_pts = r.get("entry_2_points")

        if a_id:
            game_map.setdefault(str(a_id), []).append({
                "date": date,
                "gf": int(a_pts or 0),
                "ga": int(b_pts or 0),
                "result": _result_tag(a_pts, b_pts),
            })
        if b_id:
            game_map.setdefault(str(b_id), []).append({
                "date": date,
                "gf": int(b_pts or 0),
                "ga": int(a_pts or 0),
                "result": _result_tag(b_pts, a_pts),
            })

    # sort by date (ISO strings sort correctly)
    for k, lst in game_map.items():
        lst.sort(key=lambda g: g.get("date") or "")
    return game_map


# --------- Main --------- #

def main() -> int:
    leagues = [PREMIER_LEAGUE_ID, CHAMPIONSHIP_LEAGUE_ID]
    all_raw: List[Dict[str, Any]] = []

    for lid in leagues:
        rows = fetch_league_matches(lid)
        all_raw.extend(rows)

    normalized = [normalize_row(r) for r in all_raw]

    # Write full normalized history
    all_path = os.path.join(OUT_DIR, "matches_all.json")
    with open(all_path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    # Build & write recent form
    recent = build_recent_form(normalized)
    recent_path = os.path.join(OUT_DIR, "recent_form.json")
    with open(recent_path, "w", encoding="utf-8") as f:
        json.dump(recent, f, ensure_ascii=False, indent=2)

    print(f"[ingest_h2h] Saved {len(normalized)} matches; recent form for {len(recent)} entries.")
    print(f"[ingest_h2h] matches_all.json -> {all_path}")
    print(f"[ingest_h2h] recent_form.json -> {recent_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
