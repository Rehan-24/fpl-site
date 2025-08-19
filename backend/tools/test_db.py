import os, psycopg

def norm(u: str) -> str:
  u = (u or "").strip().strip('"').strip("'")
  if u and "sslmode=" not in u: u += ("&" if "?" in u else "?") + "sslmode=require"
  return u

urls = []
env = norm(os.getenv("SUPABASE_DB_URL"))
if env: urls.append(("ENV", env))

# Optional: drop in your direct/pooled explicitly to try both quickly:
urls.append(("POOLED", "postgres://postgres:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require"))
urls.append(("DIRECT", "postgres://postgres:<PASSWORD>@db.<REF>.supabase.co:5432/postgres?sslmode=require"))

for label, url in urls:
  print(f"Testing {label}: {url}")
  try:
    with psycopg.connect(url, connect_timeout=15) as conn:
      with conn.cursor() as cur:
        cur.execute("select current_database(), current_user, version()")
        print(" -> OK:", cur.fetchone()[0:2])
  except Exception as e:
    print(" -> FAIL:", repr(e))
