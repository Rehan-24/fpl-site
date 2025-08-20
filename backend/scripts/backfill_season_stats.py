import os, re, argparse, requests
import psycopg
from psycopg.rows import dict_row
from typing import Optional, Dict, Any

# Prefer env var; fall back to your hardcoded string if present
DB_URL = os.getenv("SUPABASE_DB_URL") or "postgres://postgres.fmkbxhtmjlgeoiouphuy:2iL20hiLUtaxjRi9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
ENTRY_RE = re.compile(r"/entry/(\d+)/")

SEASONS = ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26"]
HTTP_HEADERS = {"User-Agent": "tfpl-backfill/1.0"}

def _parse_entry_id(url: Optional[str]) -> Optional[int]:
    if not url:
        return None
    m = ENTRY_RE.search(url)
    return int(m.group(1)) if m else None

def fpl_label(s: str) -> str:
    """'2024-25' -> '2024/25'"""
    a = int(s.split("-")[0])
    return f"{a}/{(a+1)%100:02d}"

def fetch_all_managers(conn):
    sql = """
      select owner_name, team, fpl_team_url
      from public.manager
      where active = true
      order by lower(owner_name)
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def upsert_rows(rows):
    if not rows:
        return 0

    sql = """
    INSERT INTO public.manager_season_stats
      (owner_name, season, league, placement, league_points, total_score, updated_at)
    VALUES
      (%(owner_name)s, %(season)s, %(league)s, %(placement)s, %(league_points)s, %(total_score)s, now())
    ON CONFLICT (owner_name, season) DO UPDATE SET
      league        = COALESCE(EXCLUDED.league, manager_season_stats.league),
      placement     = COALESCE(EXCLUDED.placement, manager_season_stats.placement),
      league_points = COALESCE(EXCLUDED.league_points, manager_season_stats.league_points),
      total_score   = COALESCE(EXCLUDED.total_score, manager_season_stats.total_score),
      updated_at    = now();
    """

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        # IMPORTANT: pgbouncer (transaction pooling) + server prepares = 💥
        try:
            conn.prepare_threshold = None
        except Exception:
            pass

        with conn.cursor() as cur:
            try:
                cur.prepare_threshold = None
            except Exception:
                pass
            # optional no-op; harmless if unsupported
            try:
                cur.execute("DEALLOCATE ALL;")
            except Exception:
                pass

            cur.executemany(sql, rows)

        conn.commit()
    return len(rows)


def pull_fpl_history(entry_id: int) -> Dict[str, Any]:
    r = requests.get(
        f"https://fantasy.premierleague.com/api/entry/{entry_id}/history/",
        timeout=20,
        headers=HTTP_HEADERS,
    )
    r.raise_for_status()
    return r.json() or {}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seasons", default=",".join(SEASONS),
                    help="Comma-separated list like 2021-22,2022-23,...")
    args = ap.parse_args()
    seasons = [s.strip() for s in args.seasons.split(",") if s.strip()]

    if not DB_URL:
        raise SystemExit("SUPABASE_DB_URL not set")

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        mgrs = fetch_all_managers(conn)

        for m in mgrs:
            owner = (m["owner_name"] or "").strip()
            eid = _parse_entry_id(m.get("fpl_team_url"))
            past_map: Dict[str, Dict[str, Any]] = {}

            if eid:
                try:
                    hist = pull_fpl_history(eid)
                    for p in (hist.get("past") or []):
                        # keys: 'season_name' like '2023/24', plus 'total_points', 'rank'
                        past_map[p.get("season_name")] = {
                            "total_points": p.get("total_points"),
                            "rank": p.get("rank"),
                        }
                except Exception:
                    # network/API hiccup; just leave totals/ranks as None
                    pass

            for s in seasons:
                row: Dict[str, Any] = {
                    "owner_name": owner,
                    "season": s,
                    "league": None,
                    "placement": None,
                    "league_points": None,
                    "total_score": None,
                    "overall_rank": None,
                    "fpl_entry_id": eid,
                }

                label = fpl_label(s)  # e.g. '2024/25'
                if label in past_map:
                    row["total_score"]  = past_map[label].get("total_points")
                    row["overall_rank"] = past_map[label].get("rank")

                upsert_row(conn, row)

        conn.commit()
        print(f"Backfill complete for seasons: {', '.join(seasons)}")

if __name__ == "__main__":
    main()
