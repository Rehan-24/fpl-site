import os, psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL")

def get_conn():
    if not DB_URL:
        raise RuntimeError("SUPABASE_DB_URL not configured")
    return psycopg.connect(DB_URL, row_factory=dict_row)

def fetch_manager_by_owner(owner_name: str):
    sql = """
      select m.*, 
             coalesce(json_agg(json_build_object('type', t.type, 'count', t.count) order by t.type)
                     filter (where t.id is not null), '[]') as trophies
        from public.manager m
        left join public.manager_trophy t on t.manager_id = m.id
       where lower(m.owner_name) = lower(%s)
       group by m.id
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (owner_name,))
        return cur.fetchone()

def fetch_all_managers():
    sql = """
      select m.*, 
             coalesce(json_agg(json_build_object('type', t.type, 'count', t.count) order by t.type)
                     filter (where t.id is not null), '[]') as trophies
        from public.manager m
        left join public.manager_trophy t on t.manager_id = m.id
       where m.active = true
       group by m.id
       order by m.current_league nulls last, lower(m.owner_name)
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def update_manager_fields(owner_name: str, updates: dict):
    # allowlist
    allowed = {'bio','favorite_club','social_url','image_url'}
    to_set = {k:v for k,v in updates.items() if k in allowed}
    if not to_set:
        return False
    sets = ", ".join(f"{k} = %s" for k in to_set)
    params = list(to_set.values()) + [owner_name]
    sql = f\"update public.manager set {sets}, updated_at = now() where lower(owner_name) = lower(%s)\"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0

def list_news():
    sql = \"select id, title, date, image_url, excerpt, tags from public.news_article where published = true order by date desc\"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def get_news_detail(id: str):
    sql = \"select id, title, date, image_url, excerpt, tags, content_html from public.news_article where id = %s and published = true\"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (id,))
        return cur.fetchone()
