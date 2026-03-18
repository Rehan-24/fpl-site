# backend/save_snapshot.py
import os, psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("SUPABASE_DB_URL")

def save_standings_snapshot(league: str, gw: int, rows: list[dict]):
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn, conn.cursor() as cur:
        cur.execute("delete from public.standings_row where league=%s and gameweek=%s", (league, gw))
        sql = """
        insert into public.standings_row
        (league, gameweek, position, title_reward, team, owner, points, wins, draws, losses, gp, games_left,
         score, score_against, plus_minus, gw_points_on_bench, season_points_on_bench, gw_transfers, gw_transfer_hit,
         total_transfers_made, total_transfer_hit, highest_point_total_possible, current_team_value,
         wildcard_1, wildcard_2, free_hit, triple_captain, bench_boost, assman)
        values
        (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        for r in rows:
            cur.execute(sql, (
                league, gw,
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
            ))
        conn.commit()
