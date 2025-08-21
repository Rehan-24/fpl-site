import json, os, sys
from psycopg import connect

DB_URL = os.getenv("SUPABASE_DB_URL") or "postgres://postgres.fmkbxhtmjlgeoiouphuy:2iL20hiLUtaxjRi9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
if not DB_URL:
    raise SystemExit("SUPABASE_DB_URL not set")

path = sys.argv[1] if len(sys.argv) > 1 else "managers.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

def to_int_or_none(x):
    if x is None: return None
    s = str(x).strip()
    if not s: return None
    try: return int(s)
    except: return None

# Update by either owner_name or team match (case-insensitive)
SQL = """
UPDATE public.manager
SET placements = %s
WHERE lower(owner_name) = lower(%s)
   OR lower(COALESCE(team)) = lower(%s);
"""

updated = 0
with connect(DB_URL) as conn, conn.cursor() as cur:
    for row in data:
        p = to_int_or_none(row.get("placements"))
        if p is None:
            continue
        owner = (row.get("name") or row.get("owner") or row.get("owner_name") or "").strip()
        team  = (row.get("team") or row.get("team_name") or "").strip()
        if not owner and not team:
            continue
        cur.execute(SQL, (p, owner, team))
        updated += cur.rowcount
    conn.commit()

print(f"placements updated rows: {updated}")
