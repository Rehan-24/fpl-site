// lib/facupSeedings.ts
// 2025/26 FA Cup seedings — 40 players
// Structure:
//   Round 1  : seeds 33-40 (4 matches: 33v40, 34v39, 35v38, 36v37)
//   Round of 32: seeds 1-4 enter vs R1 winners; seeds 5-32 play (5v32, 6v31 … 18v19)
//   Round of 16 → QF → SF → Finals Week (Final + 3rd Place)

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
  { seed: 1,  team: "Klopp's Resurgence",  owner: "Chanse Ashman",         league: "prem",  score: 1771, reason: "FA Cup Winner",              fplUrl: "https://fantasy.premierleague.com/entry/6679946/event/31" },
  { seed: 2,  team: "Cheeks FC",            owner: "Rehan Khan",            league: "prem",  score: 1740, reason: "Premier League Winner",       fplUrl: "https://fantasy.premierleague.com/entry/3577847/event/31" },
  { seed: 3,  team: "Cincy Til I Cry",      owner: "Tyler Quedens",         league: "champ", score: 1695, reason: "Championship Winner",         fplUrl: "https://fantasy.premierleague.com/entry/4141448/event/31" },
  { seed: 4,  team: "FC Wincinnati",        owner: "Alex Quedens",          league: "champ", score: 1753, reason: "Highest Champ Scorer",        fplUrl: "https://fantasy.premierleague.com/entry/5252413/event/31" },
  { seed: 5,  team: "Noni to be upset",     owner: "Joel Matthew",          league: "prem",  score: 1825, reason: "Highest Prem Scorer",         fplUrl: "https://fantasy.premierleague.com/entry/4087698/event/31" },
  { seed: 6,  team: "Shege FC",             owner: "Segun Tytler",          league: "champ", score: 1713, reason: "2nd Highest Champ",           fplUrl: "https://fantasy.premierleague.com/entry/6683423/event/31" },
  { seed: 7,  team: "Slopeds FC",           owner: "Michael Giles",         league: "prem",  score: 1812, reason: "2nd Highest Prem",            fplUrl: "https://fantasy.premierleague.com/entry/1520141/event/31" },
  { seed: 8,  team: "wizards",              owner: "Aaron Frank",           league: "champ", score: 1692, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/7349746/event/31" },
  { seed: 9,  team: "Bend It Like Declan",  owner: "Derek Huddleston",      league: "prem",  score: 1761, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/1270351/event/31" },
  { seed: 10, team: "Beans and Rice",       owner: "Will Franzoni",         league: "champ", score: 1670, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/5596813/event/31" },
  { seed: 11, team: "Too Slot To Handle",   owner: "Julian Tarazi",         league: "prem",  score: 1733, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/5361599/event/31" },
  { seed: 12, team: "ReecesPieces",         owner: "Charlie Mullen",        league: "champ", score: 1648, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/5849758/event/31" },
  { seed: 13, team: "Defense and DarkArts", owner: "Avi Kumar",             league: "prem",  score: 1695, reason: "… Prem",                      fplUrl: null },
  { seed: 14, team: "I miss jamie vardy",   owner: "Brandon Toot",          league: "champ", score: 1629, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/4483868/event/31" },
  { seed: 15, team: "Siuuuuu Later",        owner: "Ryan Gallagher",        league: "prem",  score: 1690, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/5066840/event/31" },
  { seed: 16, team: "2026 Champions",       owner: "Malcolm / Man Guy",     league: "champ", score: 1604, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/7934939/event/31" },
  { seed: 17, team: "Carter's Angels",      owner: "Carter Witmer Gautsch", league: "prem",  score: 1679, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/617475/event/31"  },
  { seed: 18, team: "Artetanyahu",          owner: "Ben Josiah",            league: "champ", score: 1599, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/1906849/event/31" },
  { seed: 19, team: "Cech Mate",            owner: "Tyler Neal",            league: "prem",  score: 1675, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/4350516/event/31" },
  { seed: 20, team: "FirstPlaceBelow",      owner: "William Okine",         league: "champ", score: 1583, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/6197359/event/31" },
  { seed: 21, team: "Peaky Reijnders",      owner: "Marvin Ling",           league: "prem",  score: 1645, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/3239682/event/31" },
  { seed: 22, team: "Liberties&Lotteries",  owner: "Behruz Bazarov",        league: "champ", score: 1563, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/4342758/event/31" },
  { seed: 23, team: "Peps Lads",            owner: "Linden Eberle",         league: "prem",  score: 1627, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/4690925/event/31" },
  { seed: 24, team: "somethimg",            owner: "Aroon Tcholakov",       league: "champ", score: 1555, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/4319478/event/31" },
  { seed: 25, team: "lamine yamal party",   owner: "Hanson Xia",            league: "prem",  score: 1627, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/5466499/event/31" },
  { seed: 26, team: "Rolls Rice",           owner: "Zoha Khan",             league: "champ", score: 1536, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/4080174/event/31" },
  { seed: 27, team: "Eze Dub",              owner: "Seth Gerus",            league: "prem",  score: 1625, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/4137251/event/31" },
  { seed: 28, team: "The Tigers",           owner: "Hunter Stemple",        league: "champ", score: 1526, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/6802392/event/31" },
  { seed: 29, team: "Boogie Woogie",        owner: "Jimmy Giles",           league: "prem",  score: 1613, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/1512563/event/31" },
  { seed: 30, team: "halaand is washed",    owner: "Logan Roth",            league: "champ", score: 1508, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/6921329/event/31" },
  { seed: 31, team: "Aches and Pains",      owner: "Imran Khan",            league: "prem",  score: 1566, reason: "… Prem",                      fplUrl: "https://fantasy.premierleague.com/entry/7937084/event/31" },
  { seed: 32, team: "Fred's Red Army",      owner: "Freddie Wilhelm",       league: "champ", score: 1496, reason: "… Champ",                     fplUrl: "https://fantasy.premierleague.com/entry/6812648/event/31" },
  { seed: 33, team: "Bamford's Baddies",    owner: "AJ Pepperney",          league: "prem",  score: 1553, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/5130249/event/31" },
  { seed: 34, team: "livin saliba loca",    owner: "JD Garcia",             league: "prem",  score: 1531, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/4286391/event/31" },
  { seed: 35, team: "hands",                owner: "Casey Manos",           league: "champ", score: 1462, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/4285068/event/31" },
  { seed: 36, team: "ur dads fav team",     owner: "Brynn Miller",          league: "champ", score: 1446, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/6542694/event/31" },
  { seed: 37, team: "Mandem FC",            owner: "Kamil Sacha",           league: "champ", score: 1421, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/4088389/event/31" },
  { seed: 38, team: "Cheeks Fc",            owner: "Tim Davis",             league: "prem",  score: 1331, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/6527451/event/31" },
  { seed: 39, team: "Soccer Team",          owner: "John Saunders",         league: "prem",  score: 1247, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/5356734/event/31" },
  { seed: 40, team: "Red_Devils",           owner: "Ken Okine",             league: "champ", score: 1223, reason: "Remaining (by score)",         fplUrl: "https://fantasy.premierleague.com/entry/7977200/event/31" },
];

// R1 matchups: seeds 33-40 → 4 matches
export const R1_MATCHUPS: [number, number][] = [
  [33, 40],
  [34, 39],
  [35, 38],
  [36, 37],
];

// R32 matchups for seeds 5-32
export const R32_MATCHUPS: [number, number][] = [
  [5, 32], [6, 31], [7, 30], [8, 29],
  [9, 28], [10, 27], [11, 26], [12, 25],
  [13, 24], [14, 23], [15, 22], [16, 21],
  [17, 20], [18, 19],
];

// Seeds 1-4 get byes into R32, facing R1 winners in order
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
