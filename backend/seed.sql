-- Generated 2025-08-18T23:34:14.652Z
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 3577847,
       display_name       = 'Cheeks FC',
       owner_name         = 'Rehan Khan',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/3577847/history',
       favorite_club      = 'Real Madrid',
       active             = true,
       discord_id         = 626536164236591100,
       current_league     = 'Premier',
       years_playing      = 4,
       premier_years      = 4,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = 'Premier League Winner v1, v4',
       titles             = 2,
       titles_list        = 'Premier League 2021/22, Premier League 2024/2025',
       bio                = 'Commish. 2x Premier League Winner. Loves public transit. Loves you, probably.',
       image_url          = '/images/managers/rk.jpg',
       dynamic_image_url  = '/images/dynamic_images/RK.png',
       placements         = '3',
       social_url         = 'https://www.instagram.com/rekhan.24/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Rehan Khan')
   and lower(coalesce(display_name,'')) = lower('Cheeks FC');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  3577847, 'Cheeks FC', 'Rehan Khan', 'https://fantasy.premierleague.com/entry/3577847/history', 'Real Madrid', true,
  626536164236591100, 'Premier', 4, 4, 0,
  'N', 'A', 'Premier League Winner v1, v4', 2, 'Premier League 2021/22, Premier League 2024/2025', 'Commish. 2x Premier League Winner. Loves public transit. Loves you, probably.',
  '/images/managers/rk.jpg', '/images/dynamic_images/RK.png', '3', 'https://www.instagram.com/rekhan.24/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: rehan-khan
insert into public.manager_alias (slug, manager_id)
values ('rehan-khan', (select id from public.manager where entry_id = 3577847))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: cheeks-fc
insert into public.manager_alias (slug, manager_id)
values ('cheeks-fc', (select id from public.manager where entry_id = 3577847))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 3577847);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 3577847), 'premier', coalesce(2, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 3577847), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 3577847), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5361599,
       display_name       = 'Too Slot to Handle',
       owner_name         = 'Julian Tarazi',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5361599/event/1',
       favorite_club      = 'Liverpool',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '1*',
       relegations        = '0',
       best_finish        = '2nd - Premier v4',
       titles             = 0,
       titles_list        = null,
       bio                = 'Triathlete. Loves a deflected goal. Always scores points, and was given the call up from the Championship after an impressive first season.',
       image_url          = '/images/managers/Julian_t.jpg',
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Julian Tarazi')
   and lower(coalesce(display_name,'')) = lower('Too Slot to Handle');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5361599, 'Too Slot to Handle', 'Julian Tarazi', 'https://fantasy.premierleague.com/entry/5361599/event/1', 'Liverpool', true,
  null, 'Premier', 2, 1, 1,
  '1*', '0', '2nd - Premier v4', 0, null, 'Triathlete. Loves a deflected goal. Always scores points, and was given the call up from the Championship after an impressive first season.',
  '/images/managers/Julian_t.jpg', null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: julian-tarazi
insert into public.manager_alias (slug, manager_id)
values ('julian-tarazi', (select id from public.manager where entry_id = 5361599))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: too-slot-to-handle
insert into public.manager_alias (slug, manager_id)
values ('too-slot-to-handle', (select id from public.manager where entry_id = 5361599))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5361599);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5361599), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5361599), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5361599), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4286391,
       display_name       = 'livin saliba loca',
       owner_name         = 'JD Garcia',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4286391/event/1',
       favorite_club      = 'Arsenal & Bad Takes',
       active             = true,
       discord_id         = 564529810962120700,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 2,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '3rd - Premier v4',
       titles             = 0,
       titles_list        = null,
       bio                = 'JD Garcia (JDG) was a direct replacement for JD Keller in the Premier League, and made good on his legacy with some intense takes and a poor showing in his first season. However, his second season saw him storm up the table and into Europe. Haters say it was a Mickey Mouse run, supporters will tell you to cry.',
       image_url          = '/images/managers/jdg.jpg',
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('JD Garcia')
   and lower(coalesce(display_name,'')) = lower('livin saliba loca');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4286391, 'livin saliba loca', 'JD Garcia', 'https://fantasy.premierleague.com/entry/4286391/event/1', 'Arsenal & Bad Takes', true,
  564529810962120700, 'Premier', 2, 2, 0,
  'N', 'A', '3rd - Premier v4', 0, null, 'JD Garcia (JDG) was a direct replacement for JD Keller in the Premier League, and made good on his legacy with some intense takes and a poor showing in his first season. However, his second season saw him storm up the table and into Europe. Haters say it was a Mickey Mouse run, supporters will tell you to cry.',
  '/images/managers/jdg.jpg', null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: jd-garcia
insert into public.manager_alias (slug, manager_id)
values ('jd-garcia', (select id from public.manager where entry_id = 4286391))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: livin-saliba-loca
insert into public.manager_alias (slug, manager_id)
values ('livin-saliba-loca', (select id from public.manager where entry_id = 4286391))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4286391);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4286391), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4286391), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4286391), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 617475,
       display_name       = 'Carter''s Angels',
       owner_name         = 'Carter WitmerGautsch',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/617475/event/1',
       favorite_club      = 'Southampton',
       active             = true,
       discord_id         = 417117341386801150,
       current_league     = 'Premier',
       years_playing      = 3,
       premier_years      = 3,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '2nd - Premier v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A perennial competitor for the crown, but hasn''t made the jump yet. A surprising amount of ball knowledge always makes Carter a dark horse. A fiend for fantasy sports/gambling.',
       image_url          = '/images/managers/CWG_2.png',
       dynamic_image_url  = '/images/dynamic_images/CWG.png',
       placements         = '3',
       social_url         = 'https://www.instagram.com/carter.wg/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Carter WitmerGautsch')
   and lower(coalesce(display_name,'')) = lower('Carter''s Angels');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  617475, 'Carter''s Angels', 'Carter WitmerGautsch', 'https://fantasy.premierleague.com/entry/617475/event/1', 'Southampton', true,
  417117341386801150, 'Premier', 3, 3, 0,
  'N', 'A', '2nd - Premier v2', 0, null, 'A perennial competitor for the crown, but hasn''t made the jump yet. A surprising amount of ball knowledge always makes Carter a dark horse. A fiend for fantasy sports/gambling.',
  '/images/managers/CWG_2.png', '/images/dynamic_images/CWG.png', '3', 'https://www.instagram.com/carter.wg/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: carter-witmergautsch
insert into public.manager_alias (slug, manager_id)
values ('carter-witmergautsch', (select id from public.manager where entry_id = 617475))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: carter-s-angels
insert into public.manager_alias (slug, manager_id)
values ('carter-s-angels', (select id from public.manager where entry_id = 617475))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 617475);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 617475), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 617475), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 617475), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5466499,
       display_name       = 'lamine yamal party',
       owner_name         = 'Hanson Xia',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5466499/event/1',
       favorite_club      = 'Brentford',
       active             = true,
       discord_id         = 804135340121129000,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '1*',
       relegations        = '0',
       best_finish        = '5th - Premier v4',
       titles             = 0,
       titles_list        = null,
       bio                = 'A true point-maxxer. Hanson always puts up amazing scores, and his rank speaks for itself. The next step? Some silverware.',
       image_url          = '/images/managers/hanson.jpg',
       dynamic_image_url  = '/images/dynamic_images/hanson.png',
       placements         = '2',
       social_url         = 'https://www.instagram.com/hanson_xia/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Hanson Xia')
   and lower(coalesce(display_name,'')) = lower('lamine yamal party');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5466499, 'lamine yamal party', 'Hanson Xia', 'https://fantasy.premierleague.com/entry/5466499/event/1', 'Brentford', true,
  804135340121129000, 'Premier', 2, 1, 1,
  '1*', '0', '5th - Premier v4', 0, null, 'A true point-maxxer. Hanson always puts up amazing scores, and his rank speaks for itself. The next step? Some silverware.',
  '/images/managers/hanson.jpg', '/images/dynamic_images/hanson.png', '2', 'https://www.instagram.com/hanson_xia/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: hanson-xia
insert into public.manager_alias (slug, manager_id)
values ('hanson-xia', (select id from public.manager where entry_id = 5466499))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: lamine-yamal-party
insert into public.manager_alias (slug, manager_id)
values ('lamine-yamal-party', (select id from public.manager where entry_id = 5466499))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5466499);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5466499), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5466499), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5466499), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6790800,
       display_name       = 'GyökGyök9000',
       owner_name         = 'Avi Kumar',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6790800/event/1',
       favorite_club      = 'Arsenal',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 2,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '5th - Premier v3',
       titles             = 0,
       titles_list        = null,
       bio                = 'Known to shoot his shot, even from half, and score. Analytics and xG don''t mean anything when you''re blessed like him.',
       image_url          = '/images/managers/avi.jpg',
       dynamic_image_url  = '/images/dynamic_images/avi.png',
       placements         = '2',
       social_url         = 'https://www.instagram.com/avikumar23/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Avi Kumar')
   and lower(coalesce(display_name,'')) = lower('GyökGyök9000');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6790800, 'GyökGyök9000', 'Avi Kumar', 'https://fantasy.premierleague.com/entry/6790800/event/1', 'Arsenal', true,
  null, 'Premier', 2, 2, 0,
  'N', 'A', '5th - Premier v3', 0, null, 'Known to shoot his shot, even from half, and score. Analytics and xG don''t mean anything when you''re blessed like him.',
  '/images/managers/avi.jpg', '/images/dynamic_images/avi.png', '2', 'https://www.instagram.com/avikumar23/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: avi-kumar
insert into public.manager_alias (slug, manager_id)
values ('avi-kumar', (select id from public.manager where entry_id = 6790800))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: gy-kgy-k9000
insert into public.manager_alias (slug, manager_id)
values ('gy-kgy-k9000', (select id from public.manager where entry_id = 6790800))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6790800);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6790800), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6790800), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6790800), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 1512563,
       display_name       = 'Boogie Woogie',
       owner_name         = 'James Giles',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/1512563/event/1',
       favorite_club      = 'Arsenal',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '1',
       relegations        = '0',
       best_finish        = 'Championship Winner v1',
       titles             = 1,
       titles_list        = 'Championship 2023/24',
       bio                = 'James, better known as Jimmy, was a headline grabber in his first season in the Championship. He found himself in a heated race, but managed to beat out his own Dad amongst others to secure the title and promotion. The jump to the Premier league didn''t phase him at all, as he once again beat out his Dad in order to secure Conference League football.',
       image_url          = '/images/managers/jimmy.jpg',
       dynamic_image_url  = '/images/dynamic_images/jimmy.png',
       placements         = '2',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('James Giles')
   and lower(coalesce(display_name,'')) = lower('Boogie Woogie');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  1512563, 'Boogie Woogie', 'James Giles', 'https://fantasy.premierleague.com/entry/1512563/event/1', 'Arsenal', true,
  null, 'Premier', 2, 1, 1,
  '1', '0', 'Championship Winner v1', 1, 'Championship 2023/24', 'James, better known as Jimmy, was a headline grabber in his first season in the Championship. He found himself in a heated race, but managed to beat out his own Dad amongst others to secure the title and promotion. The jump to the Premier league didn''t phase him at all, as he once again beat out his Dad in order to secure Conference League football.',
  '/images/managers/jimmy.jpg', '/images/dynamic_images/jimmy.png', '2', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: james-giles
insert into public.manager_alias (slug, manager_id)
values ('james-giles', (select id from public.manager where entry_id = 1512563))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: boogie-woogie
insert into public.manager_alias (slug, manager_id)
values ('boogie-woogie', (select id from public.manager where entry_id = 1512563))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 1512563);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1512563), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1512563), 'championship', coalesce(1, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1512563), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4087698,
       display_name       = 'Noni to be upset',
       owner_name         = 'Joel Mathew',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4087698/event/1',
       favorite_club      = 'Arsenal',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 3,
       premier_years      = 3,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = 'Premier League Winner v2',
       titles             = 1,
       titles_list        = 'Premier League 2022/23',
       bio                = 'Joel took over the league in his first season, storming to the title. His second season showed it was no fluke, as he finished 3rd. His third season saw a regression outside of the Top 7, but pundits are all betting on him returning to Europe.',
       image_url          = '/images/managers/joel.jpg',
       dynamic_image_url  = '/images/dynamic_images/joel.png',
       placements         = '2',
       social_url         = 'https://www.instagram.com/joel_mathew25/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Joel Mathew')
   and lower(coalesce(display_name,'')) = lower('Noni to be upset');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4087698, 'Noni to be upset', 'Joel Mathew', 'https://fantasy.premierleague.com/entry/4087698/event/1', 'Arsenal', true,
  null, 'Premier', 3, 3, 0,
  'N', 'A', 'Premier League Winner v2', 1, 'Premier League 2022/23', 'Joel took over the league in his first season, storming to the title. His second season showed it was no fluke, as he finished 3rd. His third season saw a regression outside of the Top 7, but pundits are all betting on him returning to Europe.',
  '/images/managers/joel.jpg', '/images/dynamic_images/joel.png', '2', 'https://www.instagram.com/joel_mathew25/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: joel-mathew
insert into public.manager_alias (slug, manager_id)
values ('joel-mathew', (select id from public.manager where entry_id = 4087698))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: noni-to-be-upset
insert into public.manager_alias (slug, manager_id)
values ('noni-to-be-upset', (select id from public.manager where entry_id = 4087698))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4087698);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4087698), 'premier', coalesce(1, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4087698), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4087698), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 1520141,
       display_name       = 'Slopeds FC',
       owner_name         = 'Michael Giles',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/1520141/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '1',
       relegations        = '0',
       best_finish        = '3rd - Championship v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'Father to Jimmy Giles, but apparently no match for him. Mr. Giles oversaw impressive performances that saw him promoted to the Premier League in his first season. He would continue that great form in the top flight, but once again found himself behind his own son.',
       image_url          = '/images/managers/michael.jpg',
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Michael Giles')
   and lower(coalesce(display_name,'')) = lower('Slopeds FC');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  1520141, 'Slopeds FC', 'Michael Giles', 'https://fantasy.premierleague.com/entry/1520141/event/1', 'The Beautiful Game', true,
  null, 'Premier', 2, 1, 1,
  '1', '0', '3rd - Championship v1', 0, null, 'Father to Jimmy Giles, but apparently no match for him. Mr. Giles oversaw impressive performances that saw him promoted to the Premier League in his first season. He would continue that great form in the top flight, but once again found himself behind his own son.',
  '/images/managers/michael.jpg', null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: michael-giles
insert into public.manager_alias (slug, manager_id)
values ('michael-giles', (select id from public.manager where entry_id = 1520141))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: slopeds-fc
insert into public.manager_alias (slug, manager_id)
values ('slopeds-fc', (select id from public.manager where entry_id = 1520141))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 1520141);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1520141), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1520141), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1520141), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 3239682,
       display_name       = 'Peaky Reijnders',
       owner_name         = 'Marvin Ling',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/3239682/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 2,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = 'Premier League Winner v3',
       titles             = 1,
       titles_list        = 'Premier League 2023/24',
       bio                = 'Like Joel, his first season was a sizzling success as he dominated the league to win his first trophy. His second season brought questions of a title hangover, but we would be remiss to doubt him.',
       image_url          = '/images/managers/marvin.jpg',
       dynamic_image_url  = '/images/dynamic_images/marvin.png',
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Marvin Ling')
   and lower(coalesce(display_name,'')) = lower('Peaky Reijnders');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  3239682, 'Peaky Reijnders', 'Marvin Ling', 'https://fantasy.premierleague.com/entry/3239682/event/1', 'The Beautiful Game', true,
  null, 'Premier', 2, 2, 0,
  'N', 'A', 'Premier League Winner v3', 1, 'Premier League 2023/24', 'Like Joel, his first season was a sizzling success as he dominated the league to win his first trophy. His second season brought questions of a title hangover, but we would be remiss to doubt him.',
  '/images/managers/marvin.jpg', '/images/dynamic_images/marvin.png', '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: marvin-ling
insert into public.manager_alias (slug, manager_id)
values ('marvin-ling', (select id from public.manager where entry_id = 3239682))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: peaky-reijnders
insert into public.manager_alias (slug, manager_id)
values ('peaky-reijnders', (select id from public.manager where entry_id = 3239682))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 3239682);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 3239682), 'premier', coalesce(1, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 3239682), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 3239682), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5066840,
       display_name       = 'Siuuuuuu Later',
       owner_name         = 'Ryan Gallagher',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5066840/event/1',
       favorite_club      = 'Messi? Liverpool? Arsenal? Barca?',
       active             = true,
       discord_id         = 501289999065546750,
       current_league     = 'Premier',
       years_playing      = 3,
       premier_years      = 3,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '2nd - Premier v3 // 3rd Place FA Cup v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'He''s here, he''s there, he''s everywhere (when it comes to supporting a club)! A man of strong opinions and weak bones. You''re either in for a beatdown or a good laugh. Shoutout the Gal.',
       image_url          = '/images/managers/gal.jpg',
       dynamic_image_url  = '/images/dynamic_images/gal.png',
       placements         = '3',
       social_url         = 'https://www.instagram.com/ryan_gallagher15/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Ryan Gallagher')
   and lower(coalesce(display_name,'')) = lower('Siuuuuuu Later');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5066840, 'Siuuuuuu Later', 'Ryan Gallagher', 'https://fantasy.premierleague.com/entry/5066840/event/1', 'Messi? Liverpool? Arsenal? Barca?', true,
  501289999065546750, 'Premier', 3, 3, 0,
  'N', 'A', '2nd - Premier v3 // 3rd Place FA Cup v1', 0, null, 'He''s here, he''s there, he''s everywhere (when it comes to supporting a club)! A man of strong opinions and weak bones. You''re either in for a beatdown or a good laugh. Shoutout the Gal.',
  '/images/managers/gal.jpg', '/images/dynamic_images/gal.png', '3', 'https://www.instagram.com/ryan_gallagher15/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: ryan-gallagher
insert into public.manager_alias (slug, manager_id)
values ('ryan-gallagher', (select id from public.manager where entry_id = 5066840))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: siuuuuuu-later
insert into public.manager_alias (slug, manager_id)
values ('siuuuuuu-later', (select id from public.manager where entry_id = 5066840))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5066840);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5066840), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5066840), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5066840), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4137251,
       display_name       = 'Eze Dub',
       owner_name         = 'Seth Gerus',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4137251/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = 416786179929800700,
       current_league     = 'Premier',
       years_playing      = 4,
       premier_years      = 4,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '4th - Premier v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'Found a fun footy reel? Think you''re the first to find it? Nope. Seth''s already been there. A man''s football knowledge is known to be based on his ability to find the best of the best, and Seth seems to consistently do so.',
       image_url          = '/images/managers/seth.jpg',
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Seth Gerus')
   and lower(coalesce(display_name,'')) = lower('Eze Dub');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4137251, 'Eze Dub', 'Seth Gerus', 'https://fantasy.premierleague.com/entry/4137251/event/1', 'The Beautiful Game', true,
  416786179929800700, 'Premier', 4, 4, 0,
  'N', 'A', '4th - Premier v2', 0, null, 'Found a fun footy reel? Think you''re the first to find it? Nope. Seth''s already been there. A man''s football knowledge is known to be based on his ability to find the best of the best, and Seth seems to consistently do so.',
  '/images/managers/seth.jpg', null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: seth-gerus
insert into public.manager_alias (slug, manager_id)
values ('seth-gerus', (select id from public.manager where entry_id = 4137251))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: eze-dub
insert into public.manager_alias (slug, manager_id)
values ('eze-dub', (select id from public.manager where entry_id = 4137251))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4137251);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4137251), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4137251), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4137251), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4088389,
       display_name       = 'Mandem FC',
       owner_name         = 'Kamil Sacha',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4088389/event/1',
       favorite_club      = 'Manchester United',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 3,
       premier_years      = 3,
       championship_years = 0,
       promotions         = 'N/A',
       relegations        = 'N/A',
       best_finish        = '3rd - Premier v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'Stories like no other from the man keeps you on your toes. Capable of a mid season surge like no other.',
       image_url          = '/images/managers/kamil.jpg',
       dynamic_image_url  = '/images/dynamic_images/kamil.png',
       placements         = '1',
       social_url         = 'https://www.instagram.com/kamil.sacha/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Kamil Sacha')
   and lower(coalesce(display_name,'')) = lower('Mandem FC');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4088389, 'Mandem FC', 'Kamil Sacha', 'https://fantasy.premierleague.com/entry/4088389/event/1', 'Manchester United', true,
  null, 'Premier', 3, 3, 0,
  'N/A', 'N/A', '3rd - Premier v2', 0, null, 'Stories like no other from the man keeps you on your toes. Capable of a mid season surge like no other.',
  '/images/managers/kamil.jpg', '/images/dynamic_images/kamil.png', '1', 'https://www.instagram.com/kamil.sacha/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: kamil-sacha
insert into public.manager_alias (slug, manager_id)
values ('kamil-sacha', (select id from public.manager where entry_id = 4088389))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: mandem-fc
insert into public.manager_alias (slug, manager_id)
values ('mandem-fc', (select id from public.manager where entry_id = 4088389))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4088389);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4088389), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4088389), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4088389), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 7937084,
       display_name       = 'Aches and Pains',
       owner_name         = 'Imran Khan',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/7937084/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 4,
       premier_years      = 4,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '8th - Premier v1 // FA Cup Runner Up v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'Aches and Pains can only describe the feeling of constantly losing to your son every year. A legend and founder of the game. Will he wake up and find his footing back to the top of the table?',
       image_url          = '/images/managers/imran.jpg',
       dynamic_image_url  = '/images/dynamic_images/imran.png',
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Imran Khan')
   and lower(coalesce(display_name,'')) = lower('Aches and Pains');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  7937084, 'Aches and Pains', 'Imran Khan', 'https://fantasy.premierleague.com/entry/7937084/event/1', 'The Beautiful Game', true,
  null, 'Premier', 4, 4, 0,
  'N', 'A', '8th - Premier v1 // FA Cup Runner Up v1', 0, null, 'Aches and Pains can only describe the feeling of constantly losing to your son every year. A legend and founder of the game. Will he wake up and find his footing back to the top of the table?',
  '/images/managers/imran.jpg', '/images/dynamic_images/imran.png', '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: imran-khan
insert into public.manager_alias (slug, manager_id)
values ('imran-khan', (select id from public.manager where entry_id = 7937084))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: aches-and-pains
insert into public.manager_alias (slug, manager_id)
values ('aches-and-pains', (select id from public.manager where entry_id = 7937084))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 7937084);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7937084), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7937084), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7937084), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6679946,
       display_name       = 'Klopp''s Resurgence',
       owner_name         = 'Chandler Ashman',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6679946/event/1',
       favorite_club      = 'Barcelona',
       active             = true,
       discord_id         = null,
       current_league     = 'Premier',
       years_playing      = 4,
       premier_years      = 4,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = '6th - Premier v3',
       titles             = 1,
       titles_list        = 'FA Cup 2024/25',
       bio                = 'Pirlo has been said to have studied under the tutelage of Chanse Ashman. His ways are sometimes too big brained for others to understand, but his intentions for the game are pure. Despite a tough season by his standards, he managed to guide his team to an FA Cup trophy in its inaugural season.',
       image_url          = '/images/managers/chanse.jpg',
       dynamic_image_url  = '/images/dynamic_images/chanse.png',
       placements         = '2',
       social_url         = 'https://www.instagram.com/chanse.a/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Chandler Ashman')
   and lower(coalesce(display_name,'')) = lower('Klopp''s Resurgence');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6679946, 'Klopp''s Resurgence', 'Chandler Ashman', 'https://fantasy.premierleague.com/entry/6679946/event/1', 'Barcelona', true,
  null, 'Premier', 4, 4, 0,
  'N', 'A', '6th - Premier v3', 1, 'FA Cup 2024/25', 'Pirlo has been said to have studied under the tutelage of Chanse Ashman. His ways are sometimes too big brained for others to understand, but his intentions for the game are pure. Despite a tough season by his standards, he managed to guide his team to an FA Cup trophy in its inaugural season.',
  '/images/managers/chanse.jpg', '/images/dynamic_images/chanse.png', '2', 'https://www.instagram.com/chanse.a/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: chandler-ashman
insert into public.manager_alias (slug, manager_id)
values ('chandler-ashman', (select id from public.manager where entry_id = 6679946))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: klopp-s-resurgence
insert into public.manager_alias (slug, manager_id)
values ('klopp-s-resurgence', (select id from public.manager where entry_id = 6679946))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6679946);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6679946), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6679946), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6679946), 'fa', coalesce(1, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 1270351,
       display_name       = 'Bend it Like Declan',
       owner_name         = 'Derek Huddleston',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/1270351/event/1',
       favorite_club      = 'Arsenal',
       active             = true,
       discord_id         = 701292528024158200,
       current_league     = 'Premier',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '1',
       relegations        = '0',
       best_finish        = '2nd - Championship v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'Dedicated to his craft. We never said that it always works out, though. After a sizzling debut season that earned Derek promotion, he stumbled and felt the full force of the Premier League come down on him. He managed to hold his spot on the final gameweek, and looks to improve on what he''s seen.',
       image_url          = '/images/managers/derek.jpg',
       dynamic_image_url  = '/images/dynamic_images/derek_1.png',
       placements         = '1',
       social_url         = 'https://letterboxd.com/derekhuddy/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Derek Huddleston')
   and lower(coalesce(display_name,'')) = lower('Bend it Like Declan');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  1270351, 'Bend it Like Declan', 'Derek Huddleston', 'https://fantasy.premierleague.com/entry/1270351/event/1', 'Arsenal', true,
  701292528024158200, 'Premier', 2, 1, 1,
  '1', '0', '2nd - Championship v1', 0, null, 'Dedicated to his craft. We never said that it always works out, though. After a sizzling debut season that earned Derek promotion, he stumbled and felt the full force of the Premier League come down on him. He managed to hold his spot on the final gameweek, and looks to improve on what he''s seen.',
  '/images/managers/derek.jpg', '/images/dynamic_images/derek_1.png', '1', 'https://letterboxd.com/derekhuddy/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: derek-huddleston
insert into public.manager_alias (slug, manager_id)
values ('derek-huddleston', (select id from public.manager where entry_id = 1270351))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: bend-it-like-declan
insert into public.manager_alias (slug, manager_id)
values ('bend-it-like-declan', (select id from public.manager where entry_id = 1270351))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 1270351);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1270351), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1270351), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1270351), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5596813,
       display_name       = 'Beans and Rice',
       owner_name         = 'Will Franzoni',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5596813/event/1',
       favorite_club      = 'Tottenham Spurs',
       active             = true,
       discord_id         = null,
       current_league     = 'Relegated to Championship',
       years_playing      = 4,
       premier_years      = 4,
       championship_years = 0,
       promotions         = '0',
       relegations        = '1',
       best_finish        = '9th - Premier v3',
       titles             = 0,
       titles_list        = null,
       bio                = 'An OG and someone who manages to always keep the vibes up. Shame he couldn''t keep his team up this year, though. Pundits are expecting a strong push back to the top this year!',
       image_url          = '/images/managers/will_f.jpg',
       dynamic_image_url  = '/images/dynamic_images/will_f.png',
       placements         = '0',
       social_url         = 'https://www.instagram.com/willfranzoni/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Will Franzoni')
   and lower(coalesce(display_name,'')) = lower('Beans and Rice');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5596813, 'Beans and Rice', 'Will Franzoni', 'https://fantasy.premierleague.com/entry/5596813/event/1', 'Tottenham Spurs', true,
  null, 'Relegated to Championship', 4, 4, 0,
  '0', '1', '9th - Premier v3', 0, null, 'An OG and someone who manages to always keep the vibes up. Shame he couldn''t keep his team up this year, though. Pundits are expecting a strong push back to the top this year!',
  '/images/managers/will_f.jpg', '/images/dynamic_images/will_f.png', '0', 'https://www.instagram.com/willfranzoni/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: will-franzoni
insert into public.manager_alias (slug, manager_id)
values ('will-franzoni', (select id from public.manager where entry_id = 5596813))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: beans-and-rice
insert into public.manager_alias (slug, manager_id)
values ('beans-and-rice', (select id from public.manager where entry_id = 5596813))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5596813);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5596813), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5596813), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5596813), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 7349746,
       display_name       = 'wizards',
       owner_name         = 'Aaron Frank',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/7349746/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Relegated to Championship',
       years_playing      = 3,
       premier_years      = 3,
       championship_years = 0,
       promotions         = '0',
       relegations        = '1',
       best_finish        = '4th - Premier v3',
       titles             = 0,
       titles_list        = null,
       bio                = 'If wizards were real, we''d expect them to grant this club leniency and keep them up. A tough and unusual season may, though, be what sparks life back into this club.',
       image_url          = '/images/managers/aaron.jpg',
       dynamic_image_url  = '/images/dynamic_images/aaron.png',
       placements         = '1',
       social_url         = 'https://www.instagram.com/aaronfrrank/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Aaron Frank')
   and lower(coalesce(display_name,'')) = lower('wizards');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  7349746, 'wizards', 'Aaron Frank', 'https://fantasy.premierleague.com/entry/7349746/event/1', 'The Beautiful Game', true,
  null, 'Relegated to Championship', 3, 3, 0,
  '0', '1', '4th - Premier v3', 0, null, 'If wizards were real, we''d expect them to grant this club leniency and keep them up. A tough and unusual season may, though, be what sparks life back into this club.',
  '/images/managers/aaron.jpg', '/images/dynamic_images/aaron.png', '1', 'https://www.instagram.com/aaronfrrank/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: aaron-frank
insert into public.manager_alias (slug, manager_id)
values ('aaron-frank', (select id from public.manager where entry_id = 7349746))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: wizards
insert into public.manager_alias (slug, manager_id)
values ('wizards', (select id from public.manager where entry_id = 7349746))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 7349746);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7349746), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7349746), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7349746), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6197359,
       display_name       = 'FirstPlaceBelow',
       owner_name         = 'William Okine',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6197359/event/1',
       favorite_club      = 'Chelsea',
       active             = true,
       discord_id         = null,
       current_league     = 'Relegated to Championship',
       years_playing      = 4,
       premier_years      = 4,
       championship_years = 0,
       promotions         = '0',
       relegations        = '1',
       best_finish        = '7th - Premier v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'He''ll score a header and hit the SUIII before taking a hike. A founder of the game, and a legend in his own right. A surprise drop sees him question his future.',
       image_url          = '/images/managers/will_o.jpg',
       dynamic_image_url  = '/images/dynamic_images/will_o.png',
       placements         = '1',
       social_url         = 'https://www.instagram.com/will_okine/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('William Okine')
   and lower(coalesce(display_name,'')) = lower('FirstPlaceBelow');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6197359, 'FirstPlaceBelow', 'William Okine', 'https://fantasy.premierleague.com/entry/6197359/event/1', 'Chelsea', true,
  null, 'Relegated to Championship', 4, 4, 0,
  '0', '1', '7th - Premier v1', 0, null, 'He''ll score a header and hit the SUIII before taking a hike. A founder of the game, and a legend in his own right. A surprise drop sees him question his future.',
  '/images/managers/will_o.jpg', '/images/dynamic_images/will_o.png', '1', 'https://www.instagram.com/will_okine/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: william-okine
insert into public.manager_alias (slug, manager_id)
values ('william-okine', (select id from public.manager where entry_id = 6197359))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: firstplacebelow
insert into public.manager_alias (slug, manager_id)
values ('firstplacebelow', (select id from public.manager where entry_id = 6197359))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6197359);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6197359), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6197359), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6197359), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6921329,
       display_name       = 'haaland is washed',
       owner_name         = 'Logan Roth',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6921329/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = 703090779761147900,
       current_league     = 'Relegated to Championship',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '1',
       relegations        = '1',
       best_finish        = '4th - Championship v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'Roth has always been brave and taken risks, as his first season saw him skip out on Halaand and still earn promotion. However, the gamble of auto playing in his second season in the Prem proved to be a step too far has he saw himself fall back into the Championship.',
       image_url          = '/images/managers/logan.jpg',
       dynamic_image_url  = '/images/dynamic_images/logan.png',
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Logan Roth')
   and lower(coalesce(display_name,'')) = lower('haaland is washed');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6921329, 'haaland is washed', 'Logan Roth', 'https://fantasy.premierleague.com/entry/6921329/event/1', 'The Beautiful Game', true,
  703090779761147900, 'Relegated to Championship', 2, 1, 1,
  '1', '1', '4th - Championship v1', 0, null, 'Roth has always been brave and taken risks, as his first season saw him skip out on Halaand and still earn promotion. However, the gamble of auto playing in his second season in the Prem proved to be a step too far has he saw himself fall back into the Championship.',
  '/images/managers/logan.jpg', '/images/dynamic_images/logan.png', '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: logan-roth
insert into public.manager_alias (slug, manager_id)
values ('logan-roth', (select id from public.manager where entry_id = 6921329))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: haaland-is-washed
insert into public.manager_alias (slug, manager_id)
values ('haaland-is-washed', (select id from public.manager where entry_id = 6921329))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6921329);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6921329), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6921329), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6921329), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4141448,
       display_name       = 'Cincy Til I Cry',
       owner_name         = 'Tyler Quedens',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4141448/event/1',
       favorite_club      = 'FC Cincinnati',
       active             = true,
       discord_id         = null,
       current_league     = 'Promoted to Premier League',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '1',
       relegations        = '0',
       best_finish        = 'Championship Winner v2',
       titles             = 1,
       titles_list        = 'Championship Winner 2024/25',
       bio                = 'Tyler Q came into his debut FPL season and created history. A record 93 points is the most ever earned across both league. Never before seen in our sport, but then again, he''s also never seen the Premier League. His Premier League debut season will certainly be one to watch.',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Tyler Quedens')
   and lower(coalesce(display_name,'')) = lower('Cincy Til I Cry');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4141448, 'Cincy Til I Cry', 'Tyler Quedens', 'https://fantasy.premierleague.com/entry/4141448/event/1', 'FC Cincinnati', true,
  null, 'Promoted to Premier League', 1, 0, 1,
  '1', '0', 'Championship Winner v2', 1, 'Championship Winner 2024/25', 'Tyler Q came into his debut FPL season and created history. A record 93 points is the most ever earned across both league. Never before seen in our sport, but then again, he''s also never seen the Premier League. His Premier League debut season will certainly be one to watch.',
  null, null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: tyler-quedens
insert into public.manager_alias (slug, manager_id)
values ('tyler-quedens', (select id from public.manager where entry_id = 4141448))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: cincy-til-i-cry
insert into public.manager_alias (slug, manager_id)
values ('cincy-til-i-cry', (select id from public.manager where entry_id = 4141448))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4141448);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4141448), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4141448), 'championship', coalesce(1, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4141448), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5130249,
       display_name       = 'Bamford''s Baddies',
       owner_name         = 'Aj Pepperney',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5130249/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Promoted to Premier League',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '1',
       relegations        = '0',
       best_finish        = '2nd - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'AJ came into his debut season as a relatively unknown player, but flipped the script on everyone by cleaning up and immediately earning himself promotion to the top league. Pundits and opps alike are unsure what to expect.',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Aj Pepperney')
   and lower(coalesce(display_name,'')) = lower('Bamford''s Baddies');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5130249, 'Bamford''s Baddies', 'Aj Pepperney', 'https://fantasy.premierleague.com/entry/5130249/event/1', 'The Beautiful Game', true,
  null, 'Promoted to Premier League', 1, 0, 1,
  '1', '0', '2nd - Championship v2', 0, null, 'AJ came into his debut season as a relatively unknown player, but flipped the script on everyone by cleaning up and immediately earning himself promotion to the top league. Pundits and opps alike are unsure what to expect.',
  null, null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: aj-pepperney
insert into public.manager_alias (slug, manager_id)
values ('aj-pepperney', (select id from public.manager where entry_id = 5130249))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: bamford-s-baddies
insert into public.manager_alias (slug, manager_id)
values ('bamford-s-baddies', (select id from public.manager where entry_id = 5130249))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5130249);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5130249), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5130249), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5130249), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4350516,
       display_name       = 'Cech Mate',
       owner_name         = 'Tyler Neal',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4350516/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Promoted to Premier League',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '1',
       relegations        = '0',
       best_finish        = '3rd - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'An amazing debut season that saw Tyler N gain promotion only serves to build up the hype for his Premier League debut. One to watch!',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Tyler Neal')
   and lower(coalesce(display_name,'')) = lower('Cech Mate');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4350516, 'Cech Mate', 'Tyler Neal', 'https://fantasy.premierleague.com/entry/4350516/event/1', 'The Beautiful Game', true,
  null, 'Promoted to Premier League', 1, 0, 1,
  '1', '0', '3rd - Championship v2', 0, null, 'An amazing debut season that saw Tyler N gain promotion only serves to build up the hype for his Premier League debut. One to watch!',
  null, null, '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: tyler-neal
insert into public.manager_alias (slug, manager_id)
values ('tyler-neal', (select id from public.manager where entry_id = 4350516))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: cech-mate
insert into public.manager_alias (slug, manager_id)
values ('cech-mate', (select id from public.manager where entry_id = 4350516))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4350516);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4350516), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4350516), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4350516), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4690925,
       display_name       = 'Peps Lads',
       owner_name         = 'Linden Eberle',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4690925/event/1',
       favorite_club      = 'Manchester City',
       active             = true,
       discord_id         = 788952847151923200,
       current_league     = 'Promoted to Premier League',
       years_playing      = 4,
       premier_years      = 2,
       championship_years = 2,
       promotions         = '1',
       relegations        = '1',
       best_finish        = '4th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A menace in FUT. A founding manager who lost their way has finally made it back to the promise land. Will he be able to stay there?',
       image_url          = '/images/managers/linden.jpg',
       dynamic_image_url  = '/images/dynamic_images/linden.png',
       placements         = '1',
       social_url         = 'https://www.instagram.com/lindenjeberle/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Linden Eberle')
   and lower(coalesce(display_name,'')) = lower('Peps Lads');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4690925, 'Peps Lads', 'Linden Eberle', 'https://fantasy.premierleague.com/entry/4690925/event/1', 'Manchester City', true,
  788952847151923200, 'Promoted to Premier League', 4, 2, 2,
  '1', '1', '4th - Championship v2', 0, null, 'A menace in FUT. A founding manager who lost their way has finally made it back to the promise land. Will he be able to stay there?',
  '/images/managers/linden.jpg', '/images/dynamic_images/linden.png', '1', 'https://www.instagram.com/lindenjeberle/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: linden-eberle
insert into public.manager_alias (slug, manager_id)
values ('linden-eberle', (select id from public.manager where entry_id = 4690925))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: peps-lads
insert into public.manager_alias (slug, manager_id)
values ('peps-lads', (select id from public.manager where entry_id = 4690925))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4690925);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4690925), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4690925), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4690925), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4080174,
       display_name       = 'Rolls Rice',
       owner_name         = 'Zoha Khan',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4080174/event/1',
       favorite_club      = 'Real Madrid',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 2,
       premier_years      = 0,
       championship_years = 2,
       promotions         = 'N/A',
       relegations        = 'N/A',
       best_finish        = '5th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'The glue that holds the Championship league together. Runs this league data gathering for us. Can''t get promotion, if even if she wanted to.',
       image_url          = '/images/managers/zoha.jpg',
       dynamic_image_url  = '/images/dynamic_images/zoha.png',
       placements         = '1',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Zoha Khan')
   and lower(coalesce(display_name,'')) = lower('Rolls Rice');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4080174, 'Rolls Rice', 'Zoha Khan', 'https://fantasy.premierleague.com/entry/4080174/event/1', 'Real Madrid', true,
  null, 'Championship', 2, 0, 2,
  'N/A', 'N/A', '5th - Championship v2', 0, null, 'The glue that holds the Championship league together. Runs this league data gathering for us. Can''t get promotion, if even if she wanted to.',
  '/images/managers/zoha.jpg', '/images/dynamic_images/zoha.png', '1', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: zoha-khan
insert into public.manager_alias (slug, manager_id)
values ('zoha-khan', (select id from public.manager where entry_id = 4080174))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: rolls-rice
insert into public.manager_alias (slug, manager_id)
values ('rolls-rice', (select id from public.manager where entry_id = 4080174))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4080174);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4080174), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4080174), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4080174), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = entry_id,
       display_name       = 'AVERAGE',
       owner_name         = 'AVERAGE (bot)',
       fpl_team_url       = '#',
       favorite_club      = 'ChatGPT',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 4,
       premier_years      = 2,
       championship_years = 2,
       promotions         = 'N/A',
       relegations        = 'N/A',
       best_finish        = '6th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'It''s honestly amazing that this bot is so competitive. Maybe it won''t play this year. At the mercy of the league.',
       image_url          = '/images/managers/bot.jpg',
       dynamic_image_url  = '/images/dynamic_images/bot.png',
       placements         = '1',
       social_url         = 'https://www.pcrf.net/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('AVERAGE (bot)')
   and lower(coalesce(display_name,'')) = lower('AVERAGE');
-- Insert-if-missing by names (no entry_id)
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
)
select
  null, 'AVERAGE', 'AVERAGE (bot)', '#', 'ChatGPT', true,
  null, 'Championship', 4, 2, 2,
  'N/A', 'N/A', '6th - Championship v2', 0, null, 'It''s honestly amazing that this bot is so competitive. Maybe it won''t play this year. At the mercy of the league.',
  '/images/managers/bot.jpg', '/images/dynamic_images/bot.png', '1', 'https://www.pcrf.net/'
where not exists (
  select 1 from public.manager
   where lower(coalesce(owner_name,''))   = lower('AVERAGE (bot)')
     and lower(coalesce(display_name,'')) = lower('AVERAGE')
);
-- alias: average-bot
insert into public.manager_alias (slug, manager_id)
values ('average-bot', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('AVERAGE (bot)') and lower(coalesce(display_name,'')) = lower('AVERAGE') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: average
insert into public.manager_alias (slug, manager_id)
values ('average', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('AVERAGE (bot)') and lower(coalesce(display_name,'')) = lower('AVERAGE') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where lower(coalesce(owner_name,'')) = lower('AVERAGE (bot)') and lower(coalesce(display_name,'')) = lower('AVERAGE') order by id desc limit 1);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('AVERAGE (bot)') and lower(coalesce(display_name,'')) = lower('AVERAGE') order by id desc limit 1), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('AVERAGE (bot)') and lower(coalesce(display_name,'')) = lower('AVERAGE') order by id desc limit 1), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('AVERAGE (bot)') and lower(coalesce(display_name,'')) = lower('AVERAGE') order by id desc limit 1), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6542694,
       display_name       = 'ur dads fav team',
       owner_name         = 'Brynn Miller',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6542694/event/1',
       favorite_club      = 'Arsenal, Beautiful Men',
       active             = true,
       discord_id         = 842855247474327600,
       current_league     = 'Championship',
       years_playing      = 2,
       premier_years      = 0,
       championship_years = 2,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '7th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'Your Mom and Dad''s favorite team and favorite manager. Enjoys the beautiful game and the beautiful people playing it. An absolute icon of the game.',
       image_url          = '/images/managers/brynn.jpg',
       dynamic_image_url  = '/images/dynamic_images/brynn_1.png',
       placements         = '2',
       social_url         = 'https://boxd.it/4Ju45',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Brynn Miller')
   and lower(coalesce(display_name,'')) = lower('ur dads fav team');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6542694, 'ur dads fav team', 'Brynn Miller', 'https://fantasy.premierleague.com/entry/6542694/event/1', 'Arsenal, Beautiful Men', true,
  842855247474327600, 'Championship', 2, 0, 2,
  '0', '0', '7th - Championship v2', 0, null, 'Your Mom and Dad''s favorite team and favorite manager. Enjoys the beautiful game and the beautiful people playing it. An absolute icon of the game.',
  '/images/managers/brynn.jpg', '/images/dynamic_images/brynn_1.png', '2', 'https://boxd.it/4Ju45'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: brynn-miller
insert into public.manager_alias (slug, manager_id)
values ('brynn-miller', (select id from public.manager where entry_id = 6542694))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: ur-dads-fav-team
insert into public.manager_alias (slug, manager_id)
values ('ur-dads-fav-team', (select id from public.manager where entry_id = 6542694))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6542694);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6542694), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6542694), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6542694), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4319478,
       display_name       = 'something',
       owner_name         = 'Aroon Tcholakov',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4319478/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '0',
       relegations        = ' 0',
       best_finish        = '8th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'The average Bryan Gil enjoyer is said to be 10x smarter than the average FPL player. Do with that as you will.',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Aroon Tcholakov')
   and lower(coalesce(display_name,'')) = lower('something');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4319478, 'something', 'Aroon Tcholakov', 'https://fantasy.premierleague.com/entry/4319478/event/1', 'The Beautiful Game', true,
  null, 'Championship', 1, 0, 1,
  '0', ' 0', '8th - Championship v2', 0, null, 'The average Bryan Gil enjoyer is said to be 10x smarter than the average FPL player. Do with that as you will.',
  null, null, '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: aroon-tcholakov
insert into public.manager_alias (slug, manager_id)
values ('aroon-tcholakov', (select id from public.manager where entry_id = 4319478))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: something
insert into public.manager_alias (slug, manager_id)
values ('something', (select id from public.manager where entry_id = 4319478))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4319478);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4319478), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4319478), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4319478), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5252413,
       display_name       = 'FC Wincinnati',
       owner_name         = 'Alex Quedens',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5252413/event/1',
       favorite_club      = 'FC Cincinnati',
       active             = true,
       discord_id         = 281178038904029200,
       current_league     = 'Championship',
       years_playing      = 2,
       premier_years      = 0,
       championship_years = 2,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '9th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'The champion of a good ol'' office iMessage pong game. His game is said to be so good that there are pundits out there writing haikyus about it.',
       image_url          = '/images/managers/alex.jpg',
       dynamic_image_url  = '/images/dynamic_images/alex.png',
       placements         = '0',
       social_url         = 'https://www.instagram.com/alex.quedens/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Alex Quedens')
   and lower(coalesce(display_name,'')) = lower('FC Wincinnati');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5252413, 'FC Wincinnati', 'Alex Quedens', 'https://fantasy.premierleague.com/entry/5252413/event/1', 'FC Cincinnati', true,
  281178038904029200, 'Championship', 2, 0, 2,
  '0', '0', '9th - Championship v2', 0, null, 'The champion of a good ol'' office iMessage pong game. His game is said to be so good that there are pundits out there writing haikyus about it.',
  '/images/managers/alex.jpg', '/images/dynamic_images/alex.png', '0', 'https://www.instagram.com/alex.quedens/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: alex-quedens
insert into public.manager_alias (slug, manager_id)
values ('alex-quedens', (select id from public.manager where entry_id = 5252413))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: fc-wincinnati
insert into public.manager_alias (slug, manager_id)
values ('fc-wincinnati', (select id from public.manager where entry_id = 5252413))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5252413);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5252413), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5252413), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5252413), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5356734,
       display_name       = 'Soccer Team',
       owner_name         = 'John Saunders',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5356734/event/1',
       favorite_club      = 'Manchester United',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 2,
       premier_years      = 0,
       championship_years = 2,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '10th - Championship v1, v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A very employed manager looks to steady the ship amongst new waters. A beautiful man.',
       image_url          = '/images/managers/john_s.jpg',
       dynamic_image_url  = '/images/dynamic_images/john_s.png',
       placements         = '0',
       social_url         = 'https://on.soundcloud.com/VBhhr4li6uF8T3oGrV',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('John Saunders')
   and lower(coalesce(display_name,'')) = lower('Soccer Team');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5356734, 'Soccer Team', 'John Saunders', 'https://fantasy.premierleague.com/entry/5356734/event/1', 'Manchester United', true,
  null, 'Championship', 2, 0, 2,
  '0', '0', '10th - Championship v1, v2', 0, null, 'A very employed manager looks to steady the ship amongst new waters. A beautiful man.',
  '/images/managers/john_s.jpg', '/images/dynamic_images/john_s.png', '0', 'https://on.soundcloud.com/VBhhr4li6uF8T3oGrV'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: john-saunders
insert into public.manager_alias (slug, manager_id)
values ('john-saunders', (select id from public.manager where entry_id = 5356734))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: soccer-team
insert into public.manager_alias (slug, manager_id)
values ('soccer-team', (select id from public.manager where entry_id = 5356734))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5356734);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5356734), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5356734), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5356734), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = entry_id,
       display_name       = 'Yaikz FC',
       owner_name         = 'Aiko Dzikowski',
       fpl_team_url       = '#',
       favorite_club      = 'Cheeks FC',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '11th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'The crowned Queen of West LA (2023/24) joined to try and win a different type of crown. After a late push, she considers her future with the e-sport. Loves Son joining LAFC.',
       image_url          = '/images/managers/aiko.jpg',
       dynamic_image_url  = '/images/dynamic_images/aiko.png',
       placements         = '0',
       social_url         = 'https://www.instagram.com/aikzz/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Aiko Dzikowski')
   and lower(coalesce(display_name,'')) = lower('Yaikz FC');
-- Insert-if-missing by names (no entry_id)
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
)
select
  null, 'Yaikz FC', 'Aiko Dzikowski', '#', 'Cheeks FC', true,
  null, 'Championship', 1, 0, 1,
  '0', '0', '11th - Championship v2', 0, null, 'The crowned Queen of West LA (2023/24) joined to try and win a different type of crown. After a late push, she considers her future with the e-sport. Loves Son joining LAFC.',
  '/images/managers/aiko.jpg', '/images/dynamic_images/aiko.png', '0', 'https://www.instagram.com/aikzz/'
where not exists (
  select 1 from public.manager
   where lower(coalesce(owner_name,''))   = lower('Aiko Dzikowski')
     and lower(coalesce(display_name,'')) = lower('Yaikz FC')
);
-- alias: aiko-dzikowski
insert into public.manager_alias (slug, manager_id)
values ('aiko-dzikowski', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Aiko Dzikowski') and lower(coalesce(display_name,'')) = lower('Yaikz FC') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: yaikz-fc
insert into public.manager_alias (slug, manager_id)
values ('yaikz-fc', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Aiko Dzikowski') and lower(coalesce(display_name,'')) = lower('Yaikz FC') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Aiko Dzikowski') and lower(coalesce(display_name,'')) = lower('Yaikz FC') order by id desc limit 1);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Aiko Dzikowski') and lower(coalesce(display_name,'')) = lower('Yaikz FC') order by id desc limit 1), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Aiko Dzikowski') and lower(coalesce(display_name,'')) = lower('Yaikz FC') order by id desc limit 1), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Aiko Dzikowski') and lower(coalesce(display_name,'')) = lower('Yaikz FC') order by id desc limit 1), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 5849758,
       display_name       = 'ReecesPieces',
       owner_name         = 'Charlie Mullen',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/5849758/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 4,
       premier_years      = 3,
       championship_years = 1,
       promotions         = '0',
       relegations        = '1',
       best_finish        = null,
       titles             = 0,
       titles_list        = null,
       bio                = 'Charlie is a man on a mission. Supporters around the club continue to believe that he''s the right man for the job to take their beloved club back to the top.',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Charlie Mullen')
   and lower(coalesce(display_name,'')) = lower('ReecesPieces');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  5849758, 'ReecesPieces', 'Charlie Mullen', 'https://fantasy.premierleague.com/entry/5849758/event/1', 'The Beautiful Game', true,
  null, 'Championship', 4, 3, 1,
  '0', '1', null, 0, null, 'Charlie is a man on a mission. Supporters around the club continue to believe that he''s the right man for the job to take their beloved club back to the top.',
  null, null, '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: charlie-mullen
insert into public.manager_alias (slug, manager_id)
values ('charlie-mullen', (select id from public.manager where entry_id = 5849758))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: reecespieces
insert into public.manager_alias (slug, manager_id)
values ('reecespieces', (select id from public.manager where entry_id = 5849758))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 5849758);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5849758), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5849758), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 5849758), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6527451,
       display_name       = 'Cheeks CF',
       owner_name         = 'Tim Davis',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6527451/event/1',
       favorite_club      = 'Cheeks FC',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 3,
       premier_years      = 2,
       championship_years = 1,
       promotions         = '0',
       relegations        = '0',
       best_finish        = 'N/A',
       titles             = 0,
       titles_list        = null,
       bio                = 'After a year long hiatus, the man, the myth, the legend, returned to work his way back up the leagues. We watch his future with great interest.',
       image_url          = '/images/managers/tdjr.jpg',
       dynamic_image_url  = '/images/dynamic_images/tdjr.png',
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Tim Davis')
   and lower(coalesce(display_name,'')) = lower('Cheeks CF');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6527451, 'Cheeks CF', 'Tim Davis', 'https://fantasy.premierleague.com/entry/6527451/event/1', 'Cheeks FC', true,
  null, 'Championship', 3, 2, 1,
  '0', '0', 'N/A', 0, null, 'After a year long hiatus, the man, the myth, the legend, returned to work his way back up the leagues. We watch his future with great interest.',
  '/images/managers/tdjr.jpg', '/images/dynamic_images/tdjr.png', '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: tim-davis
insert into public.manager_alias (slug, manager_id)
values ('tim-davis', (select id from public.manager where entry_id = 6527451))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: cheeks-cf
insert into public.manager_alias (slug, manager_id)
values ('cheeks-cf', (select id from public.manager where entry_id = 6527451))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6527451);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6527451), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6527451), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6527451), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 7977200,
       display_name       = 'Reds_Devils',
       owner_name         = 'Ken Okine',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/7977200/event/1',
       favorite_club      = 'Manchester United',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 4,
       premier_years      = 2,
       championship_years = 2,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = 'Not Last - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'Outspoken and divisive. Some of the first words that come to mind when thinking about Manchester United fans. And of course, that holds true for Will''s older brother. Consistently at the bottom of the table, will this be the year he finally bucks the trend?',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Ken Okine')
   and lower(coalesce(display_name,'')) = lower('Reds_Devils');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  7977200, 'Reds_Devils', 'Ken Okine', 'https://fantasy.premierleague.com/entry/7977200/event/1', 'Manchester United', true,
  null, 'Championship', 4, 2, 2,
  'N', 'A', 'Not Last - Championship v2', 0, null, 'Outspoken and divisive. Some of the first words that come to mind when thinking about Manchester United fans. And of course, that holds true for Will''s older brother. Consistently at the bottom of the table, will this be the year he finally bucks the trend?',
  null, null, '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: ken-okine
insert into public.manager_alias (slug, manager_id)
values ('ken-okine', (select id from public.manager where entry_id = 7977200))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: reds-devils
insert into public.manager_alias (slug, manager_id)
values ('reds-devils', (select id from public.manager where entry_id = 7977200))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 7977200);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7977200), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7977200), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7977200), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 1906849,
       display_name       = 'Artetanyahu',
       owner_name         = 'Ben Josiah',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/1906849/event/1',
       favorite_club      = 'CUP',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '15th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A true student of the game. A master and teacher to the rest of us. Ball knowers always tune in to watch this team play.',
       image_url          = '/images/managers/benji.jpg',
       dynamic_image_url  = '/images/dynamic_images/benji.png',
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Ben Josiah')
   and lower(coalesce(display_name,'')) = lower('Artetanyahu');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  1906849, 'Artetanyahu', 'Ben Josiah', 'https://fantasy.premierleague.com/entry/1906849/event/1', 'CUP', true,
  null, 'Championship', 1, 0, 1,
  '0', '0', '15th - Championship v2', 0, null, 'A true student of the game. A master and teacher to the rest of us. Ball knowers always tune in to watch this team play.',
  '/images/managers/benji.jpg', '/images/dynamic_images/benji.png', '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: ben-josiah
insert into public.manager_alias (slug, manager_id)
values ('ben-josiah', (select id from public.manager where entry_id = 1906849))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: artetanyahu
insert into public.manager_alias (slug, manager_id)
values ('artetanyahu', (select id from public.manager where entry_id = 1906849))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 1906849);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1906849), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1906849), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 1906849), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 7934939,
       display_name       = '2026 Champions',
       owner_name         = 'man guy',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/7934939/event/1',
       favorite_club      = 'Loading...',
       active             = true,
       discord_id         = 1119339824923545700,
       current_league     = 'Championship',
       years_playing      = 1,
       premier_years      = 0,
       championship_years = 1,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '16th - Championship v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A debut season filled with hope turned into one that posed more questions than answers. With the new experiences, one only expects for this legendary man to come back stronger.',
       image_url          = '/images/managers/mac.jpg',
       dynamic_image_url  = '/images/dynamic_images/mac.png',
       placements         = '0',
       social_url         = 'https://www.instagram.com/king_malcolm_/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('man guy')
   and lower(coalesce(display_name,'')) = lower('2026 Champions');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  7934939, '2026 Champions', 'man guy', 'https://fantasy.premierleague.com/entry/7934939/event/1', 'Loading...', true,
  1119339824923545700, 'Championship', 1, 0, 1,
  '0', '0', '16th - Championship v2', 0, null, 'A debut season filled with hope turned into one that posed more questions than answers. With the new experiences, one only expects for this legendary man to come back stronger.',
  '/images/managers/mac.jpg', '/images/dynamic_images/mac.png', '0', 'https://www.instagram.com/king_malcolm_/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: man-guy
insert into public.manager_alias (slug, manager_id)
values ('man-guy', (select id from public.manager where entry_id = 7934939))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: 2026-champions
insert into public.manager_alias (slug, manager_id)
values ('2026-champions', (select id from public.manager where entry_id = 7934939))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 7934939);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7934939), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7934939), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 7934939), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6802392,
       display_name       = 'The Tigers',
       owner_name         = 'Hunter Stemple',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6802392/event/1',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 3,
       premier_years      = 1,
       championship_years = 2,
       promotions         = '0',
       relegations        = '1',
       best_finish        = 'Researching...',
       titles             = 0,
       titles_list        = null,
       bio                = 'Who do you call when you need an emergency GK in a collegiate pickup game? That''s right, this man right here. Reliable as they come.',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Hunter Stemple')
   and lower(coalesce(display_name,'')) = lower('The Tigers');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6802392, 'The Tigers', 'Hunter Stemple', 'https://fantasy.premierleague.com/entry/6802392/event/1', 'The Beautiful Game', true,
  null, 'Championship', 3, 1, 2,
  '0', '1', 'Researching...', 0, null, 'Who do you call when you need an emergency GK in a collegiate pickup game? That''s right, this man right here. Reliable as they come.',
  null, null, '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: hunter-stemple
insert into public.manager_alias (slug, manager_id)
values ('hunter-stemple', (select id from public.manager where entry_id = 6802392))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: the-tigers
insert into public.manager_alias (slug, manager_id)
values ('the-tigers', (select id from public.manager where entry_id = 6802392))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6802392);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6802392), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6802392), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6802392), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4285068,
       display_name       = 'hands',
       owner_name         = 'Casey Manos',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4285068/event/1',
       favorite_club      = 'Loading...',
       active             = true,
       discord_id         = 275736567031529470,
       current_league     = 'Championship',
       years_playing      = 3,
       premier_years      = 0,
       championship_years = 3,
       promotions         = '0',
       relegations        = '0',
       best_finish        = 'N/A',
       titles             = 0,
       titles_list        = null,
       bio                = 'Manos always loads into the season with optimism and assurances that this is the year that he''s figured it out. With that, he''s assured us that this is the year he figures it out.',
       image_url          = '/images/managers/manos.jpg',
       dynamic_image_url  = '/images/dynamic_images/manos.png',
       placements         = null,
       social_url         = 'https://www.instagram.com/caseymanos/',
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Casey Manos')
   and lower(coalesce(display_name,'')) = lower('hands');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4285068, 'hands', 'Casey Manos', 'https://fantasy.premierleague.com/entry/4285068/event/1', 'Loading...', true,
  275736567031529470, 'Championship', 3, 0, 3,
  '0', '0', 'N/A', 0, null, 'Manos always loads into the season with optimism and assurances that this is the year that he''s figured it out. With that, he''s assured us that this is the year he figures it out.',
  '/images/managers/manos.jpg', '/images/dynamic_images/manos.png', null, 'https://www.instagram.com/caseymanos/'
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: casey-manos
insert into public.manager_alias (slug, manager_id)
values ('casey-manos', (select id from public.manager where entry_id = 4285068))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: hands
insert into public.manager_alias (slug, manager_id)
values ('hands', (select id from public.manager where entry_id = 4285068))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4285068);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4285068), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4285068), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4285068), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6812648,
       display_name       = 'Fred''s Red Army☭',
       owner_name         = 'Freddie Wilhelm',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6812648/event/1',
       favorite_club      = 'Manchester United',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 4,
       premier_years      = 2,
       championship_years = 2,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '20th/28 - Premier v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A founder of the game who ranks highest in consistency. Never said to be at the top of the table, but who wants to hangout up there with those pretentious *********?',
       image_url          = '/images/managers/freddie.jpg',
       dynamic_image_url  = '/images/dynamic_images/freddie.png',
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Freddie Wilhelm')
   and lower(coalesce(display_name,'')) = lower('Fred''s Red Army☭');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6812648, 'Fred''s Red Army☭', 'Freddie Wilhelm', 'https://fantasy.premierleague.com/entry/6812648/event/1', 'Manchester United', true,
  null, 'Championship', 4, 2, 2,
  '0', '0', '20th/28 - Premier v2', 0, null, 'A founder of the game who ranks highest in consistency. Never said to be at the top of the table, but who wants to hangout up there with those pretentious *********?',
  '/images/managers/freddie.jpg', '/images/dynamic_images/freddie.png', '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: freddie-wilhelm
insert into public.manager_alias (slug, manager_id)
values ('freddie-wilhelm', (select id from public.manager where entry_id = 6812648))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: fred-s-red-army
insert into public.manager_alias (slug, manager_id)
values ('fred-s-red-army', (select id from public.manager where entry_id = 6812648))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6812648);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6812648), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6812648), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6812648), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = entry_id,
       display_name       = 'west ham sandwich',
       owner_name         = 'Emaly Vatne',
       fpl_team_url       = '#',
       favorite_club      = 'The Beautiful Game',
       active             = true,
       discord_id         = null,
       current_league     = 'Championship',
       years_playing      = 2,
       premier_years      = 1,
       championship_years = 1,
       promotions         = '0',
       relegations        = '1',
       best_finish        = 'N/A',
       titles             = 0,
       titles_list        = null,
       bio                = 'Overqualified when it comes to anything to having to do with us. Biking the world. Ruling analytics. Shoutout Ohio.',
       image_url          = '/images/managers/vat.jpg',
       dynamic_image_url  = '/images/dynamic_images/vat.png',
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Emaly Vatne')
   and lower(coalesce(display_name,'')) = lower('west ham sandwich');
-- Insert-if-missing by names (no entry_id)
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
)
select
  null, 'west ham sandwich', 'Emaly Vatne', '#', 'The Beautiful Game', true,
  null, 'Championship', 2, 1, 1,
  '0', '1', 'N/A', 0, null, 'Overqualified when it comes to anything to having to do with us. Biking the world. Ruling analytics. Shoutout Ohio.',
  '/images/managers/vat.jpg', '/images/dynamic_images/vat.png', '0', null
where not exists (
  select 1 from public.manager
   where lower(coalesce(owner_name,''))   = lower('Emaly Vatne')
     and lower(coalesce(display_name,'')) = lower('west ham sandwich')
);
-- alias: emaly-vatne
insert into public.manager_alias (slug, manager_id)
values ('emaly-vatne', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Emaly Vatne') and lower(coalesce(display_name,'')) = lower('west ham sandwich') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: west-ham-sandwich
insert into public.manager_alias (slug, manager_id)
values ('west-ham-sandwich', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Emaly Vatne') and lower(coalesce(display_name,'')) = lower('west ham sandwich') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Emaly Vatne') and lower(coalesce(display_name,'')) = lower('west ham sandwich') order by id desc limit 1);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Emaly Vatne') and lower(coalesce(display_name,'')) = lower('west ham sandwich') order by id desc limit 1), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Emaly Vatne') and lower(coalesce(display_name,'')) = lower('west ham sandwich') order by id desc limit 1), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('Emaly Vatne') and lower(coalesce(display_name,'')) = lower('west ham sandwich') order by id desc limit 1), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4342758,
       display_name       = 'Lotteries&Liberties',
       owner_name         = 'Behruz Bazarov',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4342758/event/1',
       favorite_club      = 'Marseille',
       active             = true,
       discord_id         = 1140329516527530000,
       current_league     = 'Championship',
       years_playing      = 3,
       premier_years      = 3,
       championship_years = 0,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '3rd - Premier v1',
       titles             = 0,
       titles_list        = null,
       bio                = 'When he speaks, you listen. The manager with the biggest cult following by far. His teams and style have been known to smother opponents. Like Pep, he needed a hiatus before returning to the game.',
       image_url          = '/images/managers/behruz.jpg',
       dynamic_image_url  = '/images/dynamic_images/behruz.png',
       placements         = '2',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Behruz Bazarov')
   and lower(coalesce(display_name,'')) = lower('Lotteries&Liberties');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4342758, 'Lotteries&Liberties', 'Behruz Bazarov', 'https://fantasy.premierleague.com/entry/4342758/event/1', 'Marseille', true,
  1140329516527530000, 'Championship', 3, 3, 0,
  '0', '0', '3rd - Premier v1', 0, null, 'When he speaks, you listen. The manager with the biggest cult following by far. His teams and style have been known to smother opponents. Like Pep, he needed a hiatus before returning to the game.',
  '/images/managers/behruz.jpg', '/images/dynamic_images/behruz.png', '2', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: behruz-bazarov
insert into public.manager_alias (slug, manager_id)
values ('behruz-bazarov', (select id from public.manager where entry_id = 4342758))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: lotteriesandliberties
insert into public.manager_alias (slug, manager_id)
values ('lotteriesandliberties', (select id from public.manager where entry_id = 4342758))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4342758);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4342758), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4342758), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4342758), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = entry_id,
       display_name       = 'Jkells',
       owner_name         = 'JD Keller',
       fpl_team_url       = '#',
       favorite_club      = 'Arsenal',
       active             = true,
       discord_id         = null,
       current_league     = 'Retired',
       years_playing      = 1,
       premier_years      = 1,
       championship_years = 0,
       promotions         = '0',
       relegations        = '0',
       best_finish        = '10th - Premier v2',
       titles             = 0,
       titles_list        = null,
       bio                = 'A man with High/High workrates and a convinction in his takes that is just below that of Gal. A lot of talk came from the man, but after seeing everyone else finish above him, he promptly put down the xG charts and left us waiting for his return.',
       image_url          = '/images/managers/jdk.jpg',
       dynamic_image_url  = '/images/dynamic_images/jdk.png',
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('JD Keller')
   and lower(coalesce(display_name,'')) = lower('Jkells');
-- Insert-if-missing by names (no entry_id)
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
)
select
  null, 'Jkells', 'JD Keller', '#', 'Arsenal', true,
  null, 'Retired', 1, 1, 0,
  '0', '0', '10th - Premier v2', 0, null, 'A man with High/High workrates and a convinction in his takes that is just below that of Gal. A lot of talk came from the man, but after seeing everyone else finish above him, he promptly put down the xG charts and left us waiting for his return.',
  '/images/managers/jdk.jpg', '/images/dynamic_images/jdk.png', '0', null
where not exists (
  select 1 from public.manager
   where lower(coalesce(owner_name,''))   = lower('JD Keller')
     and lower(coalesce(display_name,'')) = lower('Jkells')
);
-- alias: jd-keller
insert into public.manager_alias (slug, manager_id)
values ('jd-keller', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('JD Keller') and lower(coalesce(display_name,'')) = lower('Jkells') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: jkells
insert into public.manager_alias (slug, manager_id)
values ('jkells', (select id from public.manager where lower(coalesce(owner_name,'')) = lower('JD Keller') and lower(coalesce(display_name,'')) = lower('Jkells') order by id desc limit 1))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where lower(coalesce(owner_name,'')) = lower('JD Keller') and lower(coalesce(display_name,'')) = lower('Jkells') order by id desc limit 1);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('JD Keller') and lower(coalesce(display_name,'')) = lower('Jkells') order by id desc limit 1), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('JD Keller') and lower(coalesce(display_name,'')) = lower('Jkells') order by id desc limit 1), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where lower(coalesce(owner_name,'')) = lower('JD Keller') and lower(coalesce(display_name,'')) = lower('Jkells') order by id desc limit 1), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 4483868,
       display_name       = 'I miss jamie vardy',
       owner_name         = 'Brandon Toot',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/4483868/event/1',
       favorite_club      = 'Leicester',
       active             = true,
       discord_id         = 508726063841673200,
       current_league     = 'Joining Championship',
       years_playing      = 0,
       premier_years      = 0,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = 'N/A',
       titles             = 0,
       titles_list        = null,
       bio                = 'After years of convincing, Brandini finally makes his debut in the ultimate Fantasy league. As he mounts his own commish coup in FF, he also awaits big expectations in his debut season in the Championship.',
       image_url          = '/images/managers/brandon.jpg',
       dynamic_image_url  = '/images/dynamic_images/brandon.png',
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Brandon Toot')
   and lower(coalesce(display_name,'')) = lower('I miss jamie vardy');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  4483868, 'I miss jamie vardy', 'Brandon Toot', 'https://fantasy.premierleague.com/entry/4483868/event/1', 'Leicester', true,
  508726063841673200, 'Joining Championship', 0, 0, 0,
  'N', 'A', 'N/A', 0, null, 'After years of convincing, Brandini finally makes his debut in the ultimate Fantasy league. As he mounts his own commish coup in FF, he also awaits big expectations in his debut season in the Championship.',
  '/images/managers/brandon.jpg', '/images/dynamic_images/brandon.png', '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: brandon-toot
insert into public.manager_alias (slug, manager_id)
values ('brandon-toot', (select id from public.manager where entry_id = 4483868))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: i-miss-jamie-vardy
insert into public.manager_alias (slug, manager_id)
values ('i-miss-jamie-vardy', (select id from public.manager where entry_id = 4483868))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 4483868);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4483868), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4483868), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 4483868), 'fa', coalesce(0, 0);
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = 6683423,
       display_name       = 'Shege FC',
       owner_name         = 'Segun Tytler',
       fpl_team_url       = 'https://fantasy.premierleague.com/entry/6683423/event/1',
       favorite_club      = 'Loading...',
       active             = true,
       discord_id         = null,
       current_league     = 'Joining Championship',
       years_playing      = 0,
       premier_years      = 0,
       championship_years = 0,
       promotions         = 'N',
       relegations        = 'A',
       best_finish        = 'N/A',
       titles             = 0,
       titles_list        = null,
       bio                = 'Another Ohio man makes his debut in a much anticipated fashion. Segun comes into the season as a relatively unknown player, but watch out for this manager to make some big waves in what looks to be a crowded field in the Championship.',
       image_url          = null,
       dynamic_image_url  = null,
       placements         = '0',
       social_url         = null,
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('Segun Tytler')
   and lower(coalesce(display_name,'')) = lower('Shege FC');
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  6683423, 'Shege FC', 'Segun Tytler', 'https://fantasy.premierleague.com/entry/6683423/event/1', 'Loading...', true,
  null, 'Joining Championship', 0, 0, 0,
  'N', 'A', 'N/A', 0, null, 'Another Ohio man makes his debut in a much anticipated fashion. Segun comes into the season as a relatively unknown player, but watch out for this manager to make some big waves in what looks to be a crowded field in the Championship.',
  null, null, '0', null
)
on conflict (entry_id) do update set
  display_name       = excluded.display_name,
  owner_name         = excluded.owner_name,
  fpl_team_url       = excluded.fpl_team_url,
  favorite_club      = excluded.favorite_club,
  active             = excluded.active,
  discord_id         = excluded.discord_id,
  current_league     = excluded.current_league,
  years_playing      = excluded.years_playing,
  premier_years      = excluded.premier_years,
  championship_years = excluded.championship_years,
  promotions         = excluded.promotions,
  relegations        = excluded.relegations,
  best_finish        = excluded.best_finish,
  titles             = excluded.titles,
  titles_list        = excluded.titles_list,
  bio                = excluded.bio,
  image_url          = excluded.image_url,
  dynamic_image_url  = excluded.dynamic_image_url,
  placements         = excluded.placements,
  social_url         = excluded.social_url,
  updated_at         = now();
-- alias: segun-tytler
insert into public.manager_alias (slug, manager_id)
values ('segun-tytler', (select id from public.manager where entry_id = 6683423))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- alias: shege-fc
insert into public.manager_alias (slug, manager_id)
values ('shege-fc', (select id from public.manager where entry_id = 6683423))
on conflict (slug) do update set manager_id = excluded.manager_id;
-- trophies refresh
delete from public.manager_trophy where manager_id = (select id from public.manager where entry_id = 6683423);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6683423), 'premier', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6683423), 'championship', coalesce(0, 0);
insert into public.manager_trophy (manager_id, type, count)
select (select id from public.manager where entry_id = 6683423), 'fa', coalesce(0, 0);
