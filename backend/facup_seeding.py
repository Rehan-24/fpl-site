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


def bracket_shape(n_total: int, auto_qualify: int) -> dict:
    """
    Three tiers for a single-elimination bracket of n_total entrants:

      1. auto_qualify seeds   -- explicit, spotlighted qualifiers (top
                                  3 trophy winners + highest scorer, by
                                  default) that skip the Qualification
                                  Round with a clearly-stated reason.
      2. "direct entrants"    -- also skip the Qualification Round with
                                  no game, for a purely mechanical
                                  reason: Round of 32's size is fixed to
                                  the largest power of 2 <= n_total, and
                                  reaching that cleanly requires it.
      3. Qualification Round  -- the bottom seeds, paired
                                  best-remaining vs worst-remaining,
                                  playing for the rest of the Round of
                                  32 spots.

    Round of 32's size (and therefore the Qualification Round's size)
    depends only on n_total, not on auto_qualify -- e.g. for n_total=40,
    round2_size is always 32 and the Qualification Round is always the
    bottom 16 (8 matches), regardless of whether auto_qualify is 4 or
    24. auto_qualify only controls how many of the 24 non-playing seeds
    get their qualification reason spotlighted vs shown as a plain
    "advancing directly" status -- it doesn't change the bracket shape
    itself, since both tiers land in the same ordered pool entering
    Round of 32. This reproduces 2025-26's actual bracket shape exactly
    when auto_qualify=4 (round2_size=32, qualifying_matches=8,
    direct_entrants=20).
    """
    round2_size = 1
    while round2_size * 2 <= n_total:
        round2_size *= 2
    qualifying_matches = n_total - round2_size
    direct_entrants = 2 * round2_size - auto_qualify - n_total
    round32_cutoff = auto_qualify + direct_entrants
    return {
        "auto_qualify": auto_qualify,
        "round2_size": round2_size,
        "qualifying_matches": qualifying_matches,
        "direct_entrants": direct_entrants,
        "round32_cutoff": round32_cutoff,
    }


def compute_round1(seeds: list[Seed], auto_qualify: int) -> dict:
    """
    Only the Qualification Round is fully determined by seeding alone
    (best-remaining vs worst-remaining, among whoever doesn't advance
    directly) -- everything past that depends on actual results.
    Returns the auto-qualified seeds and the Qualification Round
    matchups for the bottom seeds.
    """
    n_total = len(seeds)
    shape = bracket_shape(n_total, auto_qualify)
    qualifying_matches = shape["qualifying_matches"]

    auto_seeds = [s for s in seeds if s.seed <= auto_qualify]
    qual_pool = [s for s in seeds if s.seed > n_total - 2 * qualifying_matches]
    matchups = []
    for i in range(qualifying_matches):
        top = qual_pool[i]
        bottom = qual_pool[-(i + 1)]
        matchups.append({"seed1": asdict(top), "seed2": asdict(bottom)})

    return {
        "byes": [asdict(s) for s in auto_seeds],
        "round1": matchups,
        "shape": shape,
    }


def _standard_bracket_order(size: int) -> list[int]:
    """
    The standard single-elimination seeding order for `size` (a power of
    2) virtual ranks 1..size, such that rank 1 and rank 2 can only meet
    in the final, ranks {1,4} and {2,3} only in the semifinal, and so on
    -- the same guarantee real tournaments (and last year's hand-built
    bracket) protect the top seeds with. Returns the ranks in bracket
    order, i.e. adjacent pairs are Round-2 opponents:
    (order[0] vs order[1]), (order[2] vs order[3]), ...
    """
    order = [1]
    n = 1
    while n < size:
        n *= 2
        order = [x for s in order for x in (s, n + 1 - s)]
    return order


def compute_full_bracket(seeds: list[Seed], auto_qualify: int) -> dict:
    """
    Full projected bracket: the Qualification Round (as compute_round1)
    plus Round of 32 pairings. Round of 32 always comes out to exactly
    round2_size entrants (32 for a 40-seed season) -- auto-qualifiers +
    direct entrants + Qualification Round winners -- so there's no
    padding or walkovers needed; every Round-of-32 slot is a real
    entrant. Uses the standard bracket-seeding algorithm (see
    _standard_bracket_order) for pairing, not a bespoke hand-built
    quadrant convention -- a real, well-known, explainable method that
    protects the top seeds (1-vs-2 only possible in the Final).

    Virtual ranks 1..round2_size entering Round of 32 are assigned as:
      1..auto_qualify                      -> the auto-qualified seeds,
                                               in seed order
      auto_qualify+1..round32_cutoff       -> direct entrants, in seed
                                               order
      round32_cutoff+1..round2_size        -> Qualification Round
                                               winners, ranked by their
                                               match's stronger seed,
                                               assigned in REVERSE match
                                               order (highest virtual
                                               rank = Match 1's winner)

    That reverse assignment isn't arbitrary: _standard_bracket_order's
    first-round opponents always sum to round2_size+1 (rank k always
    faces rank round2_size+1-k) -- a textbook property of the seeding
    recursion. So for k in 1..qualifying_matches, seed k's opponent is
    rank round2_size+1-k, which lands exactly in the Qualification
    Round winner zone as k ranges over 1..qualifying_matches. Assigning
    Match k's winner to that exact rank is what makes seed k face
    Match k's winner (seed 1 vs the strongest expected KO survivor,
    seed 2 vs the next, and so on for the top `qualifying_matches`
    seeds) -- while every seed past that pairs up amongst the direct
    entrants themselves via the same reflection property, which turns
    out to be identical to a plain best-vs-worst pairing there too.
    """
    base = compute_round1(seeds, auto_qualify)
    shape = base["shape"]
    auto_seeds = base["byes"]
    round1 = base["round1"]

    n_total = len(seeds)
    round32_cutoff = shape["round32_cutoff"]
    qualifying_matches = shape["qualifying_matches"]
    round2_size = shape["round2_size"]
    direct_entrants_seeds = [
        s for s in seeds
        if s.seed > auto_qualify and s.seed <= round32_cutoff
    ]

    # virtual rank -> a descriptor of who's actually there entering Round of 32
    virtual: dict[int, dict] = {}
    for i, b in enumerate(auto_seeds):
        virtual[i + 1] = {"kind": "seed", "seed": b}
    for i, s in enumerate(direct_entrants_seeds):
        virtual[auto_qualify + i + 1] = {"kind": "seed", "seed": asdict(s)}
    for i in range(qualifying_matches):
        virtual[round2_size - i] = {"kind": "ko_winner", "match_idx": i, "match": round1[i]}

    order = _standard_bracket_order(shape["round2_size"])
    round2 = []
    for i in range(0, len(order), 2):
        round2.append({
            "slot1": virtual[order[i]],
            "slot2": virtual[order[i + 1]],
        })

    return {
        "byes": auto_seeds,
        "round1": round1,
        "round2": round2,
        "shape": shape,
    }


def compute_bracket_placement(seeds: list[Seed], auto_qualify: int) -> dict:
    """
    What the bracket layout actually looks like right now -- no results
    simulated or guessed. Qualification Round and Round of 32 are real
    (auto-qualified seeds, direct entrants, real KO pairings). Round of
    16 onward is entirely unknowable until real games are played, so
    every slot there is TBD.
    """
    base = compute_full_bracket(seeds, auto_qualify)
    round1 = base["round1"]
    round2 = base["round2"]
    shape = base["shape"]

    n_r32 = len(round2)
    n_r16, n_qf, n_sf = n_r32 // 2, n_r32 // 4, n_r32 // 8

    tbd_round = lambda n: [{"slot1": {"kind": "tbd"}, "slot2": {"kind": "tbd"}} for _ in range(n)]

    return {
        "byes": base["byes"],
        "qualification_round": round1,
        "round_of_32": round2,
        "round_of_16": tbd_round(n_r16),
        "quarterfinals": tbd_round(n_qf),
        "semifinals": tbd_round(n_sf),
        "final": tbd_round(1),
        "third_place": tbd_round(1),
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
