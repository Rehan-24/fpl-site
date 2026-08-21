#!/usr/bin/env python3
"""
Freeze the FA Cup seeding and bracket for a season -- the one-time
action that turns the live "projected seeding" preview into the real,
locked tournament. Run this once, at the season's kickoff gameweek
(GW22 for 2026-27), not before -- seeding keeps shuffling right up
until then, same as the live preview on the site shows.

Two-step, same reasoning as season_rollover.py: this writes the actual
bracket real games get played against, so nothing is written to the
database until you've reviewed the computed seeding.

    1. compute   -- pulls current standings + last season's trophy
                    winners, computes the full seeding + Round 1 +
                    Round 2 bracket, writes a JSON report. No DB writes.
    2. apply     -- reads a (optionally hand-edited) report JSON,
                    resolves each seed to their FPL entry ID, and writes
                    the bracket into public.facup_bracket for the given
                    season -- Round 1 and Round 2 fully seeded, R16
                    onward as empty placeholder rows (same shape as
                    facup_recalculate.py uses today).

The Round 2 pairing algorithm is the standard, documented tournament-
seeding method (see facup_seeding.compute_full_bracket /
_standard_bracket_order) -- not a reproduction of 2025-26's bespoke
hand-built quadrant convention. Review the "round2" section of the
report before applying; this is the one part of the whole pipeline
that's a judgment call rather than a mechanical fact.

Usage:
    python facup_freeze.py compute --season 2026-27 --byes 4 \\
        --facup-winner "Marvin Ling" --prem-winner "Michael Giles" \\
        --champ-winner "Aaron Frank" --out facup_report.json

    # review facup_report.json

    python facup_freeze.py apply --report facup_report.json
"""

import argparse
import json
import re
import sys
from dataclasses import asdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from season_rollover import _connect, fetch_final_standings  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from facup_seeding import compute_seeding, compute_full_bracket, Seed  # noqa: E402

ROUND_GWS = {"r1": None, "r32": None, "r16": None, "qf": None, "sf": None, "final": None, "3rd": None}


def _round_gws(kickoff_gw: int) -> dict:
    """One round per gameweek starting at kickoff_gw, same cadence as
    2025-26's GW31-36 run. Final and 3rd both land on the last GW."""
    r1, r32, r16, qf, sf, final = range(kickoff_gw, kickoff_gw + 6)
    return {"r1": r1, "r32": r32, "r16": r16, "qf": qf, "sf": sf, "final": final, "3rd": final}


def cmd_compute(args):
    with _connect() as conn:
        cur = conn.cursor()
        premier_rows = fetch_final_standings(cur, "premier")
        championship_rows = fetch_final_standings(cur, "championship")

    seeds = compute_seeding(
        premier_rows, championship_rows,
        args.facup_winner, args.prem_winner, args.champ_winner,
    )
    bracket = compute_full_bracket(seeds, byes=args.byes)
    gws = _round_gws(args.kickoff_gw)

    report = {
        "season": args.season,
        "kickoff_gw": args.kickoff_gw,
        "byes": args.byes,
        "round_gws": gws,
        "seeds": [asdict(s) for s in seeds],
        "round1": bracket["round1"],
        "round2": bracket["round2"],
        "shape": bracket["shape"],
    }
    Path(args.out).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {args.out}")
    print(f"Season {args.season}, byes={args.byes}, kickoff GW{args.kickoff_gw}")
    print(f"Round GWs: {gws}")
    print(f"{len(seeds)} seeds, {len(bracket['round1'])} R1 matches, {len(bracket['round2'])} R2 matches")
    print(
        "\nReview round2 in the report before applying -- that's the standard-\n"
        "algorithm bracket pairing, the one part of this that's a real design\n"
        "choice rather than a mechanical fact."
    )


def _resolve_entry_id(cur, owner: str):
    cur.execute(
        """
        select coalesce(entry_id, (substring(fpl_team_url from '/entry/(\\d+)/'))::int) as eid
        from public.manager
        where lower(owner_name) = lower(%s)
        """,
        (owner,),
    )
    row = cur.fetchone()
    return row["eid"] if row and row["eid"] is not None else None


def cmd_apply(args):
    report = json.loads(Path(args.report).read_text(encoding="utf-8"))
    season = report["season"]
    gws = report["round_gws"]

    with _connect() as conn:
        cur = conn.cursor()

        eid_by_owner = {}
        missing = []
        for s in report["seeds"]:
            eid = _resolve_entry_id(cur, s["owner"])
            if eid is None:
                missing.append(s["owner"])
            eid_by_owner[s["owner"]] = eid
        if missing:
            raise SystemExit(
                "Cannot apply -- no resolvable FPL entry ID for: " + ", ".join(missing) +
                "\nFix their fpl_team_url in public.manager first."
            )

        cur.execute("delete from public.facup_bracket where season = %s", (season,))
        deleted = cur.rowcount
        print(f"Cleared {deleted} existing bracket rows for {season!r}")

        insert_sql = """
            insert into public.facup_bracket
                (season, round, matchup_idx, gw, seed1, seed2, entry_id1, entry_id2)
            values (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        n = 0
        for i, m in enumerate(report["round1"]):
            cur.execute(insert_sql, (
                season, "r1", i, gws["r1"],
                m["seed1"]["seed"], m["seed2"]["seed"],
                eid_by_owner[m["seed1"]["owner"]], eid_by_owner[m["seed2"]["owner"]],
            ))
            n += 1

        for i, m in enumerate(report["round2"]):
            def slot_fields(slot):
                if slot["kind"] == "seed":
                    owner = slot["seed"]["owner"]
                    return slot["seed"]["seed"], eid_by_owner[owner]
                return None, None  # R1-winner slot -- resolved once R1 finishes

            seed1, entry1 = slot_fields(m["slot1"])
            seed2, entry2 = slot_fields(m["slot2"])
            cur.execute(insert_sql, (season, "r32", i, gws["r32"], seed1, seed2, entry1, entry2))
            n += 1

        empty_sql = """
            insert into public.facup_bracket (season, round, matchup_idx, gw)
            values (%s, %s, %s, %s)
        """
        n_r32 = len(report["round2"])
        n_r16, n_qf, n_sf = n_r32 // 2, n_r32 // 4, n_r32 // 8
        for i in range(n_r16):
            cur.execute(empty_sql, (season, "r16", i, gws["r16"]))
            n += 1
        for i in range(n_qf):
            cur.execute(empty_sql, (season, "qf", i, gws["qf"]))
            n += 1
        for i in range(n_sf):
            cur.execute(empty_sql, (season, "sf", i, gws["sf"]))
            n += 1
        cur.execute(empty_sql, (season, "final", 0, gws["final"]))
        cur.execute(empty_sql, (season, "3rd", 0, gws["3rd"]))
        n += 2

        conn.commit()
        print(f"Inserted {n} bracket rows for {season!r} (kickoff GW{report['kickoff_gw']})")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("compute", help="Compute the freeze, write a report (no DB writes)")
    c.add_argument("--season", required=True, help="e.g. 2026-27")
    c.add_argument("--kickoff-gw", type=int, required=True, help="e.g. 22")
    c.add_argument("--byes", type=int, default=4)
    c.add_argument("--facup-winner", required=True)
    c.add_argument("--prem-winner", required=True)
    c.add_argument("--champ-winner", required=True)
    c.add_argument("--out", default="facup_report.json")
    c.set_defaults(func=cmd_compute)

    a = sub.add_parser("apply", help="Apply a (reviewed) report to the database")
    a.add_argument("--report", required=True)
    a.set_defaults(func=cmd_apply)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
