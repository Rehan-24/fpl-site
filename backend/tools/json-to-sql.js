// backend/tools/json-to-sql.js
// Usage: node tools/json-to-sql.js   --> produces seed.sql to run in Supabase SQL Editor

const fs = require("fs");
const path = require("path");

// --- helpers ---
const q = (s) => String(s ?? "").replace(/'/g, "''");
const lit = (v) => (v === null || v === undefined || v === "" ? "null" : `'${q(v)}'`);
const intOrNull = (v) => (v === null || v === undefined || v === "" ? "null" : Number.isFinite(+v) ? String(+v) : "null");

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractEntryId(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/\/entry\/(\d+)\//) || url.match(/\/entry\/(\d+)(?:$|[^0-9])/);
  return m ? parseInt(m[1], 10) : null;
}

// --- load JSON ---
const jsonPath = path.join(process.cwd(), "data", "managers.json");
const raw = fs.readFileSync(jsonPath, "utf8");
const rows = JSON.parse(raw);

// --- build SQL ---
const stmts = [];

stmts.push(`-- Generated ${new Date().toISOString()}`);

for (const m of rows) {
  const ownerName    = (m.name ?? "").trim();
  const displayName  = (m.team ?? ownerName).trim();
  const fplUrl       = (m.fpl_team_url ?? "").trim();
  const entryId      = extractEntryId(fplUrl); // may be null

  // other fields
  const discord_id         = m.discord_id === "" || m.discord_id == null ? "null" : String(m.discord_id);
  const current_league     = lit(m.current_league);
  const years_playing      = intOrNull(m.years_playing);
  const premier_years      = intOrNull(m.premier_years);
  const championship_years = intOrNull(m.championship_years);
  const promotions         = lit(m.promotions);
  const relegations        = lit(m.relegations);
  const best_finish        = lit(m.best_finish);
  const titles             = intOrNull(m.titles);
  const titles_list        = lit(m.titles_list);
  const bio                = lit(m.bio);
  const image_url          = lit(m.image_url);
  const dynamic_image_url  = lit(m.dynamic_image_url);
  const placements         = lit(m.placements);
  const social_url         = lit(m.social_url);
  const favorite_club      = lit(m.favorite_club);
  const active             = "true";

  // Update by names (case-insensitive)
  stmts.push(`
-- Upsert-by-names (case-insensitive update)
update public.manager
   set entry_id           = ${entryId === null ? "entry_id" : entryId},
       display_name       = '${q(displayName)}',
       owner_name         = '${q(ownerName)}',
       fpl_team_url       = ${fplUrl ? `'${q(fplUrl)}'` : "null"},
       favorite_club      = ${favorite_club},
       active             = ${active},
       discord_id         = ${discord_id},
       current_league     = ${current_league},
       years_playing      = ${years_playing},
       premier_years      = ${premier_years},
       championship_years = ${championship_years},
       promotions         = ${promotions},
       relegations        = ${relegations},
       best_finish        = ${best_finish},
       titles             = ${titles},
       titles_list        = ${titles_list},
       bio                = ${bio},
       image_url          = ${image_url},
       dynamic_image_url  = ${dynamic_image_url},
       placements         = ${placements},
       social_url         = ${social_url},
       updated_at         = now()
 where lower(coalesce(owner_name,''))   = lower('${q(ownerName)}')
   and lower(coalesce(display_name,'')) = lower('${q(displayName)}');
`.trim());

  // Insert paths
  if (entryId !== null) {
    stmts.push(`
-- Insert/merge by entry_id
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
) values (
  ${entryId}, '${q(displayName)}', '${q(ownerName)}', ${fplUrl ? `'${q(fplUrl)}'` : "null"}, ${favorite_club}, ${active},
  ${discord_id}, ${current_league}, ${years_playing}, ${premier_years}, ${championship_years},
  ${promotions}, ${relegations}, ${best_finish}, ${titles}, ${titles_list}, ${bio},
  ${image_url}, ${dynamic_image_url}, ${placements}, ${social_url}
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
`.trim());
  } else {
    stmts.push(`
-- Insert-if-missing by names (no entry_id)
insert into public.manager (
  entry_id, display_name, owner_name, fpl_team_url, favorite_club, active,
  discord_id, current_league, years_playing, premier_years, championship_years,
  promotions, relegations, best_finish, titles, titles_list, bio,
  image_url, dynamic_image_url, placements, social_url
)
select
  null, '${q(displayName)}', '${q(ownerName)}', ${fplUrl ? `'${q(fplUrl)}'` : "null"}, ${favorite_club}, ${active},
  ${discord_id}, ${current_league}, ${years_playing}, ${premier_years}, ${championship_years},
  ${promotions}, ${relegations}, ${best_finish}, ${titles}, ${titles_list}, ${bio},
  ${image_url}, ${dynamic_image_url}, ${placements}, ${social_url}
where not exists (
  select 1 from public.manager
   where lower(coalesce(owner_name,''))   = lower('${q(ownerName)}')
     and lower(coalesce(display_name,'')) = lower('${q(displayName)}')
);
`.trim());
  }

  // Subselect to fetch manager.id
  const manager_idSub =
    entryId !== null
      ? `(select id from public.manager where entry_id = ${entryId})`
      : `(select id from public.manager where lower(coalesce(owner_name,'')) = lower('${q(ownerName)}') and lower(coalesce(display_name,'')) = lower('${q(displayName)}') order by id desc limit 1)`;

  // Aliases (FIXED: interpolate slug + subselect)
  const aliasCandidates = [slugify(ownerName), slugify(displayName)]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  for (const slug of aliasCandidates) {
    stmts.push(`
-- alias: ${slug}
insert into public.manager_alias (slug, manager_id)
values ('${q(slug)}', ${manager_idSub})
on conflict (slug) do update set manager_id = excluded.manager_id;
`.trim());
  }

  // Trophies (refresh)
  const trophies = Array.isArray(m.trophies) ? m.trophies : [];
  stmts.push(`
-- trophies refresh
delete from public.manager_trophy where manager_id = ${manager_idSub};
`.trim());

  for (const t of trophies) {
    const type = lit(t?.type);
    const count = intOrNull(t?.count);
    stmts.push(`
insert into public.manager_trophy (manager_id, type, count)
select ${manager_idSub}, ${type}, coalesce(${count}, 0);
`.trim());
  }
}

// write to file
const outPath = path.join(process.cwd(), "seed.sql");
fs.writeFileSync(outPath, stmts.join("\n") + "\n");
console.log(`Wrote ${outPath}`);
