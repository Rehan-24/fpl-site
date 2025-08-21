# backend/backend_db.py
import os
import psycopg
import requests

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from psycopg.rows import dict_row
from psycopg.types.json import Json



DB_URL = os.getenv("SUPABASE_DB_URL")

ALLOWED_MANAGER_FIELDS = {"bio", "favorite_club", "social_url", "image_url"}

def _conn():
    if not DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    return psycopg.connect(DB_URL, row_factory=dict_row)

# ---------- Managers (reads) ----------

def fetch_all_managers():
    sql = """
    select
      m.id, m.discord_id, m.team, m.owner_name, m.fpl_team_url,
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
      home_fdr = EXCLUDED.home_fdr,
      away_fdr = EXCLUDED.away_fdr,
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
        fdr            = (r["away_fdr"] if is_home else r["home_fdr"])  # difficulty vs opponent

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


def recent_form_score(owner: str, season: str, limit_matches: int = 5) -> Dict[str, float]:
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
    if s >= 0.80: return 5
    if s >= 0.65: return 4
    if s >= 0.50: return 3
    if s >= 0.35: return 2
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
                SELECT season, league, owner_name, team_name, position, points
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
            SELECT season, league, owner_name, team_name, position, points
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
    Recompute the aggregated matchup table from fixtures_h2h.
    Counts only finished matches with non-null scores. Works across all seasons.
    """
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
          with completed as (
            select season, gw, home_owner, away_owner, home_score, away_score
            from public.fixtures_h2h
            where finished = true
              and home_score is not null
              and away_score is not null
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



