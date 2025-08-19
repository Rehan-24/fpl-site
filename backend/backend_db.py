# backend/backend_db.py
import os
from typing import Optional
from psycopg import connect
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL")

ALLOWED_MANAGER_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

def _conn():
    if not DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    return connect(DB_URL, row_factory=dict_row)

# ---------- Managers (reads) ----------

def fetch_all_managers():
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
    
def fetch_manager_by_discord(discord_id: str) -> Optional[dict]:
    if not DB_URL: return None
    q = "select * from public.manager where discord_id = %s limit 1"
    with connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(q, (discord_id.strip(),))
        return cur.fetchone()

def fetch_manager_by_owner(owner_name: str) -> Optional[dict]:
    if not DB_URL: return None
    q = "select * from public.manager where lower(owner_name) = lower(%s) limit 1"
    with connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(q, (owner_name.strip(),))
        return cur.fetchone()

def fetch_manager_by_any(identifier: str) -> Optional[dict]:
    """Try discord_id exact match first; if not found, try owner_name (case-insensitive)."""
    identifier = (identifier or "").strip()
    return fetch_manager_by_discord(identifier) or fetch_manager_by_owner(identifier)

def update_manager_fields(*, owner_name: str = None, discord_id: str = None, **fields) -> Optional[dict]:
    """
    Update allowed manager fields by either owner_name or discord_id.
    Returns the updated row (dict) or None if no row matched.
    """
    if not DB_URL: return None
    sets, vals = [], []
    for k, v in fields.items():
        if k in ALLOWED_MANAGER_FIELDS:
            sets.append(f"{k} = %s")
            vals.append(v)
    if not sets:
        return None

    where = None
    if discord_id:
        where = "discord_id = %s"
        vals.append(discord_id.strip())
    elif owner_name:
        where = "lower(owner_name) = lower(%s)"
        vals.append(owner_name.strip())
    else:
        return None

    sql = f"""
      update public.manager
         set {", ".join(sets)}, updated_at = now()
       where {where}
    returning *;
    """
    with connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, vals)
        row = cur.fetchone()
        conn.commit()
        return row

def update_manager_by_any(identifier: str, **fields) -> Optional[dict]:
    """Try to update by discord_id first; if that matches nothing, try owner_name."""
    identifier = (identifier or "").strip()
    row = update_manager_fields(discord_id=identifier, **fields)
    if row:
        return row
    return update_manager_fields(owner_name=identifier, **fields)

# ---------- Managers (updates) ----------

_ALLOW_EDIT = {
    "bio",
    "favorite_club",
    "social_url",
    "image_url",
    "dynamic_image_url",
}

def update_manager_fields_by_owner(owner: str, updates: dict) -> bool:
    fields = [k for k in updates.keys() if k in _ALLOW_EDIT]
    if not fields:
        return False
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

def update_manager_fields_by_discord(discord_id: str, updates: dict) -> bool:
    fields = [k for k in updates.keys() if k in _ALLOW_EDIT]
    if not fields:
        return False
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    params = [updates[k] for k in fields] + [discord_id]
    sql = (
        f"update public.manager "
        f"set {set_clause}, updated_at = now() "
        f"where discord_id = %s"
    )
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount > 0

# ---------- Standings helpers (season stats) ----------

def latest_standing_for_owner(owner: str):
    """
    Return the most recent standings row for this owner (any league),
    plus the league size for that gameweek.
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
            select league, gameweek, position, points, score
            from public.standings_row
            where lower(owner) = lower(%s)
            order by gameweek desc
            limit 1
        """, (owner,))
        row = cur.fetchone()
        if not row:
            return None
        cur.execute("""
            select count(*) as league_size
            from public.standings_row
            where league = %s and gameweek = %s
        """, (row["league"], row["gameweek"]))
        sz = cur.fetchone()
        row["league_size"] = (sz or {}).get("league_size", None)
        return row

# ---------- News ----------

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

def list_news_tags():
    sql = """
    select distinct unnest(tags) as tag
    from public.news_article
    where published = true
    order by tag;
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()
        return [r["tag"] for r in rows if r and r.get("tag") is not None]
