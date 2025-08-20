import os, re, time, argparse, requests
import psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL")
FPL = "https://fantasy.premierleague.com/api"
ENTRY_RE = re.compile(r"/entry/(\d+)/")

SEASONS = ["2021-22","2022-23","2023-24","2024-25","2025-26"]  # adjust as needed

def _entry_from_url(url: str|None) -> int|None:
    if not url: return None
    m = ENTRY_RE.search(url)
    return int(m.group(1)) if m else None

def _season_slug_from_fpl(name: str) -> str:
    # "2023/24" -> "2023-24"
    name = (name or "").strip()
    return name.replace("/", "-")

def fetch_managers():
    sql = "select owner_name, team as team_name, fpl_team_url from public.manager where active = true"
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def upsert(rows):
    if not rows: return 0
    sql = """
    INSERT INTO public.season_stats
      (owner_name, season, fpl_entry_id, team_name, placement, league_points, total_score, overall_rank, updated_at)
    VALUES
      (%(owner_name)s, %(season)s, %(fpl_entry_id)s, %(team_name)s, %(placement)s, %(league_points)s, %(total_score)s, %(overall_rank)s, now())
    ON CONFLICT (owner_name, season) DO UPDATE SET
      fpl_entry_id  = EXCLUDED.fpl_entry_id,
      team_name     = EXCLUDED.team_name,
      placement     = COALESCE(EXCLUDED.placement, season_stats.placement),
      league_points = COALESCE(EXCLUDED.league_points, season_stats.league_points),
      total_score   = EXCLUDED.total_score,
      overall_rank  = EXCLUDED.overall_rank,
      updated_at    = now();
    """
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        try:
            conn.prepare_threshold = None
        except Exception:
            pass
        with conn.cursor() as cur:
            try:
                cur.prepare_threshold = None
            except Exception:
                pass
            try:
                cur.execute("DEALLOCATE ALL;")
            except Exception:
                pass
            cur.executemany(sql, rows)
        conn.commit()
    return len(rows)

def backfill():
    ms = fetch_managers()
    out = []
    for i, m in enumerate(ms, start=1):
        owner = m["owner_name"]
        eid = _entry_from_url(m.get("fpl_team_url"))
        if not eid:
            # create blank shells for seasons so UI still shows rows to be filled
            for s in SEASONS:
                out.append({"owner_name": owner, "season": s, "fpl_entry_id": None,
                            "team_name": m.get("team_name"), "placement": None, "league_points": None,
                            "total_score": None, "overall_rank": None})
            continue

        # Past seasons
        try:
            r = requests.get(f"{FPL}/entry/{eid}/history/", timeout=12)
            r.raise_for_status()
            hist = r.json() or {}
            past = hist.get("past") or []
        except Exception:
            past = []

        by_season = {}
        for p in past:
            slug = _season_slug_from_fpl(p.get("season_name", ""))
            if slug in SEASONS:
                by_season[slug] = {
                    "total_score": p.get("total_points"),
                    "overall_rank": p.get("rank") or p.get("overall_rank"),
                }

        # Current season snapshot (team name + current totals if available)
        cur_team, cur_pts, cur_rank = None, None, None
        try:
            r2 = requests.get(f"{FPL}/entry/{eid}/", timeout=12)
            r2.raise_for_status()
            j = r2.json() or {}
            cur_team = j.get("name")
            cur_pts  = j.get("summary_overall_points")
            cur_rank = j.get("summary_overall_rank")
        except Exception:
            pass

        # build rows for all seasons; keep your league fields empty (manual or separately imported)
        for s in SEASONS:
            src = by_season.get(s, {})
            total = src.get("total_score")
            rank  = src.get("overall_rank")
            # if season is current and past didn’t have it yet, use current snapshot
            if s == SEASONS[-1]:
                total = total if total is not None else cur_pts
                rank  = rank if rank  is not None else cur_rank
            out.append({
                "owner_name": owner,
                "season": s,
                "fpl_entry_id": eid,
                "team_name": cur_team or m.get("team_name"),
                "placement": None,        # fill manually / later
                "league_points": None,    # fill manually / later (or from your JSON)
                "total_score": total,
                "overall_rank": rank,
            })

        # be polite to FPL API
        time.sleep(0.2)

    n = upsert(out)
    print(f"upserted/updated {n} rows")
    return n

if __name__ == "__main__":
    backfill()
