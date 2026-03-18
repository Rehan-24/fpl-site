import os, json, psycopg
from psycopg.rows import dict_row
from datetime import date

SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")  # e.g., 'postgres://postgres:postgres@db.xxxxx.supabase.co:5432/postgres'

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "Website Code", "backend", "data"))
MANAGERS_JSON = os.path.join(DATA_DIR, "managers.json")
NEWS_JSON = os.path.join(DATA_DIR, "news.json")
PREMIER_JSON = os.path.join(DATA_DIR, "premier_gw38.json")
CHAMP_JSON = os.path.join(DATA_DIR, "championship_gw38.json")

def slugify(s: str) -> str:
    import re, unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii","ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s

def upsert_manager(cur, row):
    owner = row.get("name") or row.get("owner_name")
    display_name = row.get("team") or row.get("display_name") or owner
    cur.execute("""
        insert into public.manager (display_name, owner_name, fpl_team_url, favorite_club, image_url, dynamic_image_url, social_url,
                                    bio, discord_id, current_league, years_playing, premier_years, championship_years,
                                    promotions, relegations, best_finish, titles, titles_list, active)
        values (%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,true)
        on conflict (lower(owner_name)) do update
        set display_name = excluded.display_name,
            fpl_team_url = excluded.fpl_team_url,
            favorite_club = excluded.favorite_club,
            image_url = excluded.image_url,
            dynamic_image_url = excluded.dynamic_image_url,
            social_url = excluded.social_url,
            bio = excluded.bio,
            discord_id = excluded.discord_id,
            current_league = excluded.current_league,
            years_playing = excluded.years_playing,
            premier_years = excluded.premier_years,
            championship_years = excluded.championship_years,
            promotions = excluded.promotions,
            relegations = excluded.relegations,
            best_finish = excluded.best_finish,
            titles = excluded.titles,
            titles_list = excluded.titles_list,
            updated_at = now()
        returning id
    """, (
        display_name, owner, row.get("fpl_team_url"), row.get("favorite_club"), row.get("image_url"),
        row.get("dynamic_image_url"), row.get("social_url"), row.get("bio"), row.get("discord_id"),
        row.get("current_league"), row.get("years_playing"), row.get("premier_years"), row.get("championship_years"),
        str(row.get("promotions") or ""), str(row.get("relegations") or ""), row.get("best_finish"),
        int(row.get("titles") or 0), row.get("titles_list"),
    ))
    return cur.fetchone()["id"]

def upsert_aliases(cur, manager_id, owner_name, display_name):
    for slug in {slugify(owner_name), slugify(display_name)}:
        cur.execute(
            "insert into public.manager_alias (slug, manager_id) values (%s,%s) "
            "on conflict (slug) do update set manager_id = excluded.manager_id",
            (slug, manager_id),
        )

def replace_trophies(cur, manager_id, trophies):
    cur.execute("delete from public.manager_trophy where manager_id = %s", (manager_id,))
    for t in trophies or []:
        cur.execute(
            "insert into public.manager_trophy (manager_id, type, count) values (%s,%s,%s)",
            (manager_id, t.get("type"), int(t.get("count") or 0)),
        )

def seed_managers(conn):
    with conn.cursor(row_factory=dict_row) as cur:
        rows = json.load(open(MANAGERS_JSON, "r"))
        for r in rows:
            mid = upsert_manager(cur, r)
            upsert_aliases(cur, mid, r.get("name") or "", r.get("team") or "")
            replace_trophies(cur, mid, r.get("trophies"))
    conn.commit()

def seed_news(conn):
    with conn.cursor() as cur:
        rows = json.load(open(NEWS_JSON, "r"))
        for r in rows:
            cur.execute(
                """
                insert into public.news_article (id, title, date, image_url, excerpt, content_html, tags, published)
                values (%s,%s,%s,%s,%s,%s,%s,true)
                on conflict (id) do update set
                  title = excluded.title,
                  date = excluded.date,
                  image_url = excluded.image_url,
                  excerpt = excluded.excerpt,
                  content_html = excluded.content_html,
                  tags = excluded.tags,
                  published = true,
                  updated_at = now()
                """,
                (
                    r.get("id"),
                    r.get("title"),
                    r.get("date"),
                    r.get("image_url"),
                    r.get("excerpt"),
                    r.get("content"),
                    list(r.get("tags") or []),
                ),
            )
    conn.commit()

def seed_standings(conn, path, league, gameweek=38):
    import math, decimal, json
    rows = json.load(open(path, "r"))
    with conn.cursor() as cur:
        # wipe existing snapshot for given gw+league (optional)
        cur.execute("delete from public.standings_row where league=%s and gameweek=%s", (league, gameweek))
        for r in rows:
            cur.execute(
                """
                insert into public.standings_row
                (league, gameweek, position, title_reward, team, owner, points, wins, draws, losses, gp, games_left,
                 score, score_against, plus_minus, gw_points_on_bench, season_points_on_bench, gw_transfers, gw_transfer_hit,
                 total_transfers_made, total_transfer_hit, highest_point_total_possible, current_team_value,
                 triple_captain_1, bench_boost_1, free_hit_1, wildcard_1, triple_captain_2, bench_boost_2, free_hit_2, wildcard_2)
                values
                (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    league, gameweek,
                    int(r.get("Position") or 0),
                    r.get("Title Reward"),
                    r.get("Team"), r.get("Owner"),
                    r.get("Points"), r.get("Wins"), r.get("Draws"), r.get("Losses"),
                    r.get("GP"), r.get("Games Left"),
                    r.get("Score"), r.get("Score Against"), r.get("Plus/Minus"),
                    r.get("GW Points on Bench"), r.get("Season Points on Bench"),
                    r.get("GW Transfers"), r.get("GW Transfer Hit"),
                    r.get("Total Transfers Made"), r.get("Total Transfer Hit"),
                    r.get("Highest Point Total Possible"),
                    r.get("Current Team Value"),
                    r.get("Triple Captain 1"), r.get("Bench Boost 1"),
                    r.get("Free Hit 1"), r.get("Wildcard 1"),
                    r.get("Triple Captain 2"), r.get("Bench Boost 2"),
                    r.get("Free Hit 2"), r.get("Wildcard 2"),
                ),
            )
    conn.commit()

def main():
    if not SUPABASE_DB_URL:
        raise SystemExit("Missing SUPABASE_DB_URL env var (postgres connection string)")
    with psycopg.connect(SUPABASE_DB_URL) as conn:
        seed_managers(conn)
        seed_news(conn)
        seed_standings(conn, PREMIER_JSON, "premier", gameweek=38)
        seed_standings(conn, CHAMP_JSON, "championship", gameweek=38)
    print("Seed complete.")

if __name__ == "__main__":
    main()
