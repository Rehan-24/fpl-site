# backend/facup_scores.py
# Fetches live GW scores for all 40 FA Cup managers from the FPL API,
# stores them in facup_gw_scores, then resolves match winners and
# advances them through the bracket.
#
# Called by:
#   - The cron endpoint (same cron-job.org trigger as the league tables)
#   - The admin /api/facup/refresh endpoint for manual triggers
#
# FPL API endpoints used:
#   GET /api/entry/{entry_id}/event/{gw}/picks/
#       → entry_history.points  : GW score
#       → picks[]               : squad picks (for goals tiebreaker)
#   GET /api/event/{gw}/live/
#       → elements[].stats.goals_scored : live goals per player

import os
import re
import time
import logging
import requests
import psycopg
from psycopg.rows import dict_row
from typing import Optional
from facup_db import (
    upsert_gw_score,
    get_gw_scores,
    get_bracket,
    update_bracket_scores,
    advance_winner_to_next_round,
    SEASON,
)

logger = logging.getLogger("uvicorn.error")
FPL_BASE = "https://fantasy.premierleague.com/api"

# ── Seed → entry_id map (from managers.json / seedings file) ──────────────────
# Pulled from managers.json in the repo. Keep in sync with lib/facupSeedings.ts.
SEED_ENTRY_MAP: dict[int, int] = {
    1:  6679946,
    2:  3577847,
    3:  4141448,
    4:  5252413,
    5:  4087698,
    6:  6683423,
    7:  1520141,
    8:  7349746,
    9:  1270351,
    10: 5596813,
    11: 5361599,
    12: 5849758,
    13: 6790800,      
    14: 4483868,
    15: 5066840,
    16: 7934939,
    17: 617475,
    18: 1906849,
    19: 4350516,
    20: 6197359,
    21: 3239682,
    22: 4342758,
    23: 4690925,
    24: 4319478,
    25: 5466499,
    26: 4080174,
    27: 4137251,
    28: 6802392,
    29: 1512563,
    30: 6921329,
    31: 7937084,
    32: 6812648,
    33: 5130249,
    34: 4286391,
    35: 4285068,
    36: 6542694,
    37: 4088389,
    38: 6527451,
    39: 5356734,
    40: 7977200,
}

ENTRY_SEED_MAP: dict[int, int] = {
    v: k for k, v in SEED_ENTRY_MAP.items() if v is not None
}


# ── FPL API helpers ────────────────────────────────────────────────────────────

def _fpl_get(url: str, retries: int = 3) -> dict:
    """GET with retry + 1s back-off. Raises on persistent failure."""
    headers = {"User-Agent": "tfpl-facup-bot/1.0"}
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=headers, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 ** attempt)
    return {}


def fetch_live_goals(gw: int) -> dict[int, int]:
    """
    Return a map of {element_id: goals_scored} for all players in the given GW.
    Uses the /event/{gw}/live/ endpoint which is updated every ~60s during matches.
    """
    data = _fpl_get(f"{FPL_BASE}/event/{gw}/live/")
    goals: dict[int, int] = {}
    for el in data.get("elements", []):
        goals[el["id"]] = el.get("stats", {}).get("goals_scored", 0)
    return goals


def fetch_manager_gw(entry_id: int, gw: int, live_goals: dict[int, int]) -> tuple[int, int]:
    """
    Fetch a single manager's GW score and squad goals count.
    Returns (gw_points, squad_goals).

    The picks endpoint returns:
      entry_history.points  → GW score (after any deductions)
      picks[]               → list of {element, position, multiplier, is_captain, ...}
                              position 1-11 = active squad, 12-15 = bench
    """
    data = _fpl_get(f"{FPL_BASE}/entry/{entry_id}/event/{gw}/picks/")

    gw_points = data.get("entry_history", {}).get("points", 0)

    # Count goals only from active squad (positions 1-11)
    squad_goals = 0
    for pick in data.get("picks", []):
        if pick.get("position", 99) <= 11:
            element_id = pick["element"]
            squad_goals += live_goals.get(element_id, 0)

    return gw_points, squad_goals


# ── Main refresh function ─────────────────────────────────────────────────────

def refresh_facup_scores(gw: int) -> dict:
    """
    1. Fetch live goals for the GW once (one API call shared across all managers).
    2. For each seeded manager: fetch their GW score + squad goals.
    3. Upsert into facup_gw_scores.
    4. Resolve match winners for any bracket matchups in this GW.
    5. Advance winners to the next round.

    Returns a summary dict for logging / API response.
    """
    logger.info(f"[facup] Starting score refresh for GW{gw}")
    summary = {"gw": gw, "fetched": 0, "errors": [], "winners_resolved": []}

    # Step 1: fetch live goals once
    try:
        live_goals = fetch_live_goals(gw)
        logger.info(f"[facup] Fetched live goals for {len(live_goals)} players")
    except Exception as e:
        logger.error(f"[facup] Failed to fetch live goals: {e}")
        live_goals = {}  # degrade gracefully — scores still work, no tiebreaker

    # Step 2 + 3: fetch each manager's score
    score_map: dict[int, tuple[int, int]] = {}  # entry_id → (points, goals)
    for seed, entry_id in SEED_ENTRY_MAP.items():
        if entry_id is None:
            logger.warning(f"[facup] Seed {seed} has no entry_id — skipping")
            continue
        try:
            pts, goals = fetch_manager_gw(entry_id, gw, live_goals)
            score_map[entry_id] = (pts, goals)

            # display_name from SEED_ENTRY_MAP — look up team name by seed
            from facup_seedings_map import SEED_TEAM_MAP
            display_name = SEED_TEAM_MAP.get(seed, f"Seed {seed}")

            upsert_gw_score(gw, entry_id, display_name, pts, goals)
            summary["fetched"] += 1
            logger.info(f"[facup] Seed {seed} (entry {entry_id}): {pts}pts, {goals}gls")
            time.sleep(0.3)  # be polite to the FPL API
        except Exception as e:
            msg = f"Seed {seed} (entry {entry_id}): {e}"
            logger.error(f"[facup] Error fetching {msg}")
            summary["errors"].append(msg)

    # Step 4 + 5: resolve winners for ALL unresolved matchups (including past GWs).
    # This handles the case where a previous GW's round was never resolved — e.g.
    # if the cron missed GW31 (Round 1) and now GW32 is current, we still pick up
    # the unresolved R1 matchups and backfill their scores from the FPL API if needed.
    bracket = get_bracket(SEASON)

    # Group unresolved matchups by GW (both slots must be filled to resolve).
    # If entry_id1/entry_id2 are NULL but seed1/seed2 are set, resolve from SEED_ENTRY_MAP
    # so bracket rows that were seeded with only seeds (not entry_ids) still work.
    unresolved_by_gw: dict[int, list] = {}
    for m in bracket:
        if m["winner_entry"] is not None:
            continue
        # Resolve missing entry_ids from seed map
        if not m.get("entry_id1") and m.get("seed1"):
            m = dict(m)
            m["entry_id1"] = SEED_ENTRY_MAP.get(m["seed1"])
        if not m.get("entry_id2") and m.get("seed2"):
            m = dict(m)
            m["entry_id2"] = SEED_ENTRY_MAP.get(m["seed2"])
        if m.get("entry_id1") and m.get("entry_id2"):
            unresolved_by_gw.setdefault(m["gw"], []).append(m)

    for matchup_gw, gw_matchups in unresolved_by_gw.items():
        if matchup_gw == gw:
            # Current GW: use the score_map we already built above
            gw_score_map = score_map
        else:
            # Past GW: load whatever scores we already stored, then backfill any gaps
            db_rows = get_gw_scores(matchup_gw)
            gw_score_map: dict[int, tuple[int, int]] = {
                row["entry_id"]: (row["gw_points"], row["gw_goals"]) for row in db_rows
            }

            # Find entries whose scores we still need
            needed_eids = {
                eid
                for m in gw_matchups
                for eid in (m["entry_id1"], m["entry_id2"])
                if eid not in gw_score_map
            }
            if needed_eids:
                logger.info(f"[facup] Backfilling {len(needed_eids)} scores for GW{matchup_gw}")
                try:
                    past_goals = fetch_live_goals(matchup_gw)
                except Exception:
                    past_goals = {}
                from facup_seedings_map import SEED_TEAM_MAP
                for eid in needed_eids:
                    seed = ENTRY_SEED_MAP.get(eid)
                    if seed is None:
                        continue
                    try:
                        pts, goals = fetch_manager_gw(eid, matchup_gw, past_goals)
                        display_name = SEED_TEAM_MAP.get(seed, f"Seed {seed}")
                        upsert_gw_score(matchup_gw, eid, display_name, pts, goals)
                        gw_score_map[eid] = (pts, goals)
                        summary["fetched"] += 1
                        logger.info(f"[facup] Backfill GW{matchup_gw} seed {seed} (entry {eid}): {pts}pts, {goals}gls")
                        time.sleep(0.3)
                    except Exception as e:
                        msg = f"Backfill GW{matchup_gw} seed {seed} (entry {eid}): {e}"
                        logger.error(f"[facup] {msg}")
                        summary["errors"].append(msg)

        for matchup in gw_matchups:
            round_name = matchup["round"]
            idx = matchup["matchup_idx"]
            eid1 = matchup.get("entry_id1")
            eid2 = matchup.get("entry_id2")

            s1_data = gw_score_map.get(eid1)
            s2_data = gw_score_map.get(eid2)
            s1, g1 = s1_data if s1_data else (None, None)
            s2, g2 = s2_data if s2_data else (None, None)

            if s1 is None or s2 is None:
                continue  # scores still not available

            # Determine winner
            if s1 > s2:
                winner_entry, winner_seed = eid1, matchup["seed1"]
            elif s2 > s1:
                winner_entry, winner_seed = eid2, matchup["seed2"]
            elif g1 is not None and g2 is not None:
                # Tiebreaker: goals
                if g1 > g2:
                    winner_entry, winner_seed = eid1, matchup["seed1"]
                elif g2 > g1:
                    winner_entry, winner_seed = eid2, matchup["seed2"]
                else:
                    # Perfect tie on goals too — no winner yet (rare, handle manually)
                    winner_entry, winner_seed = None, None
            else:
                winner_entry, winner_seed = None, None

            update_bracket_scores(
                SEASON, round_name, idx,
                eid1, eid2,
                s1, s2, g1, g2,
                winner_seed, winner_entry,
            )

            if winner_entry:
                advance_winner_to_next_round(SEASON, round_name, idx, winner_seed, winner_entry)

                # Special case: SF losers → 3rd place
                if round_name == "sf":
                    loser_seed  = matchup["seed2"] if winner_seed == matchup["seed1"] else matchup["seed1"]
                    loser_entry = eid2 if winner_entry == eid1 else eid1
                    slot = "1" if idx == 0 else "2"
                    _slot_sf_loser(SEASON, slot, loser_seed, loser_entry)

                summary["winners_resolved"].append({
                    "round": round_name,
                    "matchup": idx,
                    "winner_seed": winner_seed,
                    "scores": f"{s1}-{s2}",
                })
                logger.info(f"[facup] {round_name}[{idx}] winner: seed {winner_seed} ({s1} vs {s2})")

    logger.info(f"[facup] Refresh complete: {summary}")
    return summary


def _slot_sf_loser(season: str, slot: str, loser_seed: int, loser_entry: int) -> None:
    """Slot an SF loser into the 3rd place match."""
    import psycopg as pg
    from facup_db import DB_URL
    sql = f"""
    UPDATE public.facup_bracket
    SET seed{slot}     = %s,
        entry_id{slot} = %s,
        updated_at     = now()
    WHERE season = %s AND round = '3rd' AND matchup_idx = 0
    """
    with pg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, (loser_seed, loser_entry, season))
