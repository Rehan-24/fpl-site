# backend/backend_db.py
import os
import psycopg
import requests
from typing import Tuple
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from psycopg.rows import dict_row
from psycopg.types.json import Json




DB_URL = os.getenv("SUPABASE_DB_URL") or "postgres://postgres.fmkbxhtmjlgeoiouphuy:2iL20hiLUtaxjRi9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"

ALLOWED_MANAGER_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

def _conn():
    if not DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    return psycopg.connect(DB_URL, row_factory=dict_row)

# ---------- Managers (reads) ----------

def fetch_all_managers():
    sql = """
    select
      m.id, m.discord_id, m.team, m.owner_name,
      m.placements, m.fpl_team_url,
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
    order by lower(m.team);
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()
    
def fetch_manager_by_discord(discord_id: str) -> Optional[dict]:
    if not DB_URL: return None
    q = "select * from public.manager where discord_id = %s limit 1"
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(q, (discord_id.strip(),))
        return cur.fetchone()

def fetch_manager_by_owner(owner_name: str) -> Optional[dict]:
    if not DB_URL: return None
    q = "select * from public.manager where lower(owner_name) = lower(%s) limit 1"
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
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
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
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
    
# ---------- Table Snapshots ----------
def insert_table_snapshot(league: str, gw: Optional[int], payload: dict,
                          source: str = "backend", schema_version: int = 1) -> None:

    league = (league or "").strip().lower()
    sql = """
    INSERT INTO public.league_table_snapshots
      (league, gw, generated_at, source, schema_version, payload)
    VALUES (%s, %s, now(), %s, %s, %s)
    ON CONFLICT DO NOTHING
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (league, gw, source, schema_version, Json(payload)))


def get_latest_table_snapshot(league: str, gw: Optional[int] = None):
    league = (league or "").strip().lower()
    if gw is None:
        sql = """
        SELECT league, gw, generated_at, source, schema_version, payload
        FROM public.league_table_snapshots
        WHERE lower(league) = lower(%s)
        ORDER BY generated_at DESC
        LIMIT 1
        """
        params = (league,)
    else:
        sql = """
        SELECT league, gw, generated_at, source, schema_version, payload
        FROM public.league_table_snapshots
        WHERE lower(league) = lower(%s) AND gw = %s
        ORDER BY generated_at DESC
        LIMIT 1
        """
        params = (league, gw)

    with _conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        row = cur.fetchone()
        return row  # already a dict or None
    
# ---------- UPSERT FIXTURES ----------
def upsert_fixtures(fixtures_rows: list[dict]) -> int:
    if not fixtures_rows:
        return 0

    sql = """
    INSERT INTO public.fixtures_h2h (
      season, league_id, gw, fixture_id, kickoff_utc, finished,
      home_entry_id, home_team_name, home_owner, home_score,
      away_entry_id, away_team_name, away_owner, away_score,
      home_fdr, away_fdr, updated_at
    ) VALUES (
      %(season)s, %(league_id)s, %(gw)s, %(fixture_id)s, %(kickoff_utc)s, %(finished)s,
      %(home_entry_id)s, %(home_team_name)s, %(home_owner)s, %(home_score)s,
      %(away_entry_id)s, %(away_team_name)s, %(away_owner)s, %(away_score)s,
      %(home_fdr)s, %(away_fdr)s, now()
    )
    ON CONFLICT (season, league_id, gw, fixture_id) DO UPDATE SET
      kickoff_utc = EXCLUDED.kickoff_utc,
      finished = EXCLUDED.finished,
      home_team_name = EXCLUDED.home_team_name,
      home_owner = EXCLUDED.home_owner,
      home_score = EXCLUDED.home_score,
      away_team_name = EXCLUDED.away_team_name,
      away_owner = EXCLUDED.away_owner,
      away_score = EXCLUDED.away_score,
      home_fdr = COALESCE(EXCLUDED.home_fdr, public.fixtures_h2h.home_fdr),
      away_fdr = COALESCE(EXCLUDED.away_fdr, public.fixtures_h2h.away_fdr),
      updated_at = now();
    """

    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        # Disable server-side prepare at the connection level
        try:
            conn.prepare_threshold = None
        except Exception:
            pass

        with conn.cursor() as cur:
            # Also disable at the cursor level (older psycopg versions tolerate this)
            try:
                cur.prepare_threshold = None
            except Exception:
                pass

            # Hard reset any lingering prepared statements from a previous run
            try:
                cur.execute("DEALLOCATE ALL;")
            except Exception:
                pass

            BATCH = 1000
            for i in range(0, len(fixtures_rows), BATCH):
                cur.executemany(sql, fixtures_rows[i:i+BATCH])

        conn.commit()
    return len(fixtures_rows)



# ---------- READ MANAGER FIXTURES ----------
def get_manager_fixtures(owner: str, season: str, include_past: bool, limit_next: Optional[int]) -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    owner_norm = (owner or "").strip().lower()

    # Base owner filter (case-insensitive)
    where = """
      WHERE season = %s
        AND (lower(home_owner) = %s OR lower(away_owner) = %s)
    """
    args = [season, owner_norm, owner_norm]

    if include_past:
        # All fixtures for this owner in the season
        order = " ORDER BY gw ASC, (kickoff_utc IS NULL), kickoff_utc ASC "
        limit_clause = ""
    else:
        # Only the next 3 GWs after the current one
        next_gw = detect_next_gw(season)
        if next_gw is not None:
            where += " AND gw BETWEEN %s AND %s "
            args.extend([next_gw, next_gw + 2])
            # Order by GW only (time can be null early season)
            order = " ORDER BY gw ASC, (kickoff_utc IS NULL), kickoff_utc ASC "
            limit_clause = ""  # window already constrained to 3 GWs
        else:
            # If we can't detect, fall back to time-based "upcoming"
            where += " AND (kickoff_utc IS NULL OR kickoff_utc >= %s) "
            args.append(now)
            order = " ORDER BY (kickoff_utc IS NULL), kickoff_utc ASC, gw ASC "
            limit_clause = " LIMIT %s " if limit_next else ""
            if limit_next:
                args.append(limit_next)

    sql = f"""
      SELECT
        season, league_id, gw, fixture_id, kickoff_utc, finished,
        home_owner, away_owner,
        home_team_name, away_team_name,
        home_score, away_score,
        home_fdr, away_fdr
      FROM public.fixtures_h2h
      {where}
      {order}
      {limit_clause}
    """

    with psycopg.connect(os.environ["SUPABASE_DB_URL"], row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, args)
        rows = cur.fetchall()

    shaped = []
    for r in rows:
        is_home = (str(r["home_owner"] or "").strip().lower() == owner_norm)
        opponent_owner = r["away_owner"] if is_home else r["home_owner"]
        opponent_team  = r["away_team_name"] if is_home else r["home_team_name"]
        score_for      = r["home_score"] if is_home else r["away_score"]
        score_against  = r["away_score"] if is_home else r["home_score"]
        fdr = (r["home_fdr"] if is_home else r["away_fdr"])  # difficulty for THIS owner vs opponent

        shaped.append({
            "gw": r["gw"],
            "kickoff_utc": r["kickoff_utc"],
            "finished": r["finished"],
            "is_home": is_home,
            "opponent_owner": opponent_owner,
            "opponentTeam": opponent_team,
            "score_for": score_for,
            "score_against": score_against,
            "fdr": fdr,
        })


    return shaped


# ---------- RECENT FORM / POINTS HELPERS (for FDR) ----------
def _fetch_recent_completed(owner: str, season: str, limit_matches: int) -> List[Dict[str, Any]]:
    owner_norm = (owner or "").strip().lower()
    sql = """
      SELECT gw, finished,
             home_owner, away_owner,
             home_score, away_score
      FROM public.fixtures_h2h
      WHERE season = %s
        AND finished = TRUE
        AND (lower(home_owner) = %s OR lower(away_owner) = %s)
      ORDER BY gw DESC
      LIMIT %s
    """
    with psycopg.connect(os.environ["SUPABASE_DB_URL"], row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, [season, owner_norm, owner_norm, limit_matches])
        return cur.fetchall()


def recent_form_score(owner: str, season: str, limit_matches: int = 9) -> Dict[str, float]:
    rows = _fetch_recent_completed(owner, season, limit_matches)
    if not rows:
        return {"avg_points_for": 0.0, "wl_score": 0.5, "composite": 0.5}
    owner_norm = (owner or "").strip().lower()
    pts, wl = [], []
    for r in rows:
        is_home = (str(r["home_owner"] or "").strip().lower() == owner_norm)
        for_ = r["home_score"] if is_home else r["away_score"]
        ag_  = r["away_score"] if is_home else r["home_score"]
        pts.append(float(for_ or 0))
        if for_ is None or ag_ is None:
            continue
        wl.append(1.0 if for_ > ag_ else 0.5 if for_ == ag_ else 0.0)
    avg_points_for = (sum(pts) / len(pts)) if pts else 0.0
    wl_score = (sum(wl) / len(wl)) if wl else 0.5
    composite = 0.6 * min(avg_points_for / 60.0, 1.0) + 0.4 * wl_score
    return {"avg_points_for": avg_points_for, "wl_score": wl_score, "composite": composite}


def fdr_from_composite(opponent_composite: float) -> int:
    """
    Map opponent strength (higher = stronger opponent) to difficulty 1..5.
    Tuned buckets; feel free to tweak.
    """
    s = opponent_composite  # 0 (cold) → 1 (hot)
    if s >= 0.95: return 5
    if s >= 0.70: return 4
    if s >= 0.68: return 3
    if s >= 0.65: return 2
    return 1

def detect_next_gw(season: str) -> Optional[int]:
    """
    Prefer FPL's bootstrap-static to decide the 'next' GW.
    Fallback to DB-based heuristic if the API is unavailable.
    """
    try:
        r = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/", timeout=10)
        r.raise_for_status()
        events = r.json().get("events", [])
        # Primary: explicit next GW
        for e in events:
            if e.get("is_next"):
                return int(e["id"])
        # Secondary: if nothing flagged as next, use current GW (still ongoing)
        for e in events:
            if e.get("is_current"):
                return int(e["id"])
        # Tertiary: highest event whose deadline has not passed is a rough 'next'
        # (Usually covered by is_next/is_current, so rarely used)
        ids = [int(e["id"]) for e in events if "id" in e]
        return min(ids) if ids else None
    except Exception:
        pass

    # Fallback: DB heuristic (first unfinished GW or last+1)
    with psycopg.connect(os.environ["SUPABASE_DB_URL"], row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT MIN(gw) AS next_gw
            FROM public.fixtures_h2h
            WHERE season = %s AND (finished IS NOT TRUE)
        """, [season])
        row = cur.fetchone()
        if row and row.get("next_gw") is not None:
            return int(row["next_gw"])

        cur.execute("SELECT MAX(gw) AS max_gw FROM public.fixtures_h2h WHERE season = %s", [season])
        r2 = cur.fetchone()
        mx = (r2 or {}).get("max_gw")
        return (int(mx) + 1) if mx is not None else None

# --- Last-season finish reads ---
def list_manager_seasons(owner: str):
    sql = """
      select season, league, placement, league_points, total_score, overall_rank
      from public.manager_season_stats
      where lower(owner_name) = lower(%s)
      order by season asc
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (owner,))
        return cur.fetchall()


# --- Season stats helpers ---
def upsert_season_stats(rows: list[dict]) -> int:
    if not rows:
        return 0
    sql = """
    INSERT INTO public.season_stats
      (owner_name, season, fpl_entry_id, team_name, placement, league_points, total_score, overall_rank, updated_at)
    VALUES
      (%(owner_name)s, %(season)s, %(fpl_entry_id)s, %(team_name)s, %(placement)s, %(league_points)s, %(total_score)s, %(overall_rank)s, now())
    ON CONFLICT (owner_name, season) DO UPDATE SET
      fpl_entry_id  = EXCLUDED.fpl_entry_id,
      team_name     = EXCLUDED.team_name,
      placement     = EXCLUDED.placement,
      league_points = EXCLUDED.league_points,
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
            BATCH = 1000
            for i in range(0, len(rows), BATCH):
                cur.executemany(sql, rows[i:i+BATCH])
        conn.commit()
    return len(rows)

def get_overall_ranks_for_season(season: str, owner_names: list[str]) -> list[dict]:
    """Return [{owner_name, overall_rank}] for the given season, filtered to owners with a rank."""
    if not owner_names:
        return []
    lower_names = [n.lower() for n in owner_names]
    q = """
    SELECT owner_name, overall_rank
    FROM public.season_stats
    WHERE season = %s AND lower(owner_name) = ANY(%s)
      AND overall_rank IS NOT NULL
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(q, (season, lower_names))
        return cur.fetchall()


def get_season_stats_for_owner(owner_name: str) -> list[dict]:
    q = """
    SELECT owner_name, season, fpl_entry_id, team_name,
           placement, league_points, total_score, overall_rank
    FROM public.season_stats
    WHERE lower(owner_name) = lower(%s)
    ORDER BY season ASC
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(q, (owner_name,))
        return cur.fetchall()


def get_last_finish_for(owner: str, season: str, league: str | None = None) -> dict | None:
    """
    Look up last season's finish for this owner.
    Prefer the same league if provided; else any league row.
    Accept both '2024-25' and '2024/25' season formats.
    Trim/case-fold owner names.
    Fallback to manager_season_stats if last_season_finish has no row.
    """
    # Accept 'YYYY-YY' and 'YYYY/YY'
    def _season_variants(s: str) -> list[str]:
        s = (s or "").strip()
        return [s, s.replace("-", "/"), s.replace("/", "-")]

    owner_in = (owner or "").strip()

    with _conn() as conn, conn.cursor() as cur:
        # 1) Try last_season_finish with league first (if provided), then without
        seasons = _season_variants(season)

        if league:
            cur.execute("""
                SELECT season, league, owner_name, team_name, position, points, fdr_seed
                FROM public.last_season_finish
                WHERE season = ANY(%s)
                  AND lower(btrim(owner_name)) = lower(btrim(%s))
                  AND lower(btrim(league)) = lower(btrim(%s))
                LIMIT 1
            """, (seasons, owner_in, league))
            row = cur.fetchone()
            if row and row.get("position") is not None:
                return row

        cur.execute("""
            SELECT season, league, owner_name, team_name, position, points, fdr_seed
            FROM public.last_season_finish
            WHERE season = ANY(%s)
              AND lower(btrim(owner_name)) = lower(btrim(%s))
            LIMIT 1
        """, (seasons, owner_in))
        row = cur.fetchone()
        if row and row.get("position") is not None:
            return row

        # 2) Fallback to manager_season_stats (placement/league_points)
        if league:
            cur.execute("""
                SELECT season,
                       league,
                       owner_name,
                       NULL::text AS team_name,
                       placement    AS position,
                       league_points AS points
                FROM public.manager_season_stats
                WHERE season = ANY(%s)
                  AND lower(btrim(owner_name)) = lower(btrim(%s))
                  AND (lower(btrim(league)) = lower(btrim(%s)) OR league IS NULL)
                LIMIT 1
            """, (seasons, owner_in, league))
        else:
            cur.execute("""
                SELECT season,
                       league,
                       owner_name,
                       NULL::text AS team_name,
                       placement    AS position,
                       league_points AS points
                FROM public.manager_season_stats
                WHERE season = ANY(%s)
                  AND lower(btrim(owner_name)) = lower(btrim(%s))
                LIMIT 1
            """, (seasons, owner_in))
        return cur.fetchone()




def fallback_fdr_from_finish(position: int) -> int:
    """
    Buckets (assumed):
      1-6   -> 5
      7-9   -> 4
      10-14 -> 3
      15-16 -> 2
      17-20 -> 1
    """
    if position <= 6:  return 5
    if position <= 9:  return 4
    if position <= 14: return 3
    if position <= 16: return 2
    return 1


# ---------- MATCHUP TRACKER (all-time, from finished fixtures) ----------

def rebuild_manager_matchups() -> int:
    """
    Recompute the aggregated matchup table from fixtures_h2h (league play)
    and facup_bracket (FA Cup knockout matches). Counts only finished
    matches with non-null scores. Works across all seasons.
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
          with league_completed as (
            select season, gw, home_owner, away_owner, home_score, away_score
            from public.fixtures_h2h
            where finished = true
              and home_score is not null
              and away_score is not null
          ),
          manager_entry_map as (
            select owner_name,
                   coalesce(entry_id, (substring(fpl_team_url from '/entry/(\\d+)/'))::int) as eid
            from public.manager
          ),
          facup_completed as (
            select b.season, b.gw,
                   m1.owner_name as home_owner, m2.owner_name as away_owner,
                   b.score1 as home_score, b.score2 as away_score
            from public.facup_bracket b
            join manager_entry_map m1 on m1.eid = b.entry_id1
            join manager_entry_map m2 on m2.eid = b.entry_id2
            where b.entry_id1 is not null and b.entry_id2 is not null
              and b.score1 is not null and b.score2 is not null
          ),
          completed as (
            select * from league_completed
            union all
            select * from facup_completed
          ),
          norm as (
            select
              case when lower(home_owner) <= lower(away_owner) then home_owner else away_owner end as owner_a,
              case when lower(home_owner) <= lower(away_owner) then away_owner else home_owner end as owner_b,
              case when lower(home_owner) <= lower(away_owner) then home_score else away_score end as score_a,
              case when lower(home_owner) <= lower(away_owner) then away_score else home_score end as score_b
            from completed
          ),
          agg as (
            select owner_a, owner_b,
                   sum(case when score_a > score_b then 1 else 0 end) as w_a,
                   sum(case when score_a = score_b then 1 else 0 end) as d,
                   sum(case when score_a < score_b then 1 else 0 end) as w_b,
                   sum(score_a) as gf_a,
                   sum(score_b) as ga_a
            from norm
            group by owner_a, owner_b
          )
          insert into public.manager_matchups
            (owner_key_a, owner_key_b, owner_a, owner_b, w_a, d, w_b, gf_a, ga_a, updated_at)
          select lower(owner_a), lower(owner_b), owner_a, owner_b, w_a, d, w_b, gf_a, ga_a, now()
          from agg
          on conflict (owner_key_a, owner_key_b) do update set
            owner_a = excluded.owner_a,
            owner_b = excluded.owner_b,
            w_a = excluded.w_a,
            d   = excluded.d,
            w_b = excluded.w_b,
            gf_a = excluded.gf_a,
            ga_a = excluded.ga_a,
            updated_at = now();
        """)
        conn.commit()
        cur.execute("select count(*) as n from public.manager_matchups;")
        r = cur.fetchone()
        return int((r or {}).get("n") or 0)


def get_matchups_for_owner(owner: str) -> list[dict]:
    """
    Return per-opponent record from aggregated table for the given owner.
    Shape: [{opponentOwner, opponentTeam, w,l,d,gf,ga}, ...]
    """
    key = (owner or "").strip().lower()
    sql = """
      select owner_a, owner_b, w_a, d, w_b, gf_a, ga_a
      from public.manager_matchups
      where owner_key_a = %s or owner_key_b = %s
      order by least(owner_a, owner_b), greatest(owner_a, owner_b)
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(sql, (key, key))
        rows = cur.fetchall()

    team_map = {}
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
            select owner_name, team
            from public.manager
            where active = true
        """)
        for r in cur.fetchall():
            team_map[(r.get("owner_name") or "").strip().lower()] = r.get("team")


    out = []
    for r in rows:
        a = (r["owner_a"] or "").strip()
        b = (r["owner_b"] or "").strip()
        akey, bkey = a.lower(), b.lower()

        if key == akey:
            opp = b
            w, l, d = int(r["w_a"] or 0), int(r["w_b"] or 0), int(r["d"] or 0)
            gf, ga = int(r["gf_a"] or 0), int(r["ga_a"] or 0)
        else:
            opp = a
            w, l, d = int(r["w_b"] or 0), int(r["w_a"] or 0), int(r["d"] or 0)
            gf, ga = int(r["ga_a"] or 0), int(r["gf_a"] or 0)

        out.append({
            "opponentOwner": opp,
            "opponentTeam": team_map.get(opp.lower()),
            "w": w, "l": l, "d": d,
            "gf": gf, "ga": ga,
        })
    return out


# updated code for fdr

# Helper: robust percentile (p from 0.0..1.0) on a Python list
def _percentile(sorted_vals: list, p: float) -> float:
    if not sorted_vals:
        return 0.0
    n = len(sorted_vals)
    # linear interpolation between ranks
    rank = p * (n - 1)
    lo = int(math.floor(rank))
    hi = int(math.ceil(rank))
    if lo == hi:
        return sorted_vals[lo]
    weight = rank - lo
    return sorted_vals[lo] * (1 - weight) + sorted_vals[hi] * weight

# Fetch last-N raw "for" scores for owner (most recent first)
def _fetch_last_scores(owner: str, season: str, limit_matches: int = 9) -> list[float]:
    rows = _fetch_recent_completed(owner, season, limit_matches)
    if not rows:
        return []
    owner_norm = (owner or "").strip().lower()
    scores = []
    for r in rows:
        is_home = (str(r["home_owner"] or "").strip().lower() == owner_norm)
        for_ = r["home_score"] if is_home else r["away_score"]
        if for_ is None:
            continue
        scores.append(float(for_))
    return scores  # newest first (because query orders DESC)

# Tiny slope/trend nudge from last-N scores (keeps effect small)
def _tiny_slope_bonus(scores: list[float]) -> float:
    k = len(scores)
    if k < 3:
        return 0.0
    xs = list(range(k))
    xbar = sum(xs) / k
    ybar = sum(scores) / k
    num = sum((xs[i] - xbar) * (scores[i] - ybar) for i in range(k))
    den = sum((xs[i] - xbar) ** 2 for i in range(k)) or 1.0
    slope = num / den  # points per index
    # scale to small interval; tune denominator if your score magnitudes differ a lot
    return max(-0.05, min(0.05, slope / 100.0))

# Compression toward middle so extremes are harder to reach
def _compress_mid(x: float) -> float:
    # smooth compression preserving 0..1
    return 0.5 + (x - 0.5) * 0.85

# Normalize helper
def _norm01(x: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 0.5
    return max(0.0, min(1.0, (x - lo) / (hi - lo)))

# Get the latest standings positions for a league (returns list of (owner, position))
def _latest_positions_for_league(league: str) -> list[Tuple[str, int]]:
    league_in = (league or "").strip()
    with _conn() as conn, conn.cursor() as cur:
        # find latest gameweek recorded for that league in standings_row
        cur.execute("""
            SELECT MAX(gameweek) AS max_gw
            FROM public.standings_row
            WHERE lower(league) = lower(%s)
        """, (league_in,))
        r = cur.fetchone()
        max_gw = (r or {}).get("max_gw")
        if max_gw is None:
            # no standings rows found
            return []
        cur.execute("""
            SELECT owner, position
            FROM public.standings_row
            WHERE lower(league) = lower(%s) AND gameweek = %s
            ORDER BY position ASC NULLS LAST
        """, (league_in, int(max_gw)))
        rows = cur.fetchall()
        out = []
        for row in rows:
            owner = row.get("owner")
            pos = row.get("position") if row.get("position") is not None else None
            if owner:
                out.append((owner, int(pos) if pos is not None else None))
        return out

# Main: compute strengths & FDR for a league
def build_fdr_table_for_league(league: str, season: str, limit_matches: int = 9):
    """
    Compute refined opponent strength and guarded 1..5 FDR for each owner in a league.
    Returns dict: { owner_name (str) : {
                        'position': int or None,
                        'avg_points_for': float,
                        'wl_score': float,
                        'raw_last_scores': [...],
                        'strength': float,   # 0..1 higher = stronger/harder
                        'fdr': int (1..5)
                      } }
    """
    owners_pos = _latest_positions_for_league(league)
    if not owners_pos:
        return {}

    teams = [o for o, _ in owners_pos]
    N = len(teams)

    # gather raw features
    avg_scores = {}
    wl_scores = {}
    raw_scores_map = {}
    positions = {}
    for owner, pos in owners_pos:
        recent = recent_form_score(owner, season, limit_matches=limit_matches)
        avg_scores[owner] = float(recent.get("avg_points_for", 0.0))
        wl_scores[owner] = float(recent.get("wl_score", 0.5))  # 0..1 (win fraction)
        raw_scores = _fetch_last_scores(owner, season, limit_matches)
        raw_scores_map[owner] = raw_scores
        positions[owner] = int(pos) if pos is not None else None

    # league-level mins/maxes for normalization
    vals_avg = [v for v in avg_scores.values()]
    lo_avg, hi_avg = (min(vals_avg), max(vals_avg)) if vals_avg else (0.0, 1.0)
    vals_form = [v for v in wl_scores.values()]
    lo_form, hi_form = (0.0, 1.0)  # wl_scores already 0..1

    # weights
    W_AVG, W_FORM, W_POS = 0.0, 0.0, 0.0

    # compute raw continuous strengths
    S_map = {}
    for owner in teams:
        a_raw = _norm01(avg_scores[owner], lo_avg, hi_avg)   # 0..1
        f_raw = _norm01(wl_scores[owner], lo_form, hi_form)  # 0..1
        pos = positions[owner]
        if pos is None:
            p_raw = 0.5
        else:
            p_raw = 1.0 - (pos - 1) / max(1, (N - 1))  # 1.0 top, 0.0 bottom

        # compress extremes slightly
        a_c = _compress_mid(a_raw)
        f_c = _compress_mid(f_raw)
        p_c = p_raw

        # tiny trend from raw scores
        #trend = _tiny_slope_bonus(raw_scores_map[owner])

        S = W_AVG * a_c + W_FORM * f_c + W_POS * p_c #+ trend
        S_map[owner] = max(0.0, min(1.0, S))

    # compute skewed cutpoints (10/35/65/90)
    sorted_S = sorted(S_map.values())
    c10 = _percentile(sorted_S, 0.10)
    c35 = _percentile(sorted_S, 0.35)
    c65 = _percentile(sorted_S, 0.65)
    c90 = _percentile(sorted_S, 0.90)

    # build final mapping with rarity guards
    out = {}
    for owner in teams:
        S = S_map[owner]
        if S <= c10:
            base = 1
        elif S <= c35:
            base = 2
        elif S <= c65:
            base = 3
        elif S <= c90:
            base = 4
        else:
            base = 5

        # agreement counts to make 1/5 rarer: check component thresholds
        # compute components on normalized scale for these checks
        a = _norm01(avg_scores[owner], lo_avg, hi_avg)
        f = wl_scores[owner]  # already 0..1
        p = 1.0 - (positions[owner] - 1) / max(1, (N - 1)) if positions[owner] is not None else 0.5

        low_agree = int(a <= 0.15) + int(f <= 0.20) + int(p <= 0.25)
        high_agree = int(a >= 0.85) + int(f >= 0.80) + int(p >= 0.75)

        # Demote casual 1s/5s unless at least 2 components agree
        if base == 1 and low_agree < 2:
            base = 2
        if base == 5 and high_agree < 2:
            base = 4

        out[owner] = {
            "position": positions[owner],
            "avg_points_for": avg_scores[owner],
            "wl_score": wl_scores[owner],
            "raw_last_scores": raw_scores_map[owner],
            "strength": S,
            "fdr": int(base),
        }

    return out

# ---------- APPLY FDRS TO A GW RANGE (post-refresh) ----------

def _latest_standing_for_owner(owner: str) -> dict | None:
    # You already have this utility; reuse if it exists under same name/signature.
    return latest_standing_for_owner(owner)  # returns {league, gameweek, position, ...}

def recompute_and_apply_fdrs_for_range(season: str, gw_start: int, gw_end: int, limit_matches: int = 9) -> int:
    """
    Recompute FDRs using recent form + results + table position, then apply them
    to fixtures in [gw_start, gw_end] for the given season.
    Returns number of fixture rows updated.
    """
    # 1) Pull fixtures in range (don’t touch finished matches)
    sql = """
      SELECT season, league_id, gw, fixture_id, finished,
             home_owner, away_owner
      FROM public.fixtures_h2h
      WHERE season = %s AND gw BETWEEN %s AND %s
    """
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, (season, gw_start, gw_end))
        rows = cur.fetchall()

    if not rows:
        return 0

    # 2) Build per-league owner sets by inferring each owner's current league name
    owners = set()
    for r in rows:
        owners.add((r["home_owner"] or "").strip())
        owners.add((r["away_owner"] or "").strip())

    owner_league: dict[str, str] = {}
    for owner in owners:
        info = _latest_standing_for_owner(owner)
        if info and info.get("league"):
            owner_league[owner] = (info["league"] or "").strip().lower()

    # Group owners by league string
    league_to_owners: dict[str, set[str]] = {}
    for owner, lg in owner_league.items():
        league_to_owners.setdefault(lg, set()).add(owner)


    # 3) For each league_id present in the rows, compute FDR map via live positions
    league_ids = sorted({int(r["league_id"]) for r in rows if r.get("league_id") is not None})
    fdr_map_by_lid: dict[int, dict] = {}
    for lid in league_ids:
        try:
            fdr_map_by_lid[lid] = build_fdr_table_for_league_id(lid, season, limit_matches)
        except Exception:
            fdr_map_by_lid[lid] = {}


    # 4) Prepare updates for rows in range
    updates = []
    for r in rows:
        home = (r["home_owner"] or "").strip()
        away = (r["away_owner"] or "").strip()

        lid = int(r["league_id"])
        fdr_map = fdr_map_by_lid.get(lid, {})

        h_op = fdr_map.get(away, {})
        a_op = fdr_map.get(home, {})


        home_fdr = h_op.get("fdr")
        away_fdr = a_op.get("fdr")

        # Only apply if both sides have a computed FDR
        if home_fdr is None or away_fdr is None:
            continue

        # If a fixture is already finished, leave existing FDRs as-is
        if r.get("finished") is True and r["gw"] < detect_next_gw(season):
            continue

        updates.append({
            "season": r["season"],
            "league_id": r["league_id"],
            "gw": r["gw"],
            "fixture_id": r["fixture_id"],
            "home_fdr": int(home_fdr),
            "away_fdr": int(away_fdr),
        })

    if not updates:
        return 0

    # 5) Batch UPDATE
    with psycopg.connect(DB_URL) as conn, conn.cursor() as cur:
        try:
            conn.prepare_threshold = None
        except Exception:
            pass

        try:
            cur.execute("DEALLOCATE ALL;")
        except Exception:
            pass

        sql_upd = """
          UPDATE public.fixtures_h2h
             SET home_fdr = %s,
                 away_fdr = %s,
                 updated_at = now()
           WHERE season = %s
             AND league_id = %s
             AND gw = %s
             AND fixture_id = %s
        """

        BATCH = 1000
        for i in range(0, len(updates), BATCH):
            batch = updates[i:i+BATCH]
            cur.executemany(
                sql_upd,
                [(u["home_fdr"], u["away_fdr"], u["season"], u["league_id"], u["gw"], u["fixture_id"]) for u in batch]
            )
        conn.commit()

    return len(updates)


# form a live table
def compute_live_positions_from_fixtures(season: str, league_id: int) -> list[tuple[str, int]]:
    """
    Derive current table positions from finished fixtures_h2h for a league_id in a season.
    Tie-breakers (in order): league_points desc, points_for desc, goal_diff desc, wins desc, owner asc.
    Returns: [(owner_name, position), ...] where position starts at 1, dense (no gaps).
    """
    sql = """
    WITH rows AS (
      SELECT
        home_owner, away_owner,
        COALESCE(home_score, 0) AS hs,
        COALESCE(away_score, 0) AS as,
        CASE WHEN home_score > away_score THEN 3
             WHEN home_score = away_score THEN 1
             ELSE 0 END AS pts_home,
        CASE WHEN away_score > home_score THEN 3
             WHEN away_score = home_score THEN 1
             ELSE 0 END AS pts_away,
        CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS w_home,
        CASE WHEN home_score = away_score THEN 1 ELSE 0 END AS d_both,
        CASE WHEN away_score > home_score THEN 1 ELSE 0 END AS w_away
      FROM public.fixtures_h2h
      WHERE season = %s AND league_id = %s AND finished = TRUE
        AND home_score IS NOT NULL AND away_score IS NOT NULL
    ),
    agg AS (
      SELECT owner, 
             SUM(pts)   AS league_points,
             SUM(pf)    AS points_for,
             SUM(pa)    AS points_against,
             SUM(w)     AS wins,
             SUM(d)     AS draws,
             SUM(l)     AS losses
      FROM (
        SELECT home_owner AS owner, pts_home AS pts, hs AS pf, as AS pa,
               w_home AS w, d_both AS d, (1 - w_home - d_both) AS l
        FROM rows
        UNION ALL
        SELECT away_owner AS owner, pts_away AS pts, as AS pf, hs AS pa,
               w_away AS w, d_both AS d, (1 - w_away - d_both) AS l
        FROM rows
      ) t
      GROUP BY owner
    ),
    ranked AS (
      SELECT
        owner,
        league_points,
        points_for,
        (points_for - points_against) AS gd,
        wins,
        DENSE_RANK() OVER (
          ORDER BY league_points DESC, points_for DESC, (points_for - points_against) DESC, wins DESC, owner ASC
        ) AS position
      FROM agg
    )
    SELECT owner, position
    FROM ranked
    ORDER BY position, owner;
    """
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute(sql, (season, int(league_id)))
        rows = cur.fetchall()
    return [(r["owner"], int(r["position"])) for r in rows]


def build_fdr_table_for_league_id(league_id: int, season: str, limit_matches: int = 9):
    """
    Same output as build_fdr_table_for_league, but uses live positions computed from fixtures_h2h
    for this league_id+season. This avoids the need for a standings table.
    """
    owners_pos = compute_live_positions_from_fixtures(season, league_id)
    if not owners_pos:
        return {}

    teams = [o for o, _ in owners_pos]
    N = len(teams)

    # gather raw features
    avg_scores, wl_scores, raw_scores_map, positions = {}, {}, {}, {}
    for owner, pos in owners_pos:
        recent = recent_form_score(owner, season, limit_matches=limit_matches)
        avg_scores[owner] = float(recent.get("avg_points_for", 0.0))
        wl_scores[owner]  = float(recent.get("wl_score", 0.5))  # 0..1
        raw_scores_map[owner] = _fetch_last_scores(owner, season, limit_matches)
        positions[owner] = int(pos) if pos is not None else None

    # league mins/maxes
    vals_avg = list(avg_scores.values())
    lo_avg, hi_avg = (min(vals_avg), max(vals_avg)) if vals_avg else (0.0, 1.0)
    lo_form, hi_form = 0.0, 1.0

    # your current weights (pos only)
    W_AVG, W_FORM, W_POS = 0.0, 0.0, 1.0

    # compute strengths
    S_map = {}
    for owner in teams:
        a_raw = _norm01(avg_scores[owner], lo_avg, hi_avg)
        f_raw = _norm01(wl_scores[owner],  lo_form, hi_form)
        pos = positions[owner]
        p_raw = 0.5 if pos is None else (1.0 - (pos - 1) / max(1, (N - 1)))  # 1.0 top, 0.0 bottom

        a_c = _compress_mid(a_raw)
        f_c = _compress_mid(f_raw)
        p_c = p_raw  # pure table positio

        S = W_AVG*a_c + W_FORM*f_c + W_POS*p_c
        S_map[owner] = max(0.0, min(1.0, S))

    # skewed buckets (10/35/65/90) + rarity guards
    sorted_S = sorted(S_map.values())
    c10 = _percentile(sorted_S, 0.10)
    c35 = _percentile(sorted_S, 0.35)
    c65 = _percentile(sorted_S, 0.65)
    c90 = _percentile(sorted_S, 0.90)

    out = {}
    for owner in teams:
        S = S_map[owner]
        if S <= c10: base = 1
        elif S <= c35: base = 2
        elif S <= c65: base = 3
        elif S <= c90: base = 4
        else: base = 5

        a = _norm01(avg_scores[owner], lo_avg, hi_avg)
        f = wl_scores[owner]
        p = 1.0 - (positions[owner] - 1) / max(1, (N - 1)) if positions[owner] is not None else 0.5

        low_agree  = int(a <= 0.15) + int(f <= 0.20) + int(p <= 0.25)
        high_agree = int(a >= 0.85) + int(f >= 0.80) + int(p >= 0.75)

        if base == 1 and low_agree < 2: base = 2
        if base == 5 and high_agree < 2: base = 4

        out[owner] = {
            "position": positions[owner],
            "avg_points_for": avg_scores[owner],
            "wl_score": wl_scores[owner],
            "raw_last_scores": raw_scores_map[owner],
            "strength": S,
            "fdr": int(base),
        }
    return out






