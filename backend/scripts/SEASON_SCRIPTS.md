# Season transition scripts

Two scripts handle the two moments every FPL season has: a new one starting,
and an old one finishing. Both talk directly to the live Supabase database —
read `SUPABASE_DB_URL` from your environment, or set it in `backend/.env`
(the scripts fall back to reading that file if the env var isn't set).

Run them from `backend/scripts/`, with the same Python environment the
backend uses (needs `psycopg`).

```bash
cd backend/scripts
python season_rollover.py --help
python season_archive.py --help
```

---

## `season_rollover.py` — start of a new season

Rolls every manager's stats forward using the season that just finished:
experience, placements, trophies, best finish, promotion/relegation. This is
the script version of the 2025-26 → 2026-27 rollover done by hand.

**Two-step, on purpose.** Nothing touches the database until you've reviewed
what it computed. Twice during the manual rollover, a naive "just compute
it" pass got something wrong that only a human could catch — the promotion
list wasn't strictly top-4 one year (someone outside the data moved up
instead), and several best-finish comparisons needed a judgment call on
which league's placement actually mattered more. This script surfaces
exactly those cases instead of guessing.

### 1. Compute

```bash
python season_rollover.py compute --season 2026-27 \
  --premier-version v6 --championship-version v4 --facup-version v3 \
  --out report.json --html report.html
```

- `--season` is the season that just ended (the one whose final standings
  you're rolling forward from).
- The three `--*-version` flags are the version letters for that outgoing
  season's `best_finish` text (e.g. `"Premier League Winner v6"`). Look them
  up in `_LEAGUE_VERSIONS` in `backend/main.py` and the FA Cup archive page's
  title — don't guess; a wrong version letter silently writes wrong history.
- Nothing is written to the database in this step.

Open `report.html` in a browser. It'll call out:

- **Promoted/relegated lists** — computed as a strict positional cutoff
  (default: top 4 promoted, bottom 4 relegated). Confirm this actually
  matches what happened — leagues occasionally deviate from a clean
  cutoff for reasons no dataset captures.
- **Best-finish calls needing review** — any manager whose new finish is
  numerically "better" but in a *different* league than their stored best.
  The script won't guess whether 7th in Premier beats 4th in Championship;
  you decide.
- **FA Cup podium** — winner/runner-up/3rd, resolved from the bracket by
  FPL entry ID. Double-check these against what actually happened.

If anything needs correcting, edit `report.json` directly (it's the same
data the HTML is rendered from) — change a `best_finish` value, flip
`is_promoted`/`is_relegated`/`next_current_league` for a manager, whatever's
wrong. Re-run `compute` and regenerate the HTML if you want to re-review
after a bigger change, or just hand-edit the JSON for small fixes.

### 2. Apply

```bash
python season_rollover.py apply --report report.json
```

Writes every field in the (reviewed) report to `public.manager` and
`public.manager_trophy`. This is the only step that touches the database.

### What this script does NOT do

Handle these the same way as always — by hand, or by asking:

- **League IDs.** FPL assigns these; there's no way to discover a new one
  programmatically. If the real-world leagues got recreated, the ID swap
  has to happen by hand across both this repo and the bot repo (search for
  the old numeric IDs).
- **Season-tag strings** (`SEASON` in `facup_db.py`, the `GW-Review-*` tags,
  `FA_CUP_SEASON` in the bot's `facup.js`) — use `bump-season` (below).
- **New managers joining, or managers retiring.**
- **The FA Cup draw** for the *new* season — new seed pairings, new
  gameweek range. That's a fresh manual draw each year, not derivable from
  data.
- **Manager profile photos.**

### `bump-season` — the season-tag strings

```bash
python season_rollover.py bump-season --new-season 2027-28 \
  --bot-repo /path/to/fpl-discord-bot
```

Updates `SEASON` in `backend/facup_db.py` and the `GW-Review-*` tags in
both repos' `mundo_scraper.py` / `index.js` / `facup.js`. Pass `--bot-repo`
pointing at your local checkout of the bot repo, or omit it to only touch
this repo (you'll need to update the bot repo's tags by hand in that case).

Still separately manual after this: `_LEAGUE_VERSIONS`, `get_seasons()`,
and `_STATIC_SEASON_META` in `backend/main.py` — those belong to the
*previous* season's archival (see below), not this one.

---

## `season_archive.py` — winding down a finished season

Freezes a season's final standings so its archive page keeps showing that
season's data forever, even after a new season starts overwriting the live
snapshot table.

**Important context if you're reading this later and wondering why there's
no "generate the archive page" step:** there used to be one, and it was a
mistake. The site already renders past seasons via
`fpl-site/pages/seasons/[league]/[season].tsx`, a page that server-renders
live from `/api/season-summary` on every request — and it's better than
anything this script could generate (it has a Global FPL Rank section and
full-table zone labels a generated static page didn't reproduce). Writing a
static file at that same URL path would make Next.js serve the *worse*
generated page instead of the good dynamic one. So: don't add that step
back without a real reason. The only thing that actually needed fixing was
`_load_season_rows()` in `main.py`, which used to only recognize the
literal string `"2024-25"` — every other season silently fell through to
"whatever the latest live snapshot is," which meant an old season's page
would start showing the *new* season's in-progress table the moment fresh
data started landing in `league_table_snapshots`. That's fixed generically
now (it checks for a frozen file for any season), which is what the
`freeze` step below feeds.

### 1. Freeze

```bash
python season_archive.py freeze --season 2026-27
```

Dumps both leagues' final standings to
`backend/data/{league}_gw38_2026-27.json`. Run this once the season is
actually over (GW38 final results in) and before the next season's fixtures
start refreshing — the whole point is to freeze the data before it gets
overwritten by "latest snapshot."

### 2. Metadata

```bash
python season_archive.py metadata --season 2026-27 \
  --premier-version v6 --championship-version v4
```

Registers the season's version label in the three places that duplicate it
(discovered the hard way — don't assume there are only two):
`_LEAGUE_VERSIONS` and `get_seasons()`'s live-season list in
`backend/main.py`, `STATIC_SEASONS` in
`fpl-site/components/PastSeasonsButton.tsx`, and the `VERSIONS` dict inside
`fpl-site/pages/seasons/[league]/[season].tsx` itself. Idempotent — safe to
re-run, it skips whatever's already registered rather than duplicating it.

### What this script does NOT do

- **FA Cup archival.** Separate, more bespoke data model
  (`fpl-site/lib/facupData*.ts`, `ArchivePastFACupsButton`'s own
  `STATIC_SEASONS`, `get_facup_seasons()`). Handle by hand, or ask.
- **`_STATIC_SEASON_META`.** Based on how this project has actually been
  maintained, that's a later, hand-curated step (a proper polished
  write-up), done in batches well after the season ends — not something
  that should fire automatically the moment `freeze` runs.

---

## `facup_freeze.py` — locking in the FA Cup at kickoff

The site shows a *live* projected FA Cup seeding from the moment a new
season starts (via `/api/facup/projected-seeding`, recomputed from
current standings on every request) -- this script is what turns that
live preview into the real, permanent tournament, once, at the
season's actual kickoff gameweek. Don't run it before then; the whole
point of the live preview is that seeding keeps shuffling right up
until the freeze.

Same two-step safety pattern as everything else here -- nothing writes
to `facup_bracket` until you've reviewed the computed seeding and
bracket:

```bash
python facup_freeze.py compute --season 2026-27 --kickoff-gw 22 --auto-qualify 16 \
    --facup-winner "Marvin Ling" --prem-winner "Michael Giles" \
    --champ-winner "Aaron Frank" --out facup_report.json

# review facup_report.json -- especially the "round2" section

python facup_freeze.py apply --report facup_report.json
```

The top `auto-qualify` seeds (16 by default) skip straight to the Round
of 32; everyone else plays a single Qualification Round, paired
best-remaining vs worst-remaining. Since 16 auto-qualifiers + 12
Qualification Round winners (for the default 40-seed/16-auto-qualify
case) isn't a power of 2, the strongest few advancing seeds get an
additional walkover straight past Round of 32 too -- `apply` handles
this automatically by pre-filling their Round-of-16 slot directly
rather than writing an unplayable Round-of-32 row.

`apply` clears any existing bracket rows for that season first (safe
to re-run if you need to fix something before the tournament actually
starts), resolves every seed to a real FPL entry ID, and writes the
Qualification Round + Round of 32 fully seeded plus empty placeholder
rows for R16 onward -- same shape `facup_recalculate.py` already
produces, so the existing score-refresh cron (`refresh-facup.yml`)
picks it up with no changes.

**The Round 2 pairing is worth understanding before you trust it.**
2025-26's bracket used a hand-built quadrant convention that was never
written down and didn't reduce to a plain algorithm on inspection --
reproducing it exactly would have meant guessing at an undocumented
rule. `compute_full_bracket()` in `facup_seeding.py` uses the real,
well-known tournament-seeding algorithm instead (`_standard_bracket_order`
-- the same method that guarantees seed 1 and seed 2 can only meet in
the final in any properly-seeded bracket). It's regression-tested
against 2025-26's actual Round 1 structure and validated to produce a
complete, gap-free, duplicate-free bracket, but it will *not* reproduce
2025-26's specific Round 2 pairings byte-for-byte, because those
weren't generated by a rule this method (or any plain algorithm) can
recover. Worth a second look the first time this actually runs for
real.

**What's not automated yet:** nothing currently triggers `compute` on
its own at the kickoff gameweek -- run it by hand when GW22 (or
whatever season's kickoff GW) arrives. The `FACupBracket` component on
the site still reads its Round 1 / Round 2 layout from the *static*
`fpl-site/lib/facupSeedings.ts` import rather than the live bracket API
response, so it'll keep showing 2025-26's structure until that
component is updated to derive its layout from whichever season is
actually frozen -- needed before the new bracket can display correctly
on the site, not just exist in the database.

---

## A season, start to finish

1. Season ends (GW38 final results in) →
   `season_archive.py freeze --season <ending>`,
   then `season_archive.py metadata --season <ending> --premier-version ... --championship-version ...`
2. New season's league IDs are sorted out (by hand)
3. `season_rollover.py compute --season <ending> ...` → review the HTML
   report, fix anything wrong in the JSON
4. `season_rollover.py apply --report report.json`
5. `season_rollover.py bump-season --new-season <new> --bot-repo ...`
6. At the new season's kickoff gameweek: `facup_freeze.py compute` →
   review → `facup_freeze.py apply`
7. Review everything with `git diff`, commit, push
