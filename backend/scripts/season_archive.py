#!/usr/bin/env python3
"""
End-of-season archival: freeze a just-finished season's final standings
and register its version label everywhere the site looks it up.

Correction from an earlier version of this script: it used to also
generate a static Next.js archive page per season. That turned out to be
unnecessary and actively worse -- the site already renders past seasons
via a dynamic route (fpl-site/pages/seasons/[league]/[season].tsx) that
server-renders live from /api/season-summary, and that page has features
(global FPL rank, full-table zone labels) a generated static page didn't
reproduce. Generating a static file at that exact path would have been
picked up by Next.js's routing *instead of* the better dynamic page.
So: this script no longer touches fpl-site/pages/seasons/ at all.

What actually breaks once a new season starts, and what this fixes:
_load_season_rows() in backend/main.py originally only recognized the
literal string "2024-25" -- every other season fell through to "return
whatever the latest live snapshot is", regardless of which season was
asked for. Once a new season's fixtures start refreshing into
league_table_snapshots, every older season's archive URL would silently
start showing the new season's in-progress table. Freezing a season's
rows to a JSON file only helps if something asks for that file -- so
_load_season_rows() was generalized to check for
data/{league}_gw38_{season}.json for ANY season, not just one hardcoded
one. That fix lives directly in main.py, not in this script.

Subcommands:

    freeze     -- dump the live final standings for both leagues to
                  backend/data/{league}_gw38_{season}.json. This is the
                  step that actually needs to happen promptly once a
                  season ends and before the next one starts producing
                  snapshots, or the bug above resurfaces for this season.
    metadata   -- register the season's version label in the three
                  places that duplicate it: _LEAGUE_VERSIONS and
                  get_seasons()'s live-season list (backend/main.py),
                  STATIC_SEASONS (fpl-site/components/PastSeasonsButton.tsx),
                  and the VERSIONS dict inside
                  fpl-site/pages/seasons/[league]/[season].tsx.
                  Idempotent -- safe to run even if some/all of these
                  already have the entry (it skips what's already there).

What this does NOT do, on purpose:
    - Touch the FA Cup archive -- a separate, more bespoke data model
      (facupData*.ts, ArchivePastFACupsButton's STATIC_SEASONS,
      get_facup_seasons()). Handle by hand, or ask.
    - Decide the season's version letter (v6, v4, ...) -- pass it in.
      Guessing versions is exactly the kind of thing that goes quietly
      wrong; same reasoning as season_rollover.py.
    - Add a _STATIC_SEASON_META entry -- based on this project's actual
      history, that's a separate, later, hand-curated step (building a
      polished bespoke write-up), not something to fire automatically the
      moment a season ends.

Usage:
    python season_archive.py freeze --season 2026-27
    python season_archive.py metadata --season 2026-27 \\
        --premier-version v6 --championship-version v4
"""

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from season_rollover import _connect  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
FPL_SITE_DIR = REPO_ROOT / "fpl-site"


# ------------------------------------------------------------------ freeze

def fetch_final_rows(cur, league: str) -> list[dict]:
    cur.execute(
        """
        select payload from public.league_table_snapshots
        where league = %s order by generated_at desc limit 1
        """,
        (league,),
    )
    row = cur.fetchone()
    if not row:
        raise SystemExit(f"No table snapshot found for league={league!r}")
    return sorted(row["payload"].get("rows", []), key=lambda r: r["Position"])


def cmd_freeze(args):
    data_dir = BACKEND_DIR / "data"
    with _connect() as conn:
        cur = conn.cursor()
        for league in ("premier", "championship"):
            rows = fetch_final_rows(cur, league)
            out_path = data_dir / f"{league}_gw38_{args.season}.json"
            out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
            print(f"Wrote {out_path} ({len(rows)} rows)")
    print(
        "\nThese are picked up automatically by _load_season_rows() in "
        "backend/main.py for this exact season string -- nothing else to "
        "wire up. Once a newer season's data starts landing in "
        "league_table_snapshots, this season's archive URL will keep "
        "reading from the frozen file instead of the live (now-stale-for-"
        "this-season) snapshot."
    )


# --------------------------------------------------------------- metadata

def cmd_metadata(args):
    rows = {}
    for league in ("premier", "championship"):
        frozen_path = BACKEND_DIR / "data" / f"{league}_gw38_{args.season}.json"
        if frozen_path.exists():
            rows[league] = json.loads(frozen_path.read_text(encoding="utf-8"))

    versions = {"premier": args.premier_version, "championship": args.championship_version}

    # --- backend/main.py: _LEAGUE_VERSIONS ---
    main_py = BACKEND_DIR / "main.py"
    text = main_py.read_text(encoding="utf-8")
    for league in ("premier", "championship"):
        if re.search(r'"' + league + r'":\s*\{[^}]*"' + args.season + r'":', text):
            print(f"  _LEAGUE_VERSIONS[{league!r}][{args.season!r}] already present -- left untouched")
            continue
        pattern = r'("' + league + r'":\s*\{)'
        replacement = r'\1"' + args.season + r'": "' + versions[league] + r'", '
        new_text, n = re.subn(pattern, replacement, text, count=1)
        if n == 0:
            print(f"  ! could not find _LEAGUE_VERSIONS[{league!r}] in main.py -- add by hand")
        else:
            text = new_text
            print(f"  added _LEAGUE_VERSIONS[{league!r}][{args.season!r}] = {versions[league]!r}")
    main_py.write_text(text, encoding="utf-8")

    # --- backend/main.py: get_seasons()'s hardcoded live-season list ---
    text = main_py.read_text(encoding="utf-8")
    m = re.search(r'for season in \[("[\d-]+",?\s*)+\]:', text)
    if not m:
        print("  ! could not find get_seasons()'s hardcoded season list -- add by hand")
    elif f'"{args.season}"' in m.group(0):
        print(f"  {args.season!r} already in get_seasons()'s live-season list -- left untouched")
    else:
        old_list = m.group(0)
        new_list = old_list.replace("for season in [", f'for season in ["{args.season}", ')
        text = text.replace(old_list, new_list, 1)
        main_py.write_text(text, encoding="utf-8")
        print(f"  prepended {args.season!r} to get_seasons()'s live-season list")

    # --- fpl-site/components/PastSeasonsButton.tsx: STATIC_SEASONS ---
    psb_path = FPL_SITE_DIR / "components" / "PastSeasonsButton.tsx"
    text = psb_path.read_text(encoding="utf-8")
    for league in ("premier", "championship"):
        if league not in rows or not rows[league]:
            continue
        section_match = re.search(r'' + league + r':\s*\[(.*?)\],\n', text, re.S)
        if section_match and f'season: "{args.season}"' in section_match.group(1):
            print(f"  STATIC_SEASONS.{league} already has {args.season!r} -- left untouched")
            continue
        champion_row = min(rows[league], key=lambda r: r["Position"])
        entry = (
            f'{{ season: "{args.season}", version: "{versions[league]}", '
            f'champion: "{champion_row["Team"]}", manager: "{champion_row["Owner"]}" }},\n    '
        )
        pattern = r'(' + league + r':\s*\[\s*\n\s*)'
        new_text, n = re.subn(pattern, lambda m: m.group(1) + entry, text, count=1)
        if n == 0:
            print(f"  ! could not find STATIC_SEASONS.{league} array in PastSeasonsButton.tsx -- add by hand")
        else:
            text = new_text
            print(f"  added STATIC_SEASONS.{league} entry for {args.season!r}")
    psb_path.write_text(text, encoding="utf-8")

    # --- fpl-site/pages/seasons/[league]/[season].tsx: VERSIONS ---
    # (the dynamic route's own copy of the version-label lookup -- a third
    # place this duplicates, separate from _LEAGUE_VERSIONS and
    # STATIC_SEASONS above)
    dyn_path = FPL_SITE_DIR / "pages" / "seasons" / "[league]" / "[season].tsx"
    if dyn_path.exists():
        text = dyn_path.read_text(encoding="utf-8")
        for league in ("premier", "championship"):
            if re.search(r'\b' + league + r':\s*\{[^}]*"' + args.season + r'":', text):
                print(f"  [season].tsx VERSIONS[{league!r}][{args.season!r}] already present -- left untouched")
                continue
            pattern = r'(\b' + league + r':\s*\{)'
            replacement = r'\1 "' + args.season + r'": "' + versions[league] + r'",'
            new_text, n = re.subn(pattern, replacement, text, count=1)
            if n == 0:
                print(f"  ! could not find VERSIONS[{league!r}] in [season].tsx -- add by hand")
            else:
                text = new_text
                print(f"  added [season].tsx VERSIONS[{league!r}][{args.season!r}] = {versions[league]!r}")
        dyn_path.write_text(text, encoding="utf-8")
    else:
        print(f"  ! {dyn_path} not found -- VERSIONS there not updated, add by hand")

    print(
        "\nStill manual, not handled by this command:\n"
        "  - _STATIC_SEASON_META (backend/main.py) and FA Cup archival are "
        "later, hand-curated steps -- nothing to do here yet."
    )


# --------------------------------------------------------------- CLI glue

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    f = sub.add_parser("freeze", help="Dump live final standings to backend/data/")
    f.add_argument("--season", required=True, help="e.g. 2026-27")
    f.set_defaults(func=cmd_freeze)

    m = sub.add_parser("metadata", help="Register the season's version label everywhere it's duplicated")
    m.add_argument("--season", required=True)
    m.add_argument("--premier-version", required=True)
    m.add_argument("--championship-version", required=True)
    m.set_defaults(func=cmd_metadata)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
