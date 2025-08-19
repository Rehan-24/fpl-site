import os, sys, json, decimal
import psycopg
from psycopg.rows import dict_row

def normalize_db_url(url: str) -> str:
    if not url:
        return url
    url = url.strip().strip('\"').strip("'")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    return url

def to_int(x):
    if x is None:
        return None
    if isinstance(x, bool):
        return int(x)
    s = str(x).strip()
    if s == '' or s.lower() in {'n','na','n/a','null','none','-','—'}:
        return None
    try:
        return int(float(s))
    except Exception:
        return None

def to_num(x):
    if x is None:
        return None
    s = str(x).strip().replace(',', '')
    if s == '' or s.lower() in {'n','na','n/a','null','none','-','—'}:
        return None
    try:
        return decimal.Decimal(s)
    except Exception:
        try:
            return decimal.Decimal(str(float(s)))
        except Exception:
            return None

def normalize_league(val):
    if not val:
        return None
    s = str(val).strip().lower()
    if 'premier' in s:
        return 'Premier'
    if 'championship' in s:
        return 'Championship'
    return None

SUPABASE_DB_URL = normalize_db_url(os.getenv('SUPABASE_DB_URL'))

# Resolve ../data relative to this file (backend/tools -> backend/data)
HERE = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.abspath(os.path.join(HERE, '..', 'data'))
MANAGERS_JSON = os.path.join(DATA_DIR, 'managers.json')
NEWS_JSON = os.path.join(DATA_DIR, 'news.json')
PREMIER_JSON = os.path.join(DATA_DIR, 'premier_gw38.json')
CHAMP_JSON = os.path.join(DATA_DIR, 'championship_gw38.json')

def slugify(s: str) -> str:
    import re, unicodedata
    s = (s or '').strip()
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s or 'item'

def upsert_manager(cur, row):
    owner = row.get('name') or row.get('owner_name') or ''
    display_name = row.get('team') or row.get('display_name') or owner or 'Unknown'
    current_league = normalize_league(row.get('current_league'))
    cur.execute(
        '''
        insert into public.manager (
            display_name, owner_name, fpl_team_url, favorite_club, image_url, dynamic_image_url, social_url,
            bio, discord_id, current_league, years_playing, premier_years, championship_years,
            promotions, relegations, best_finish, titles, titles_list, active
        )
        values (
            %s,%s,%s,%s,%s,%s,%s,
            %s,%s,%s,%s,%s,%s,
            %s,%s,%s,%s,%s,true
        )
        on conflict ((lower(owner_name))) do update
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
        ''',
        (
            display_name, owner, row.get('fpl_team_url'), row.get('favorite_club'), row.get('image_url'),
            row.get('dynamic_image_url'), row.get('social_url'), row.get('bio'),
            to_int(row.get('discord_id')),
            current_league,
            to_int(row.get('years_playing')),
            to_int(row.get('premier_years')),
            to_int(row.get('championship_years')),
            str(row.get('promotions') or ''),
            str(row.get('relegations') or ''),
            row.get('best_finish'),
            to_int(row.get('titles')) or 0,
            row.get('titles_list'),
        )
    )
    return cur.fetchone()['id']

def upsert_aliases(cur, manager_id, owner_name, display_name):
    for slug in {slugify(owner_name), slugify(display_name)}:
        cur.execute(
            'insert into public.manager_alias (slug, manager_id) values (%s,%s) '
            'on conflict (slug) do update set manager_id = excluded.manager_id',
            (slug, manager_id),
        )

def replace_trophies(cur, manager_id, trophies):
    cur.execute('delete from public.manager_trophy where manager_id = %s', (manager_id,))
    for t in (trophies or []):
        cur.execute(
            'insert into public.manager_trophy (manager_id, type, count) values (%s,%s,%s)',
            (manager_id, t.get('type'), to_int(t.get('count')) or 0),
        )

def seed_managers(conn):
    path = MANAGERS_JSON
    if not os.path.exists(path):
        print(f'WARN: {path} not found; skipping managers')
        return
    with conn.cursor(row_factory=dict_row) as cur:
        rows = json.load(open(path, 'r', encoding='utf-8'))
        for r in rows:
            mid = upsert_manager(cur, r)
            upsert_aliases(cur, mid, r.get('name') or '', r.get('team') or '')
            replace_trophies(cur, mid, r.get('trophies'))
    conn.commit()

def seed_news(conn):
    path = NEWS_JSON
    if not os.path.exists(path):
        print(f'WARN: {path} not found; skipping news')
        return
    with conn.cursor() as cur:
        rows = json.load(open(path, 'r', encoding='utf-8'))
        for r in rows:
            cur.execute(
                '''
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
                ''',
                (
                    r.get('id') or slugify(r.get('title') or ''),
                    r.get('title'),
                    r.get('date'),
                    r.get('image_url'),
                    r.get('excerpt'),
                    r.get('content') or r.get('content_html'),
                    list(r.get('tags') or []),
                ),
            )
    conn.commit()

def seed_standings(conn, path, league, gameweek=38):
    if not os.path.exists(path):
        print(f'WARN: {path} not found; skipping {league} GW{gameweek}')
        return
    rows = json.load(open(path, 'r', encoding='utf-8'))
    with conn.cursor() as cur:
        cur.execute('delete from public.standings_row where league=%s and gameweek=%s', (league, gameweek))
        cols = '(league, gameweek, position, title_reward, team, owner, points, wins, draws, losses, gp, games_left, score, score_against, plus_minus, gw_points_on_bench, season_points_on_bench, gw_transfers, gw_transfer_hit, total_transfers_made, total_transfer_hit, highest_point_total_possible, current_team_value, wildcard_1, wildcard_2, free_hit, triple_captain, bench_boost, assman)'
        placeholders = '(' + ','.join(['%s']*29) + ')'
        sql = 'insert into public.standings_row ' + cols + ' values ' + placeholders
        for r in rows:
            params = (
                league, gameweek,
                to_int(r.get('Position')) or 0,
                r.get('Title Reward'),
                r.get('Team'), r.get('Owner'),
                to_int(r.get('Points')), to_int(r.get('Wins')), to_int(r.get('Draws')), to_int(r.get('Losses')),
                to_int(r.get('GP')), to_int(r.get('Games Left')),
                to_int(r.get('Score')), to_int(r.get('Score Against')), to_int(r.get('Plus/Minus')),
                to_int(r.get('GW Points on Bench')), to_int(r.get('Season Points on Bench')),
                to_int(r.get('GW Transfers')), to_int(r.get('GW Transfer Hit')),
                to_int(r.get('Total Transfers Made')), to_int(r.get('Total Transfer Hit')),
                to_int(r.get('Highest Point Total Possible')),
                to_num(r.get('Current Team Value')),
                r.get('Wildcard 1'), r.get('Wildcard 2'),
                r.get('Free Hit'), r.get('Triple Captain'),
                r.get('Bench Boost'), r.get('AssMan'),
            )
            cur.execute(sql, params)
    conn.commit()

def main():
    if not SUPABASE_DB_URL:
        print('ERROR: Missing SUPABASE_DB_URL env var.', file=sys.stderr)
        sys.exit(2)
    print('Connecting to:', SUPABASE_DB_URL)
    try:
        with psycopg.connect(SUPABASE_DB_URL, connect_timeout=20) as conn:
            seed_managers(conn)
            seed_news(conn)
            seed_standings(conn, PREMIER_JSON, 'premier', gameweek=38)
            seed_standings(conn, CHAMP_JSON, 'championship', gameweek=38)
            print('Seed complete.')
    except Exception as e:
        print('Failed to connect/seed. Details:', repr(e), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
