#!/usr/bin/env python3
"""
FA Cup seeding generator — implements the seeding rule agreed for the
2026-27 season onward:

    Seed 1  -- last season's FA Cup winner
    Seed 2  -- last season's Premier League winner
    Seed 3  -- last season's Championship winner
    Seed 4  -- highest current-season score among everyone else
               (either league -- whichever league it comes from, seed 5
               starts from the *other* league, to keep the alternation
               below balanced rather than double-dipping one league
               right after seed 4)
    Seeds 5 onward -- alternate leagues by descending score. If one
               league's pool empties first (the two leagues won't
               generally have exactly the same number of players left
               after the top-4 seeds are pulled out), the remaining
               seeds are filled from whichever league still has players
               -- which, once only one pool is left, is equivalent to
               "sort what's left by score" the way 2025-26's seeds
               33-40 worked.

"Score" = a manager's cumulative FPL points for the season so far (the
same `Score` field used throughout league_table_snapshots and the
season-summary card) -- NOT the H2H league standings "Points" column.

This is deliberately data-driven rather than hardcoded to 40 seeds / a
20-20 league split: team counts have already changed once this season
(new managers joining, others retiring), so the generator works out its
own totals from however many rows each league actually has.

Two ways to use it:
    - As a library: import compute_seeding() and feed it whatever rows
      you have (live in-progress snapshot, or a season's frozen final
      standings) plus the three trophy winners' names.
    - As a CLI, for a live projected-seeding preview against whatever
      the current standings are right now:

        python facup_seeding.py \\
            --facup-winner "Marvin Ling" \\
            --prem-winner "Michael Giles" \\
            --champ-winner "Aaron Frank"

      Prints the projected seed list. Nothing is written anywhere --
      this only reads from league_table_snapshots.
"""

import argparse
import io
import sys
from pathlib import Path
from dataclasses import dataclass, asdict
import json

# Team/owner names can contain characters outside the Windows console's
# default codepage (e.g. "☭") -- force UTF-8 stdout so the CLI doesn't
# crash printing them.
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent / "scripts"))
from season_rollover import _connect, fetch_final_standings  # noqa: E402


@dataclass
class Seed:
    seed: int
    owner: str
    team: str
    league: str  # "premier" | "championship"
    score: int
    reason: str


def _first_name(owner: str) -> str:
    return (owner or "").strip().split(" ", 1)[0].lower()


def _pool(rows: list[dict], league: str) -> list[dict]:
    """Rows sorted by descending Score, first name (alphabetical) as the
    tiebreak. Before any gameweek has been scored, everyone is tied at 0
    and this tiebreak alone determines the order -- which is exactly the
    "rank by first name" behavior wanted during preseason, with no
    special-casing needed: it falls out naturally from a stable tiebreak
    rule that also makes sense for any future tied scores."""
    return sorted(
        ({**r, "_league": league} for r in rows),
        key=lambda r: (-int(r.get("Score") or 0), _first_name(r.get("Owner"))),
    )


def _take(pool: list[dict], owner_name: str):
    """Remove and return the row for owner_name from pool, if present."""
    for i, r in enumerate(pool):
        if (r.get("Owner") or "").strip().lower() == owner_name.strip().lower():
            return pool.pop(i)
    return None


def compute_seeding(
    premier_rows: list[dict],
    championship_rows: list[dict],
    facup_winner: str,
    prem_winner: str,
    champ_winner: str,
) -> list[Seed]:
    prem_pool = _pool(premier_rows, "premier")
    champ_pool = _pool(championship_rows, "championship")
    pools = {"premier": prem_pool, "championship": champ_pool}

    seeds: list[Seed] = []
    missing: list[str] = []

    def assign(row, reason: str):
        seeds.append(Seed(
            seed=len(seeds) + 1,
            owner=row["Owner"],
            team=row["Team"],
            league=row["_league"],
            score=int(row.get("Score") or 0),
            reason=reason,
        ))

    # Seeds 1-3: trophy winners. Each is pulled from whichever pool
    # actually has them -- a manager could hold any combination of
    # these three trophies, or none, or all three in a wild season.
    for name, reason in [
        (facup_winner, "FA Cup Winner"),
        (prem_winner, "Premier League Winner"),
        (champ_winner, "Championship Winner"),
    ]:
        row = _take(prem_pool, name) or _take(champ_pool, name)
        if row is None:
            missing.append(f"{reason}: {name!r} not found in either league's current rows")
            continue
        assign(row, reason)

    # Seed 4: highest remaining score, either league (ties broken by first
    # name, same rule as everywhere else).
    candidates = prem_pool[:1] + champ_pool[:1]
    if candidates:
        best = min(candidates, key=lambda r: (-int(r.get("Score") or 0), _first_name(r.get("Owner"))))
        assign(pools[best["_league"]].pop(0), "Highest Overall Scorer")
        next_league = "championship" if best["_league"] == "premier" else "premier"
    else:
        next_league = "premier"

    # Seeds 5+: alternate leagues, starting with whichever league seed 4
    # was NOT drawn from. Once one pool is empty, keep drawing from the
    # other until both are empty.
    turn = next_league
    league_counts = {"premier": 0, "championship": 0}
    while prem_pool or champ_pool:
        pool = pools[turn]
        other = "championship" if turn == "premier" else "premier"
        if not pool:
            turn = other
            pool = pools[turn]
        if not pool:
            break
        league_counts[turn] += 1
        row = pool.pop(0)
        label = "Highest" if league_counts[turn] == 1 else f"{league_counts[turn]}{_ordsuf(league_counts[turn])} Highest"
        assign(row, f"{label} {'Prem' if turn == 'premier' else 'Champ'} (remaining)")
        turn = other

    if missing:
        raise ValueError("Could not build seeding:\n  " + "\n  ".join(missing))

    return seeds


def _ordsuf(n: int) -> str:
    if 10 <= n % 100 <= 20:
        return "th"
    return {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")


def bracket_shape(n_total: int, byes: int) -> dict:
    """
    How many play Round 1, and how many enter Round 2 directly, for a
    single-elimination bracket of n_total entrants with `byes` seeds
    skipping Round 1. Round 2's size is fixed to the largest power of 2
    that's <= n_total (so R16 -> QF -> SF -> Final all halve cleanly
    afterward) -- this reproduces the actual 2025-26 shape exactly when
    n_total=40, byes=8 (round2_size=32, r1_matches=8, direct_entrants=16).
    """
    round2_size = 1
    while round2_size * 2 <= n_total:
        round2_size *= 2
    r1_matches = n_total - round2_size
    direct_entrants = 2 * round2_size - byes - n_total
    return {
        "round2_size": round2_size,
        "r1_matches": r1_matches,
        "direct_entrants": direct_entrants,
    }


def compute_round1(seeds: list[Seed], byes: int) -> dict:
    """
    Only Round 1 is fully determined by seeding alone (best-remaining vs
    worst-remaining, among whoever doesn't have a bye) -- everything past
    that depends on a bracket-quadrant convention that hasn't been
    finalized for next season yet. Returns byes (top N seeds) and the
    Round 1 matchups for the bottom seeds.
    """
    n_total = len(seeds)
    shape = bracket_shape(n_total, byes)
    r1_matches = shape["r1_matches"]

    bye_seeds = [s for s in seeds if s.seed <= byes]
    r1_pool = [s for s in seeds if s.seed > n_total - 2 * r1_matches]
    matchups = []
    for i in range(r1_matches):
        top = r1_pool[i]
        bottom = r1_pool[-(i + 1)]
        matchups.append({"seed1": asdict(top), "seed2": asdict(bottom)})

    return {
        "byes": [asdict(s) for s in bye_seeds],
        "round1": matchups,
        "shape": shape,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--facup-winner", required=True)
    ap.add_argument("--prem-winner", required=True)
    ap.add_argument("--champ-winner", required=True)
    ap.add_argument("--out", default=None, help="Optional path to write JSON")
    args = ap.parse_args()

    with _connect() as conn:
        cur = conn.cursor()
        premier_rows = fetch_final_standings(cur, "premier")
        championship_rows = fetch_final_standings(cur, "championship")

    seeds = compute_seeding(
        premier_rows, championship_rows,
        args.facup_winner, args.prem_winner, args.champ_winner,
    )

    for s in seeds:
        print(f"{s.seed:>2}  {s.owner:<22} {s.team:<24} {s.league:<12} {s.score:>5}  {s.reason}")

    if args.out:
        Path(args.out).write_text(
            json.dumps([asdict(s) for s in seeds], indent=2), encoding="utf-8"
        )
        print(f"\nWrote {args.out}")


if __name__ == "__main__":
    sys.exit(main())
