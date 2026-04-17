// lib/facupSeedings.ts
// 2025/26 FA Cup seedings — 40 players
//
// Structure:
//   Round 1  (GW31): seeds 33-40, 4 matches
//     M1: 33v40  M2: 34v39  M3: 35v38  M4: 36v37
//
//   Round of 32 (GW32): 16 matchups, proper seeded bracket
//   Quadrant 1 → QF1 → SF1:  slots 0-3
//   Quadrant 2 → QF2 → SF1:  slots 4-7
//   Quadrant 3 → QF3 → SF2:  slots 8-11
//   Quadrant 4 → QF4 → SF2:  slots 12-15
//
//   Best-case path: 1v2 only in Final, 1/4 and 2/3 only in SF

export type League = "prem" | "champ";

export interface Seed {
  seed: number;
  team: string;
  owner: string;
  league: League;
  score: number;
  reason: string;
  fplUrl: string | null;
}

export const SEEDS: Seed[] = [
  { seed: 1,  team: "Klopp's Resurgence",  owner: "Chanse Ashman",         league: "prem",  score: 1771, reason: "FA Cup Winner",          fplUrl: "https://fantasy.premierleague.com/entry/6679946" },
  { seed: 2,  team: "Cheeks FC",            owner: "Rehan Khan",            league: "prem",  score: 1740, reason: "Premier League Winner",   fplUrl: "https://fantasy.premierleague.com/entry/3577847" },
  { seed: 3,  team: "Cincy Til I Cry",      owner: "Tyler Quedens",         league: "prem", score: 1695, reason: "Championship Winner",     fplUrl: "https://fantasy.premierleague.com/entry/4141448" },
  { seed: 4,  team: "FC Wincinnati",        owner: "Alex Quedens",          league: "champ", score: 1753, reason: "Highest Champ Scorer",    fplUrl: "https://fantasy.premierleague.com/entry/5252413" },
  { seed: 5,  team: "Noni to be upset",     owner: "Joel Matthew",          league: "prem",  score: 1825, reason: "Highest Prem Scorer",     fplUrl: "https://fantasy.premierleague.com/entry/4087698" },
  { seed: 6,  team: "Shege FC",             owner: "Segun Tytler",          league: "champ", score: 1713, reason: "2nd Highest Champ",       fplUrl: "https://fantasy.premierleague.com/entry/6683423" },
  { seed: 7,  team: "Slopeds FC",           owner: "Michael Giles",         league: "prem",  score: 1812, reason: "2nd Highest Prem",        fplUrl: "https://fantasy.premierleague.com/entry/1520141" },
  { seed: 8,  team: "wizards",              owner: "Aaron Frank",           league: "champ", score: 1692, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/7349746" },
  { seed: 9,  team: "Bend It Like Declan",  owner: "Derek Huddleston",      league: "prem",  score: 1761, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/1270351" },
  { seed: 10, team: "Beans and Rice",       owner: "Will Franzoni",         league: "champ", score: 1670, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/5596813" },
  { seed: 11, team: "Too Slot To Handle",   owner: "Julian Tarazi",         league: "prem",  score: 1733, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/5361599" },
  { seed: 12, team: "ReecesPieces",         owner: "Charlie Mullen",        league: "champ", score: 1648, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/5849758" },
  { seed: 13, team: "Defense and DarkArts", owner: "Avi Kumar",             league: "prem",  score: 1695, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/6790800" },
  { seed: 14, team: "I miss jamie vardy",   owner: "Brandon Toot",          league: "champ", score: 1629, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/4483868" },
  { seed: 15, team: "Siuuuuu Later",        owner: "Ryan Gallagher",        league: "prem",  score: 1690, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/5066840" },
  { seed: 16, team: "2026 Champions",       owner: "Malcolm / Man Guy",     league: "champ", score: 1604, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/7934939" },
  { seed: 17, team: "Carter's Angels",      owner: "Carter Witmer Gautsch", league: "prem",  score: 1679, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/617475"  },
  { seed: 18, team: "Artetanyahu",          owner: "Ben Josiah",            league: "champ", score: 1599, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/1906849" },
  { seed: 19, team: "Cech Mate",            owner: "Tyler Neal",            league: "prem",  score: 1675, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/4350516" },
  { seed: 20, team: "FirstPlaceBelow",      owner: "William Okine",         league: "champ", score: 1583, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/6197359" },
  { seed: 21, team: "Peaky Reijnders",      owner: "Marvin Ling",           league: "prem",  score: 1645, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/3239682" },
  { seed: 22, team: "Liberties&Lotteries",  owner: "Behruz Bazarov",        league: "champ", score: 1563, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/4342758" },
  { seed: 23, team: "Peps Lads",            owner: "Linden Eberle",         league: "prem",  score: 1627, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/4690925" },
  { seed: 24, team: "somethimg",            owner: "Aroon Tcholakov",       league: "champ", score: 1555, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/4319478" },
  { seed: 25, team: "lamine yamal party",   owner: "Hanson Xia",            league: "prem",  score: 1627, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/5466499" },
  { seed: 26, team: "Rolls Rice",           owner: "Zoha Khan",             league: "champ", score: 1536, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/4080174" },
  { seed: 27, team: "Eze Dub",              owner: "Seth Gerus",            league: "prem",  score: 1625, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/4137251" },
  { seed: 28, team: "The Tigers",           owner: "Hunter Stemple",        league: "champ", score: 1526, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/6802392" },
  { seed: 29, team: "Boogie Woogie",        owner: "Jimmy Giles",           league: "prem",  score: 1613, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/1512563" },
  { seed: 30, team: "halaand is washed",    owner: "Logan Roth",            league: "champ", score: 1508, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/6921329" },
  { seed: 31, team: "Aches and Pains",      owner: "Imran Khan",            league: "prem",  score: 1566, reason: "… Prem",                  fplUrl: "https://fantasy.premierleague.com/entry/7937084" },
  { seed: 32, team: "Fred's Red Army",      owner: "Freddie Wilhelm",       league: "champ", score: 1496, reason: "… Champ",                 fplUrl: "https://fantasy.premierleague.com/entry/6812648" },
  { seed: 33, team: "Bamford's Baddies",    owner: "AJ Pepperney",          league: "prem",  score: 1553, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/5130249" },
  { seed: 34, team: "livin saliba loca",    owner: "JD Garcia",             league: "prem",  score: 1531, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/4286391" },
  { seed: 35, team: "hands",                owner: "Casey Manos",           league: "champ", score: 1462, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/4285068" },
  { seed: 36, team: "ur dads fav team",     owner: "Brynn Miller",          league: "champ", score: 1446, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/6542694" },
  { seed: 37, team: "Mandem FC",            owner: "Kamil Sacha",           league: "prem", score: 1421, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/4088389" },
  { seed: 38, team: "Cheeks Fc",            owner: "Tim Davis",             league: "champ",  score: 1331, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/6527451" },
  { seed: 39, team: "Soccer Team",          owner: "John Saunders",         league: "champ",  score: 1247, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/5356734" },
  { seed: 40, team: "Red_Devils",           owner: "Ken Okine",             league: "champ", score: 1223, reason: "Remaining (by score)",    fplUrl: "https://fantasy.premierleague.com/entry/7977200" },
];

// ── Round 1 matchups (GW31): seeds 25-40, 8 matches ──────────────────────────
// Bottom 16 seeds play in — winners feed into R32 as seed2 opponents for seeds 1-8
export const R1_MATCHUPS: [number, number][] = [
  [25, 40],  // M1 → winner faces seed 8  (R32 slot 3)
  [26, 39],  // M2 → winner faces seed 7  (R32 slot 12)
  [27, 38],  // M3 → winner faces seed 6  (R32 slot 11)
  [28, 37],  // M4 → winner faces seed 5  (R32 slot 4)
  [29, 36],  // M5 → winner faces seed 4  (R32 slot 7)
  [30, 35],  // M6 → winner faces seed 3  (R32 slot 8)
  [31, 34],  // M7 → winner faces seed 2  (R32 slot 15)
  [32, 33],  // M8 → winner faces seed 1  (R32 slot 0)
];

// ── Round of 32 matchups (GW32): proper seeded bracket ───────────────────────
//
// 16 slots ordered top→bottom across 4 quadrants:
//   Q1 (slots 0-3)  → QF1 → SF1   best-case: seed 1 path
//   Q2 (slots 4-7)  → QF2 → SF1   best-case: seed 4/5 path
//   Q3 (slots 8-11) → QF3 → SF2   best-case: seed 3 path
//   Q4 (slots 12-15)→ QF4 → SF2   best-case: seed 2 path
//
// null = opponent is a R1 winner (TBD until R1 completes)
// [seed1, seed2 | null, r1MatchLabel]
export interface R32Slot {
  seed1: number;
  seed2: number | null;       // null = TBD (R1 winner)
  r1Label: string | null;     // e.g. "M8" shown as "W M8" FIFA-style
}

export const R32_SLOTS: R32Slot[] = [
  // Quadrant 1
  { seed1: 1,  seed2: null, r1Label: "M8" },  // slot 0  — seed 1 vs W(M8: 32v33)
  { seed1: 9,  seed2: 24,   r1Label: null },  // slot 1
  { seed1: 16, seed2: 17,   r1Label: null },  // slot 2
  { seed1: 8,  seed2: null, r1Label: "M1" },  // slot 3  — seed 8 vs W(M1: 25v40)
  // Quadrant 2
  { seed1: 5,  seed2: null, r1Label: "M4" },  // slot 4  — seed 5 vs W(M4: 28v37)
  { seed1: 13, seed2: 20,   r1Label: null },  // slot 5
  { seed1: 12, seed2: 21,   r1Label: null },  // slot 6
  { seed1: 4,  seed2: null, r1Label: "M5" },  // slot 7  — seed 4 vs W(M5: 29v36)
  // Quadrant 3
  { seed1: 3,  seed2: null, r1Label: "M6" },  // slot 8  — seed 3 vs W(M6: 30v35)
  { seed1: 11, seed2: 22,   r1Label: null },  // slot 9
  { seed1: 14, seed2: 19,   r1Label: null },  // slot 10
  { seed1: 6,  seed2: null, r1Label: "M3" },  // slot 11 — seed 6 vs W(M3: 27v38)
  // Quadrant 4
  { seed1: 7,  seed2: null, r1Label: "M2" },  // slot 12 — seed 7 vs W(M2: 26v39)
  { seed1: 10, seed2: 23,   r1Label: null },  // slot 13
  { seed1: 15, seed2: 18,   r1Label: null },  // slot 14
  { seed1: 2,  seed2: null, r1Label: "M7" },  // slot 15 — seed 2 vs W(M7: 31v34)
];

// Keep old export for any references that use it
export const R32_MATCHUPS: [number, number | null][] = R32_SLOTS.map(
  s => [s.seed1, s.seed2]
);

// No longer used as a separate list — byes are embedded in R32_SLOTS
export const BYE_SEEDS = [1, 2, 3, 4];

// Tournament GW schedule
export const ROUND_GWS: Record<string, number> = {
  r1:    31,
  r32:   32,
  r16:   33,
  qf:    34,
  sf:    35,
  final: 36,
};
