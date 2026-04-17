# backend/facup_db.py
# DB helpers for the FA Cup bracket and score storage.
# Follows the same pattern as backend_db.py — psycopg + dict_row.

import os
import psycopg
from psycopg.rows import dict_row
from typing import Optional

DB_URL = os.getenv("SUPABASE_DB_URL")
SEASON = "2025-26"


def _conn():
    if not DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    return psycopg.connect(DB_URL, row_factory=dict_row)


# ── GW Scores ─────────────────────────────────────────────────────────────────

def upsert_gw_score(gw: int, entry_id: int, display_name: str,
                    gw_points: int, gw_goals: int) -> None:
    """Insert or update a single manager's GW score + goals."""
    sql = """
    INSERT INTO public.facup_gw_scores
        (gw, entry_id, display_name, gw_points, gw_goals, fetched_at)
    VALUES (%s, %s, %s, %s, %s, now())
    ON CONFLICT (gw, entry_id) DO UPDATE SET
        gw_points  = EXCLUDED.gw_points,
        gw_goals   = EXCLUDED.gw_goals,
        fetched_at = now()
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (gw, entry_id, display_name, gw_points, gw_goals))


def get_gw_scores(gw: int) -> list[dict]:
    """Return all score rows for a given GW."""
    sql = """
    SELECT entry_id, display_name, gw_points, gw_goals, fetched_at
    FROM public.facup_gw_scores
    WHERE gw = %s
    ORDER BY entry_id
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (gw,))
        return cur.fetchall()


# ── Bracket ───────────────────────────────────────────────────────────────────

def get_bracket(season: str = SEASON) -> list[dict]:
    """Return the full bracket state for a season."""
    sql = """
    SELECT round, matchup_idx, gw, seed1, seed2, entry_id1, entry_id2,
           score1, score2, goals1, goals2, winner_seed, winner_entry, updated_at
    FROM public.facup_bracket
    WHERE season = %s
    ORDER BY
        CASE round
            WHEN 'r1'    THEN 1
            WHEN 'r32'   THEN 2
            WHEN 'r16'   THEN 3
            WHEN 'qf'    THEN 4
            WHEN 'sf'    THEN 5
            WHEN 'final' THEN 6
            WHEN '3rd'   THEN 7
            ELSE 8
        END,
        matchup_idx
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (season,))
        return cur.fetchall()


def update_bracket_scores(season: str, round_name: str, matchup_idx: int,
                           entry_id1: Optional[int], entry_id2: Optional[int],
                           score1: Optional[int], score2: Optional[int],
                           goals1: Optional[int], goals2: Optional[int],
                           winner_seed: Optional[int], winner_entry: Optional[int]) -> None:
    """Write scores + winner into a bracket slot."""
    sql = """
    UPDATE public.facup_bracket
    SET entry_id1    = COALESCE(%s, entry_id1),
        entry_id2    = COALESCE(%s, entry_id2),
        score1       = %s,
        score2       = %s,
        goals1       = %s,
        goals2       = %s,
        winner_seed  = %s,
        winner_entry = %s,
        updated_at   = now()
    WHERE season = %s AND round = %s AND matchup_idx = %s
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (
            entry_id1, entry_id2,
            score1, score2, goals1, goals2,
            winner_seed, winner_entry,
            season, round_name, matchup_idx,
        ))


def sync_bracket_scores(season: str = SEASON) -> int:
    """
    Update score1/score2/goals1/goals2 in facup_bracket from stored
    facup_gw_scores for every row that has both entry_ids filled.
    Does NOT touch winner_seed or winner_entry — safe to call every run.
    Fixes stale interim scores on already-resolved matchups.
    Returns the number of rows updated.
    """
    sql = """
    UPDATE public.facup_bracket b
    SET score1     = g1.gw_points,
        goals1     = g1.gw_goals,
        score2     = g2.gw_points,
        goals2     = g2.gw_goals,
        updated_at = now()
    FROM public.facup_gw_scores g1,
         public.facup_gw_scores g2
    WHERE b.season    = %s
      AND g1.gw       = b.gw
      AND g1.entry_id = b.entry_id1
      AND g2.gw       = b.gw
      AND g2.entry_id = b.entry_id2
      AND b.entry_id1 IS NOT NULL
      AND b.entry_id2 IS NOT NULL
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (season,))
        return cur.rowcount


def advance_winner_to_next_round(season: str, round_name: str,
                                  matchup_idx: int,
                                  winner_seed: int, winner_entry: int) -> None:
    """
    After a round completes, slot the winner into the correct next-round matchup.

    Bracket advancement logic:
      r1[i]  → r32[i]  as seed2  (R1 winners fill the bye slots)
      r32[i] → r16[i//2] as seed1 if even idx, seed2 if odd
      r16[i] → qf[i//2]  same pattern
      qf[i]  → sf[i//2]  same pattern
      sf[0] winner → final[0] seed1
      sf[1] winner → final[0] seed2
      sf[0] loser  → 3rd[0]   seed1
      sf[1] loser  → 3rd[0]   seed2
    """
    NEXT_ROUND = {
        "r1":  "r32",
        "r32": "r16",
        "r16": "qf",
        "qf":  "sf",
    }

    if round_name in NEXT_ROUND:
        next_round = NEXT_ROUND[round_name]

        if round_name == "r1":
            # R1 winners fill seed2 of the correct seeded R32 slot.
            # Mapping mirrors lib/facupSeedings.ts R32_SLOTS (r1Label fields):
            #   R1[0] (M1: 33v40) → R32[0]  (seed 1's slot)
            #   R1[1] (M2: 34v39) → R32[15] (seed 2's slot)
            #   R1[2] (M3: 35v38) → R32[8]  (seed 3's slot)
            #   R1[3] (M4: 36v37) → R32[7]  (seed 4's slot)
            R1_TO_R32_IDX = {0: 0, 1: 15, 2: 8, 3: 7}
            next_idx = R1_TO_R32_IDX.get(matchup_idx, matchup_idx)
            slot = "2"
        else:
            next_idx = matchup_idx // 2
            slot = "1" if matchup_idx % 2 == 0 else "2"

        sql = f"""
        UPDATE public.facup_bracket
        SET seed{slot}     = %s,
            entry_id{slot} = %s,
            updated_at     = now()
        WHERE season = %s AND round = %s AND matchup_idx = %s
        """
        with _conn() as conn, conn.cursor() as cur:
            cur.execute(sql, (winner_seed, winner_entry, season, next_round, next_idx))

    elif round_name == "sf":
        # Winners → final, losers → 3rd place
        final_slot = "1" if matchup_idx == 0 else "2"
        sql_final = f"""
        UPDATE public.facup_bracket
        SET seed{final_slot}     = %s,
            entry_id{final_slot} = %s,
            updated_at           = now()
        WHERE season = %s AND round = 'final' AND matchup_idx = 0
        """
        with _conn() as conn, conn.cursor() as cur:
            cur.execute(sql_final, (winner_seed, winner_entry, season))
