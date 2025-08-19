# backend/backend_db.py
import os
import psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL")

def _conn():
    if not DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    return psycopg.connect(DB_URL, row_factory=dict_row)

# ---- Managers: reads ----

def fetch_all_managers():
    """
    Returns all active managers. Extend SELECT as needed.
    """
    sql = """
    select
      m.id, m.display_name, m.owner_name, m.fpl_team_url,
      m.favorite_club, m.image_url, m.dynamic_image_url,
      m.social_url, m.bio, m.current_league,
      m.years_playing, m.premier_years, m.championship_years,
      m.promotions, m.relegations, m.best_finish,
      m.titles, m.titles_list, m.active,
      coalesce(
        json_agg(json_build_object('type', t.type, 'count', t.count))
          filter (where t.id is not null),
        '[]'::json
      ) as trophies
    from public.manager m
    left join public.manager_trophy t on t.manager_id = m.id
    where m.active = true
    group by m.id
    order by lower(m.display_name);
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def fetch_manager_by_owner(owner: str):
    """
    Looks up a manager by owner_name (case-insensitive).
    """
    sql = """
    select
      m.id, m.display_name, m.owner_name, m.fpl_team_url,
      m.favorite_club, m.image_url, m.dynamic_image_url,
      m.social_url, m.bio, m.current_league,
      m.years_playing, m.premier_years, m.championship_years,
      m.promotions, m.relegations, m.best_finish,
      m.titles, m.titles_list, m.active,
      coalesce(
        json_agg(json_build_object('type', t.type, 'count', t.count))
          filter (where t.id is not null),
        '[]'::json
      ) as trophies
    from public.manager m
    left join public.manager_trophy t on t.manager_id = m.id
    where lower(m.owner_name) = lower(%s)
    group by m.id;
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (owner,))
        return cur.fetchone()

# ---- Managers: update ----

def update_manager_fields(owner: str, updates: dict) -> bool:
    """
    Updates a manager row by owner_name for a small, safe allowlist of fields.
    Returns True if something was updated, False otherwise.
    """
    if not updates:
        return False

    # Allow only these columns to be edited (Discord bot / admin UI)
    allow = {
        "bio",
        "favorite_club",
        "social_url",
        "image_url",
        "dynamic_image_url",
        # add more if you need them later:
        # "display_name", "fpl_team_url", "current_league",
        # "years_playing", "premier_years", "championship_years",
        # "titles", "titles_list",
    }

    fields = [k for k in updates.keys() if k in allow]
    if not fields:
        return False

    # Build "col1 = %s, col2 = %s, ..." safely using the allowlist
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    params = [updates[k] for k in fields] + [owner]

    sql = (
        f"update public.manager "
        f"set {set_clause}, updated_at = now() "
        f"where lower(owner_name) = lower(%s)"
    )

    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0

# ---- News: reads ----

def list_news():
    sql = """
    select id, title, date, image_url, excerpt, tags
    from public.news_article
    where published = true
    order by date desc, updated_at desc;
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()

def get_news_detail(article_id: str):
    sql = """
    select id, title, date, image_url, excerpt, content_html, tags, published
    from public.news_article
    where id = %s and published = true;
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (article_id,))
        return cur.fetchone()
