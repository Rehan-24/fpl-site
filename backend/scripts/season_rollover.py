#!/usr/bin/env python3
"""
Roll manager stats forward from a just-finished season's final standings
and FA Cup result: experience, placements, best finish, trophies, and
promotion/relegation. Also bumps the season-tag strings that live in this
repo and (optionally) the companion Discord-bot repo.

Two-step workflow by design. Nothing touches the database until you've
reviewed the computed changes:

    1. compute   -- pulls live standings + the FA Cup bracket from
                    Supabase, computes every proposed change, writes a
                    JSON report and an HTML review page. No DB writes.
    2. apply     -- reads a (optionally hand-edited) report JSON and
                    writes it to the database.

    bump-season  -- separate step: updates the hardcoded season strings
                    in this repo, and in a companion bot repo if given.

What this script deliberately does NOT decide for you (learned the hard
way during the 2025-26 -> 2026-27 rollover):

    - The real promotion/relegation list, if it differs from a strict
      positional cutoff. It happened this season (a 6th-place Championship
      finisher was promoted over the 4th-place one) for reasons outside
      any dataset this script can see. ALWAYS check the "proposed"
      promoted/relegated lists in the review report before applying.
    - best_finish comparisons across leagues (e.g. is 7th in Premier
      better than 4th in Championship?) -- these are flagged as
      needs_review, never auto-resolved.
    - New managers joining, or managers retiring.
    - FPL league IDs, if the real-world league gets recreated with a new
      ID -- there's no way to discover that programmatically.
    - Manager profile photos.

Usage:
    python season_rollover.py compute --season 2026-27 \\
        --premier-version v6 --championship-version v4 --facup-version v3 \\
        --out report.json --html report.html

    # review report.html, hand-edit report.json if any proposed value is wrong

    python season_rollover.py apply --report report.json

    python season_rollover.py bump-season --new-season 2027-28 \\
        --bot-repo /path/to/fpl-discord-bot
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

import psycopg
from psycopg.rows import dict_row

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent


# ---------------------------------------------------------------- DB conn

def _load_db_url() -> str:
    url = os.environ.get("SUPABASE_DB_URL")
    if url:
        return url
    env_path = BACKEND_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("SUPABASE_DB_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(
        "SUPABASE_DB_URL not set and not found in backend/.env. "
        "Set it in your environment before running this script."
    )


def _connect():
    conn = psycopg.connect(_load_db_url(), row_factory=dict_row)
    conn.prepare_threshold = None
    return conn


# ------------------------------------------------------------- best-finish

def ordinal(n: int) -> str:
    suffixes = {1: "st", 2: "nd", 3: "rd"}
    if 10 <= n % 100 <= 20:
        suf = "th"
    else:
        suf = suffixes.get(n % 10, "th")
    return f"{n}{suf}"


def finish_score(league: str, pos: int) -> int:
    """Lower is better. A league win beats everything; otherwise a same-
    league position is only comparable to another position in that same
    league (cross-league comparisons are handled by flagging, not scoring)."""
    if league == "Premier" and pos == 1:
        return 0
    if league == "Championship" and pos == 1:
        return 1
    if league == "Premier":
        return 100 + pos
    return 200 + pos


_BLANK_RE = re.compile(r"^(n/?a\.?|null|researching.*)$", re.I)
_LEAGUE_RE = re.compile(r"-\s*(Premier|Championship)", re.I)
_WINNER_RE = re.compile(r"(premier league|championship) winner", re.I)
_POS_RE = {
    "Premier": re.compile(r"(\d+)(?:st|nd|rd|th)\s*-\s*Premier", re.I),
    "Championship": re.compile(r"(\d+)(?:st|nd|rd|th)\s*-\s*Championship", re.I),
}


def classify_best_finish(old_text, league: str, pos: int, version: str):
    """
    Returns (new_text, auto_apply: bool, needs_review: bool).
    Mirrors the logic used for the 2025-26 rollover, including the
    conservative default: cross-league comparisons and unparseable old
    text are always flagged for a human, never auto-applied.
    """
    old_text = (old_text or "").strip()
    is_blank = not old_text or bool(_BLANK_RE.match(old_text))

    candidate = (
        f"{'Premier League' if league == 'Premier' else 'Championship'} Winner {version}"
        if pos == 1
        else f"{ordinal(pos)} - {league} {version}"
    )

    if is_blank:
        return candidate, True, False

    this_score = finish_score(league, pos)

    winner_match = _WINNER_RE.search(old_text)
    if winner_match:
        old_league = "Premier" if "premier" in winner_match.group(1).lower() else "Championship"
        old_score = 0 if old_league == "Premier" else 1
    else:
        league_match = _LEAGUE_RE.search(old_text)
        old_league = league_match.group(1) if league_match else None
        pos_match = _POS_RE.get(old_league).search(old_text) if old_league else None
        if pos_match:
            old_score = (100 if old_league == "Premier" else 200) + int(pos_match.group(1))
        else:
            # had real text we couldn't parse -- never guess, always flag
            return candidate, False, True

    if pos == 1:
        # a title always updates best_finish, regardless of league
        return candidate, True, False

    if old_league == league and this_score < old_score:
        return candidate, True, False
    if this_score < old_score:
        # numerically "better" but in a different league -- needs a human call
        return candidate, False, True

    return old_text, False, False


# ------------------------------------------------------------------ fetch

def fetch_final_standings(cur, league: str) -> list[dict]:
    cur.execute(
        """
        select payload from public.league_table_snapshots
        where league = %s
        order by generated_at desc
        limit 1
        """,
        (league,),
    )
    row = cur.fetchone()
    if not row:
        raise SystemExit(f"No table snapshot found for league={league!r}")
    rows = row["payload"].get("rows", [])
    return sorted(rows, key=lambda r: r["Position"])


def fetch_managers(cur) -> dict:
    cur.execute(
        """
        select owner_name, current_league, premier_years, championship_years,
               promotions, relegations, placements, best_finish, titles, titles_list
        from public.manager
        """
    )
    return {r["owner_name"].strip().lower(): r for r in cur.fetchall()}


def fetch_facup_podium(cur, season: str) -> dict:
    """Returns {"winner": owner, "runner_up": owner, "third": owner} or
    empty dict entries for any match not yet resolved."""
    cur.execute(
        """
        with m as (
          select owner_name,
                 coalesce(entry_id, (substring(fpl_team_url from '/entry/(\\d+)/'))::int) as eid
          from public.manager
        )
        select b.round, m1.owner_name as owner1, m2.owner_name as owner2, b.winner_entry
        from public.facup_bracket b
        left join m m1 on m1.eid = b.entry_id1
        left join m m2 on m2.eid = b.entry_id2
        where b.season = %s and b.round in ('final', '3rd')
        """,
        (season,),
    )
    out = {"winner": None, "runner_up": None, "third": None}
    for r in cur.fetchall():
        if r["winner_entry"] is None:
            continue
        cur.execute(
            """
            select owner_name from public.manager
            where coalesce(entry_id, (substring(fpl_team_url from '/entry/(\\d+)/'))::int) = %s
            """,
            (r["winner_entry"],),
        )
        winner_row = cur.fetchone()
        winner = winner_row["owner_name"] if winner_row else None
        loser = r["owner2"] if winner == r["owner1"] else r["owner1"]
        if r["round"] == "final":
            out["winner"] = winner
            out["runner_up"] = loser
        else:  # '3rd'
            out["third"] = winner
    return out


# --------------------------------------------------------------- compute

def compute_rollover(
    cur,
    season: str,
    premier_version: str,
    championship_version: str,
    facup_version: str,
    promote_n: int,
    relegate_n: int,
    placement_n: int,
) -> dict:
    managers = fetch_managers(cur)
    premier_rows = fetch_final_standings(cur, "premier")
    champ_rows = fetch_final_standings(cur, "championship")
    facup = fetch_facup_podium(cur, season)

    changes = []
    missing = []

    def process(rows, league, version, promote_or_relegate_n, is_premier):
        total = len(rows)
        for r in rows:
            owner = r["Owner"]
            key = owner.strip().lower()
            mgr = managers.get(key)
            if not mgr:
                missing.append(owner)
                continue
            pos = int(r["Position"])

            is_placement = pos <= placement_n
            if is_premier:
                is_relegated = pos > total - relegate_n
                is_promoted = False
            else:
                is_promoted = pos <= promote_or_relegate_n
                is_relegated = False
            next_league = "Championship" if is_relegated else ("Premier" if is_promoted else league)

            new_premier_years = mgr["premier_years"] + (1 if is_premier else 0)
            new_champ_years = mgr["championship_years"] + (0 if is_premier else 1)

            def to_int(v):
                s = str(v or "").strip()
                return int(s) if re.fullmatch(r"\d+", s) else 0

            new_promotions = to_int(mgr["promotions"]) + (1 if is_promoted else 0)
            new_relegations = to_int(mgr["relegations"]) + (1 if is_relegated else 0)
            new_placements = (mgr["placements"] or 0) + (1 if is_placement else 0)

            best_finish, auto_apply, needs_review = classify_best_finish(
                mgr["best_finish"], league, pos, version
            )

            trophy_type = None
            if pos == 1:
                trophy_type = "premier" if is_premier else "championship"

            changes.append({
                "name": mgr["owner_name"],
                "league_this_season": league,
                "position": pos,
                "next_current_league": next_league,
                "is_promoted": is_promoted,
                "is_relegated": is_relegated,
                "is_placement": is_placement,
                "premier_years": new_premier_years,
                "championship_years": new_champ_years,
                "years_playing": new_premier_years + new_champ_years,
                "promotions": str(new_promotions),
                "relegations": str(new_relegations),
                "placements": new_placements,
                "best_finish": best_finish,
                "best_finish_needs_review": needs_review,
                "best_finish_proposed": best_finish if needs_review else None,
                "trophy_type": trophy_type,
            })

    process(premier_rows, "Premier", premier_version, relegate_n, True)
    process(champ_rows, "Championship", championship_version, promote_n, False)

    # FA Cup podium appends + trophy
    for name, suffix, trophy in [
        (facup.get("winner"), f"FA Cup Winner {facup_version}", "fa"),
        (facup.get("runner_up"), f"FA Cup Runner Up {facup_version}", None),
        (facup.get("third"), f"3rd Place FA Cup {facup_version}", None),
    ]:
        if not name:
            continue
        key = name.strip().lower()
        change = next((c for c in changes if c["name"].strip().lower() == key), None)
        if not change:
            continue
        change["facup_append"] = suffix
        if trophy:
            change["trophy_type_facup"] = trophy

    return {
        "season": season,
        "premier_version": premier_version,
        "championship_version": championship_version,
        "facup_version": facup_version,
        "facup_podium": facup,
        "missing_managers": missing,
        "changes": changes,
    }


# ----------------------------------------------------------------- apply

def apply_report(cur, report: dict) -> None:
    UPDATE_SQL = """
        update public.manager
        set premier_years=%(premier_years)s, championship_years=%(championship_years)s,
            years_playing=%(years_playing)s, current_league=%(next_current_league)s,
            promotions=%(promotions)s, relegations=%(relegations)s,
            placements=%(placements)s, best_finish=%(best_finish)s,
            updated_at=now()
        where lower(owner_name) = lower(%(name)s)
        returning id
    """
    TROPHY_SQL = """
        update public.manager_trophy set count = count + 1
        where manager_id = %s and type = %s
    """
    APPEND_SQL = """
        update public.manager set best_finish =
            case when best_finish is null or best_finish = '' then %s
                 else best_finish || ' // ' || %s end,
            updated_at = now()
        where lower(owner_name) = lower(%s)
    """
    TITLE_SQL = """
        update public.manager set titles = coalesce(titles,0) + 1,
            titles_list = case when titles_list is null or titles_list = ''
                then %s else titles_list || ', ' || %s end,
            updated_at = now()
        where lower(owner_name) = lower(%s)
    """

    updated = 0
    for c in report["changes"]:
        params = {k: c[k] for k in (
            "premier_years", "championship_years", "years_playing",
            "next_current_league", "promotions", "relegations",
            "placements", "best_finish", "name",
        )}
        cur.execute(UPDATE_SQL, params)
        row = cur.fetchone()
        if not row:
            print(f"  MISS (no such manager): {c['name']}")
            continue
        updated += 1
        manager_id = row["id"]

        if c.get("trophy_type"):
            cur.execute(TROPHY_SQL, (manager_id, c["trophy_type"]))
            label = "Premier League" if c["trophy_type"] == "premier" else "Championship"
            cur.execute(TITLE_SQL, (f"{label} {report['season']}", f"{label} {report['season']}", c["name"]))

        if c.get("trophy_type_facup"):
            cur.execute(TROPHY_SQL, (manager_id, "fa"))
            cur.execute(TITLE_SQL, (f"FA Cup {report['season']}", f"FA Cup {report['season']}", c["name"]))

        if c.get("facup_append"):
            cur.execute(APPEND_SQL, (c["facup_append"], c["facup_append"], c["name"]))

    print(f"Applied changes for {updated} of {len(report['changes'])} managers.")


# ----------------------------------------------------------------- HTML

def write_report_html(report: dict, path: Path) -> None:
    def esc(s):
        return (str(s or "")
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

    review_rows = [c for c in report["changes"] if c["best_finish_needs_review"]]
    rows_html = []
    for c in sorted(report["changes"], key=lambda x: (x["league_this_season"], x["position"])):
        flags = []
        if c["is_promoted"]:
            flags.append('<span class="chip up">Promoted</span>')
        if c["is_relegated"]:
            flags.append('<span class="chip down">Relegated</span>')
        if c["is_placement"]:
            flags.append('<span class="chip place">Placement</span>')
        if c.get("trophy_type"):
            flags.append('<span class="chip trophy">Trophy</span>')
        if c.get("trophy_type_facup"):
            flags.append('<span class="chip trophy">FA Cup</span>')
        if c["best_finish_needs_review"]:
            flags.append('<span class="chip review">needs review</span>')
        rows_html.append(f"""<tr>
          <td>{c['league_this_season']} #{c['position']}</td>
          <td>{esc(c['name'])}</td>
          <td>{esc(c['next_current_league'])}</td>
          <td>{' '.join(flags) or '&mdash;'}</td>
          <td>{esc(c['best_finish'])}{' // ' + esc(c['facup_append']) if c.get('facup_append') else ''}</td>
        </tr>""")

    review_html = "".join(
        f"<li><strong>{esc(c['name'])}</strong> ({c['league_this_season']} #{c['position']}) "
        f"&mdash; proposed: <code>{esc(c['best_finish_proposed'])}</code>. "
        f"Edit report.json's <code>best_finish</code> for this manager before applying if this isn't right.</li>"
        for c in review_rows
    )

    html = f"""<!doctype html><html><head><meta charset="utf-8">
<title>Season Rollover Review &mdash; {esc(report['season'])}</title>
<style>
  body {{ font-family: -apple-system, Segoe UI, sans-serif; max-width: 1000px; margin: 40px auto; padding: 0 20px; color: #1c2620; }}
  h1 {{ font-size: 24px; }}
  .warn {{ background: #f6ead0; border: 1px solid #d8b978; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 16px; }}
  th, td {{ text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd; }}
  th {{ background: #eef0e8; text-transform: uppercase; font-size: 11px; letter-spacing: .04em; color: #5c6760; }}
  .chip {{ display: inline-block; font-size: 11px; padding: 2px 7px; border-radius: 999px; margin-right: 3px; }}
  .chip.up {{ background: #e2eaf6; color: #2f5fa8; }}
  .chip.down {{ background: #f6e0da; color: #a5402e; }}
  .chip.place {{ background: #e3efe6; color: #2f6f4f; }}
  .chip.trophy {{ background: #f6ead0; color: #9a6510; }}
  .chip.review {{ background: #ece5f4; color: #6a4c93; }}
</style></head><body>
  <h1>Season Rollover Review &mdash; {esc(report['season'])}</h1>
  <p>Premier {esc(report['premier_version'])} &middot; Championship {esc(report['championship_version'])} &middot; FA Cup {esc(report['facup_version'])}</p>
  <p>FA Cup: winner {esc(report['facup_podium'].get('winner') or '&mdash;')},
     runner-up {esc(report['facup_podium'].get('runner_up') or '&mdash;')},
     3rd {esc(report['facup_podium'].get('third') or '&mdash;')}</p>
  {f'<div class="warn"><strong>{len(review_rows)} best-finish calls need your review before applying:</strong><ul>{review_html}</ul></div>' if review_rows else ''}
  {f'<div class="warn"><strong>Could not match to a manager record:</strong> {", ".join(esc(m) for m in report["missing_managers"])}</div>' if report['missing_managers'] else ''}
  <table>
    <thead><tr><th>Finish</th><th>Manager</th><th>2027-28 League</th><th>Flags</th><th>Best finish</th></tr></thead>
    <tbody>{''.join(rows_html)}</tbody>
  </table>
</body></html>"""
    path.write_text(html, encoding="utf-8")


# ------------------------------------------------------------ bump-season

# (file relative to repo root, pattern, replacement template)
SEASON_BUMP_TARGETS = [
    ("backend/facup_db.py", r'SEASON = "[\d-]+"', 'SEASON = "{new}"'),
    ("backend/mundo_scraper.py", r'SEASON_REVIEW_TAG = "GW-Review-[\d/]+"', 'SEASON_REVIEW_TAG = "GW-Review-{new_slash}"'),
]

BOT_REPO_TARGETS = [
    ("mundo_scraper.py", r'SEASON_REVIEW_TAG = "GW-Review-[\d/]+"', 'SEASON_REVIEW_TAG = "GW-Review-{new_slash}"'),
    ("index.js", r'const FPL_MUNDO_TAG = "GW-Review-[\d/]+";', 'const FPL_MUNDO_TAG = "GW-Review-{new_slash}";'),
    ("index.js", r'process\.env\.WEEKLY_REVIEW_TAG \|\| "GW-Review-[\d/]+"', 'process.env.WEEKLY_REVIEW_TAG || "GW-Review-{new_slash}"'),
    ("facup.js", r'process\.env\.FA_CUP_SEASON \|\| "[\d-]+"', 'process.env.FA_CUP_SEASON || "{new}"'),
]


def _apply_replacement(path: Path, pattern: str, replacement: str) -> bool:
    text = path.read_text(encoding="utf-8")
    new_text, n = re.subn(pattern, replacement, text)
    if n == 0:
        print(f"  ! pattern not found, left untouched: {path}")
        return False
    path.write_text(new_text, encoding="utf-8")
    print(f"  updated: {path}")
    return True


def bump_season(new_season: str, bot_repo: Optional[str]) -> None:
    new_slash = new_season.replace("-", "/")
    for rel_path, pattern, template in SEASON_BUMP_TARGETS:
        path = REPO_ROOT / rel_path
        _apply_replacement(path, pattern, template.format(new=new_season, new_slash=new_slash))

    if bot_repo:
        bot_root = Path(bot_repo)
        if not bot_root.exists():
            print(f"  ! bot repo path does not exist: {bot_root}")
        else:
            for rel_path, pattern, template in BOT_REPO_TARGETS:
                path = bot_root / rel_path
                if not path.exists():
                    print(f"  ! not found in bot repo, skipped: {path}")
                    continue
                _apply_replacement(path, pattern, template.format(new=new_season, new_slash=new_slash))
    else:
        print("  (no --bot-repo given -- the companion bot repo's season tags were NOT touched)")

    print(
        "\nStill manual, not handled by this command:\n"
        "  - _LEAGUE_VERSIONS, get_seasons(), _STATIC_SEASON_META in backend/main.py\n"
        "    (those belong to the END-of-season archival step, not this one)\n"
        "  - FA Cup draw for the new season (facup_seedings_map.py, FA_CUP_GWS)\n"
        "  - New league IDs, if FPL issued new ones for the recreated leagues"
    )


# --------------------------------------------------------------- CLI glue

def cmd_compute(args):
    with _connect() as conn:
        report = compute_rollover(
            conn.cursor(), args.season, args.premier_version, args.championship_version,
            args.facup_version, args.promote_count, args.relegate_count, args.placement_count,
        )
    Path(args.out).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {args.out}")
    if args.html:
        write_report_html(report, Path(args.html))
        print(f"Wrote {args.html} -- open it in a browser and review before running 'apply'")
    n_review = sum(1 for c in report["changes"] if c["best_finish_needs_review"])
    if n_review:
        print(f"\n{n_review} best-finish call(s) need your review -- see the HTML report.")


def cmd_apply(args):
    report = json.loads(Path(args.report).read_text(encoding="utf-8"))
    with _connect() as conn:
        apply_report(conn.cursor(), report)
        conn.commit()


def cmd_bump_season(args):
    bump_season(args.new_season, args.bot_repo)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("compute", help="Compute the rollover, write a report (no DB writes)")
    c.add_argument("--season", required=True, help="The season that just finished, e.g. 2026-27")
    c.add_argument("--premier-version", required=True, help="e.g. v6")
    c.add_argument("--championship-version", required=True, help="e.g. v4")
    c.add_argument("--facup-version", required=True, help="e.g. v3")
    c.add_argument("--promote-count", type=int, default=4)
    c.add_argument("--relegate-count", type=int, default=4)
    c.add_argument("--placement-count", type=int, default=7)
    c.add_argument("--out", default="rollover_report.json")
    c.add_argument("--html", default="rollover_report.html")
    c.set_defaults(func=cmd_compute)

    a = sub.add_parser("apply", help="Apply a (reviewed) report to the database")
    a.add_argument("--report", required=True)
    a.set_defaults(func=cmd_apply)

    b = sub.add_parser("bump-season", help="Update hardcoded season-tag strings")
    b.add_argument("--new-season", required=True, help="e.g. 2027-28")
    b.add_argument("--bot-repo", default=None, help="Path to the fpl-discord-bot checkout")
    b.set_defaults(func=cmd_bump_season)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
