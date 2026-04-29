#!/usr/bin/env python3
# backend/facup_recalculate.py
#
# Full bracket recalculation — run via the GitHub Action
# "Recalculate FA Cup Bracket".
#
# What it does:
#   1. Wipes the bracket and re-seeds the initial structure (same as
#      the /api/admin/facup-full-reset endpoint).
#   2. Clears all stored GW scores (gw 31-36) so they are re-fetched
#      fresh from the FPL API with the correct hit-deduction logic.
#   3. Runs refresh_facup_scores() for GW 31 → 36 in order, resolving
#      winners only when that GW's data_checked flag is True (i.e. bonus
#      points have been applied and scores are final).
#
# Env vars required:
#   SUPABASE_DB_URL  — postgres connection string

import sys
import time
import logging
import psycopg
from psycopg.rows import dict_row

from facup_db import DB_URL, SEASON
from facup_scores import refresh_facup_scores, SEED_ENTRY_MAP

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Initial bracket seeding (mirrors /api/admin/facup-full-reset) ─────────────

def e(seed: int) -> int:
    return SEED_ENTRY_MAP[seed]

R1_ROWS = [
    (SEASON, "r1", 0, 31, 25, 40, e(25), e(40)),
    (SEASON, "r1", 1, 31, 26, 39, e(26), e(39)),
    (SEASON, "r1", 2, 31, 27, 38, e(27), e(38)),
    (SEASON, "r1", 3, 31, 28, 37, e(28), e(37)),
    (SEASON, "r1", 4, 31, 29, 36, e(29), e(36)),
    (SEASON, "r1", 5, 31, 30, 35, e(30), e(35)),
    (SEASON, "r1", 6, 31, 31, 34, e(31), e(34)),
    (SEASON, "r1", 7, 31, 32, 33, e(32), e(33)),
]

R32_ROWS = [
    # (season, round, idx, gw, seed1, seed2, entry_id1, entry_id2)
    # seed2 / entry_id2 = None where that slot comes from a R1 winner
    (SEASON, "r32",  0, 32,  1, None, e(1),  None),
    (SEASON, "r32",  1, 32,  9,   24, e(9),  e(24)),
    (SEASON, "r32",  2, 32, 16,   17, e(16), e(17)),
    (SEASON, "r32",  3, 32,  8, None, e(8),  None),
    (SEASON, "r32",  4, 32,  5, None, e(5),  None),
    (SEASON, "r32",  5, 32, 13,   20, e(13), e(20)),
    (SEASON, "r32",  6, 32, 12,   21, e(12), e(21)),
    (SEASON, "r32",  7, 32,  4, None, e(4),  None),
    (SEASON, "r32",  8, 32,  3, None, e(3),  None),
    (SEASON, "r32",  9, 32, 11,   22, e(11), e(22)),
    (SEASON, "r32", 10, 32, 14,   19, e(14), e(19)),
    (SEASON, "r32", 11, 32,  6, None, e(6),  None),
    (SEASON, "r32", 12, 32,  7, None, e(7),  None),
    (SEASON, "r32", 13, 32, 10,   23, e(10), e(23)),
    (SEASON, "r32", 14, 32, 15,   18, e(15), e(18)),
    (SEASON, "r32", 15, 32,  2, None, e(2),  None),
]

EMPTY_ROUNDS = (
    [("r16",   i, 33) for i in range(8)] +
    [("qf",    i, 34) for i in range(4)] +
    [("sf",    i, 35) for i in range(2)] +
    [("final", 0, 36), ("3rd", 0, 36)]
)
EMPTY_ROWS = [(SEASON, rnd, idx, gw) for rnd, idx, gw in EMPTY_ROUNDS]

FA_CUP_GWS = [31, 32, 33, 34, 35, 36]


# ── Step 1: reset ─────────────────────────────────────────────────────────────

def reset_bracket() -> dict:
    log.info("=" * 60)
    log.info("STEP 1 — Resetting bracket and clearing stored GW scores")
    log.info("=" * 60)

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        # Wipe bracket
        cur.execute("DELETE FROM public.facup_bracket WHERE season = %s", (SEASON,))
        deleted_bracket = cur.rowcount
        log.info(f"  Deleted {deleted_bracket} bracket rows")

        # Clear stored scores for all FA Cup GWs so they're re-fetched fresh
        cur.execute(
            "DELETE FROM public.facup_gw_scores WHERE gw = ANY(%s)",
            (FA_CUP_GWS,),
        )
        deleted_scores = cur.rowcount
        log.info(f"  Deleted {deleted_scores} rows from facup_gw_scores")

        # Re-seed R1
        cur.executemany("""
            INSERT INTO public.facup_bracket
                (season, round, matchup_idx, gw, seed1, seed2, entry_id1, entry_id2)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, R1_ROWS)
        log.info(f"  Inserted {len(R1_ROWS)} R1 rows")

        # Re-seed R32 (pre-seeded slots; R1-winner slots stay NULL)
        cur.executemany("""
            INSERT INTO public.facup_bracket
                (season, round, matchup_idx, gw, seed1, seed2, entry_id1, entry_id2)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, R32_ROWS)
        log.info(f"  Inserted {len(R32_ROWS)} R32 rows")

        # Empty placeholder rows for R16 onwards
        cur.executemany("""
            INSERT INTO public.facup_bracket (season, round, matchup_idx, gw)
            VALUES (%s, %s, %s, %s)
        """, EMPTY_ROWS)
        log.info(f"  Inserted {len(EMPTY_ROWS)} empty round rows")

    return {
        "deleted_bracket": deleted_bracket,
        "deleted_scores": deleted_scores,
        "inserted_r1": len(R1_ROWS),
        "inserted_r32": len(R32_ROWS),
        "inserted_empty": len(EMPTY_ROWS),
    }


# ── Step 2: recalculate each GW ───────────────────────────────────────────────

def recalculate_all_gws() -> list[dict]:
    results = []
    for gw in FA_CUP_GWS:
        log.info("")
        log.info("=" * 60)
        log.info(f"STEP 2.{FA_CUP_GWS.index(gw) + 1} — Processing GW{gw}")
        log.info("=" * 60)
        try:
            summary = refresh_facup_scores(gw)
            results.append({"gw": gw, "status": "ok", **summary})

            resolved = summary.get("winners_resolved", [])
            skipped  = summary.get("skipped_gws", [])
            if resolved:
                log.info(f"  GW{gw}: {len(resolved)} winner(s) resolved")
                for w in resolved:
                    log.info(f"    {w['round']}[{w['matchup']}] seed {w['winner_seed']} "
                             f"({w['scores']})")
            if skipped:
                log.info(f"  GW{gw}: skipped winner resolution for GW(s) {skipped} "
                         f"(not yet data_checked)")
            if summary.get("errors"):
                log.warning(f"  GW{gw}: {len(summary['errors'])} error(s):")
                for err in summary["errors"]:
                    log.warning(f"    {err}")
        except Exception as exc:
            log.error(f"  GW{gw}: FAILED — {exc}")
            results.append({"gw": gw, "status": "error", "error": str(exc)})

        # Brief pause between GWs to be polite to the FPL API
        if gw != FA_CUP_GWS[-1]:
            log.info(f"  Pausing 3s before next GW...")
            time.sleep(3)

    return results


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    if not DB_URL:
        log.error("SUPABASE_DB_URL env var is not set — aborting")
        return 1

    log.info("FA Cup bracket full recalculation starting")
    log.info(f"Season: {SEASON}  |  GWs: {FA_CUP_GWS}")

    reset_result  = reset_bracket()
    gw_results    = recalculate_all_gws()

    log.info("")
    log.info("=" * 60)
    log.info("SUMMARY")
    log.info("=" * 60)
    log.info(f"  Reset:  {reset_result}")
    errors = sum(1 for r in gw_results if r.get("status") == "error")
    log.info(f"  GWs processed: {len(gw_results)}  |  Errors: {errors}")
    for r in gw_results:
        status = "✅" if r.get("status") == "ok" else "❌"
        resolved_count = len(r.get("winners_resolved", []))
        log.info(f"  {status} GW{r['gw']}: {r.get('fetched', '?')} scores fetched, "
                 f"{resolved_count} winner(s) resolved")

    if errors:
        log.error(f"Completed with {errors} GW error(s)")
        return 1

    log.info("Recalculation complete ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
