#!/usr/bin/env python3
"""
Backfill each manager's FPL season history from before this site started
tracking manager_season_stats (2021-22 onward), plus fold in any season
FPL knows about that our own tables are missing for any other reason.

Source of truth: the FPL public API's /entry/{id}/history/ endpoint,
via each manager's *current* fpl_team_url -- entry IDs are permanent
per FPL account, so a manager's current entry's "past" array covers
every season that specific account has ever played, however far back
that goes (some go back to 2013/14). If a manager's account is newer
than that, we simply won't find anything for the older seasons --
expected and fine, not an error.

These are league-agnostic facts (FPL's own overall_rank/total_points
for that season), not our mini-league's results, so:
  - placement and league_points are always left NULL -- there's no
    "our mini-league" placement/points concept for a season before a
    manager joined it, or for FPL's overall standings in general.
  - total_score and overall_rank are filled in from FPL's history.

Writes to public.season_stats, the same "backfilled data" overlay
table /api/managers/{owner}/seasons already merges over
manager_season_stats (preferring manager_season_stats' real
in-league-tracked values whenever both exist for the same season).

Two-step, same reasoning as every other script here: nothing is
written to the database until you've reviewed the computed report.

    1. compute  -- pulls every manager's FPL history, writes a JSON
                   report. No DB writes.
    2. apply    -- reads the (optionally hand-edited) report and
                   upserts public.season_stats.

Usage:
    python backfill_season_history.py compute --out season_history_report.json
    # review season_history_report.json
    python backfill_season_history.py apply --report season_history_report.json
"""

import argparse
import io
import json
import re
import sys
import time
from pathlib import Path

import requests

if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from season_rollover import _connect  # noqa: E402

FPL_BASE = "https://fantasy.premierleague.com/api"
ENTRY_RE = re.compile(r"/entry/(\d+)/")
HTTP_HEADERS = {"User-Agent": "tfpl-backfill/1.0"}


def _parse_entry_id(url):
    if not url:
        return None
    m = ENTRY_RE.search(url)
    return int(m.group(1)) if m else None


def _season_label(fpl_season_name: str) -> str:
    """'2013/14' -> '2013-14'"""
    return fpl_season_name.replace("/", "-")


def fetch_history(entry_id: int) -> dict:
    r = requests.get(f"{FPL_BASE}/entry/{entry_id}/history/", headers=HTTP_HEADERS, timeout=20)
    r.raise_for_status()
    return r.json() or {}


def cmd_compute(args):
    with _connect() as conn:
        cur = conn.cursor()
        cur.execute("""
            select owner_name, fpl_team_url
            from public.manager
            where fpl_team_url is not null
            order by lower(owner_name)
        """)
        managers = cur.fetchall()

        cur.execute("select owner_name, season from public.manager_season_stats")
        already_tracked = {(r["owner_name"].strip().lower(), r["season"]) for r in cur.fetchall()}

    rows = []
    errors = []
    per_manager_summary = []

    for m in managers:
        owner = m["owner_name"]
        eid = _parse_entry_id(m["fpl_team_url"])
        if not eid:
            errors.append({"owner": owner, "error": "no fpl_entry_id resolvable from fpl_team_url"})
            continue

        try:
            hist = fetch_history(eid)
        except Exception as e:
            errors.append({"owner": owner, "entry_id": eid, "error": f"{type(e).__name__}: {e}"})
            continue

        found_seasons = []
        for p in hist.get("past", []):
            season = _season_label(p["season_name"])
            rows.append({
                "owner_name": owner,
                "season": season,
                "fpl_entry_id": eid,
                "total_score": p.get("total_points"),
                "overall_rank": p.get("rank"),
                "already_tracked_in_manager_season_stats": (owner.strip().lower(), season) in already_tracked,
            })
            found_seasons.append(season)

        per_manager_summary.append({
            "owner": owner,
            "entry_id": eid,
            "seasons_found": sorted(found_seasons),
            "earliest_season": min(found_seasons) if found_seasons else None,
        })

        time.sleep(0.2)  # polite pacing across ~40 sequential FPL API calls

    report = {"rows": rows, "errors": errors, "summary": per_manager_summary}
    Path(args.out).write_text(json.dumps(report, indent=2), encoding="utf-8")

    new_rows = [r for r in rows if not r["already_tracked_in_manager_season_stats"]]
    pre_2021 = [r for r in new_rows if r["season"] < "2021-22"]

    print(f"Wrote {args.out}")
    print(f"{len(managers)} managers checked, {len(errors)} errors")
    print(f"{len(rows)} total season-rows found across FPL history")
    print(f"{len(new_rows)} of those aren't already in manager_season_stats ({len(pre_2021)} of those are pre-2021-22)")
    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  {e['owner']}: {e['error']}")
    print("\nPer-manager earliest season found:")
    for s in per_manager_summary:
        print(f"  {s['owner']:<25} earliest={s['earliest_season'] or '(none found)'}")


def cmd_apply(args):
    report = json.loads(Path(args.report).read_text(encoding="utf-8"))
    rows = report["rows"]

    sql = """
        insert into public.season_stats
            (owner_name, season, fpl_entry_id, total_score, overall_rank, updated_at)
        values (%(owner_name)s, %(season)s, %(fpl_entry_id)s, %(total_score)s, %(overall_rank)s, now())
        on conflict (owner_name, season) do update set
            fpl_entry_id = excluded.fpl_entry_id,
            total_score  = excluded.total_score,
            overall_rank = excluded.overall_rank,
            updated_at   = now()
    """

    with _connect() as conn:
        cur = conn.cursor()
        for row in rows:
            cur.execute(sql, row)
        conn.commit()

    print(f"Upserted {len(rows)} season_stats rows from {args.report!r}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("compute", help="Pull FPL history for every manager, write a report (no DB writes)")
    c.add_argument("--out", default="season_history_report.json")
    c.set_defaults(func=cmd_compute)

    a = sub.add_parser("apply", help="Apply a (reviewed) report to the database")
    a.add_argument("--report", required=True)
    a.set_defaults(func=cmd_apply)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
