# backend/scripts/load_last_season_finish.py
import os, json, argparse
import psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL") or "postgres://postgres.fmkbxhtmjlgeoiouphuy:2iL20hiLUtaxjRi9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"

def upsert_last_season_finish(rows: list[dict]) -> int:
    if not rows:
        return 0

    sql = """
    INSERT INTO public.last_season_finish
      (season, league, owner_name, position, fdr_seed, league_points, updated_at)
    VALUES
      (%(season)s, %(league)s, %(owner_name)s, %(position)s, %(fdr_seed)s, %(league_points)s, now())
    ON CONFLICT (season, league, owner_name) DO UPDATE SET
      position   = EXCLUDED.position,
      fdr_seed   = EXCLUDED.fdr_seed,
      updated_at = now();
    """

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        # ← critical for PgBouncer transaction pooling
        try: conn.prepare_threshold = None
        except Exception: pass

        with conn.cursor() as cur:
            try: cur.prepare_threshold = None
            except Exception: pass
            # be extra safe if a previous session left prepared stmts around
            try: cur.execute("DEALLOCATE ALL;")
            except Exception: pass

            cur.executemany(sql, rows)
        conn.commit()
    return len(rows)

def seed_from_position(pos: int) -> int:
    if   pos <= 6:   return 5
    elif pos <= 9:   return 4
    elif pos <= 14:  return 3
    elif pos <= 16:  return 2
    else:            return 1

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, help="path to data/premier_gw38.json")
    ap.add_argument("--league", required=True, choices=["premier","championship"])
    ap.add_argument("--season", required=True, help="e.g. 2024-25")
    args = ap.parse_args()

    with open(args.file, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    for rec in data:
        try:
            pos = int(rec.get("Position"))
        except Exception:
            continue
        owner = (rec.get("Owner") or "").strip()
        if not owner or not pos:
            continue
        rows.append({
            "season": args.season,
            "league": args.league,
            "owner_name": owner,
            "position": pos,
            "league_points": rec.get("Points"),
            "fdr_seed": seed_from_position(pos),
        })

    n = upsert_last_season_finish(rows)
    print(f"upserted {n} rows into last_season_finish for {args.league} {args.season}")

if __name__ == "__main__":
    main()
