import os

# put your connection string here (or set it in your shell instead)
os.environ.setdefault(
    "SUPABASE_DB_URL",
    "postgres://postgres.fmkbxhtmjlgeoiouphuy:2iL20hiLUtaxjRi9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
)

from backend_db import rebuild_manager_matchups

if __name__ == "__main__":
    n = rebuild_manager_matchups()
    print(f"matchup tracker rebuilt: {n} pairs")
