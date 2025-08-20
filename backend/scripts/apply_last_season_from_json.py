import os, json, argparse, psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL") or "postgres://postgres.fmkbxhtmjlgeoiouphuy:2iL20hiLUtaxjRi9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"

def upsert_from_json(conn, league: str, season: str, path: str):
    with open(path, "r", encoding="utf-8") as f:
        arr = json.load(f)

    sql = """
    insert into public.manager_season_stats
      (owner_name, season, league, placement, league_points, total_score)
    values
      (%(owner_name)s, %(season)s, %(league)s, %(placement)s, %(league_points)s, %(total_score)s)
    on conflict (owner_name, season) do update set
      league        = excluded.league,
      placement     = excluded.placement,
      league_points = excluded.league_points,
      total_score   = coalesce(excluded.total_score, manager_season_stats.total_score),
      updated_at    = now()
    """

    n = 0
    with conn.cursor() as cur:
        for rec in arr:
            owner = (rec.get("Owner") or "").strip()
            if not owner:
                continue
            row = {
                "owner_name": owner,
                "season": season,            # e.g. '2024-25'
                "league": league,            # e.g. 'premier' or 'championship'
                "placement": rec.get("Position"),
                "league_points": rec.get("Points"),
                "total_score": rec.get("Score"),   # will match FPL 'total_points' typically
            }
            cur.execute(sql, row)
            n += 1
    return n

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--league", required=True, choices=["premier","championship"])
    ap.add_argument("--season", required=True, help="e.g. 2024-25")
    args = ap.parse_args()

    if not DB_URL:
        raise SystemExit("SUPABASE_DB_URL not set")

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        n = upsert_from_json(conn, args.league, args.season, args.file)
        conn.commit()
        print(f"Applied {n} rows into manager_season_stats for {args.league} {args.season}")

if __name__ == "__main__":
    main()
