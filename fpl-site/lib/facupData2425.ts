// Static bracket data for the 2024-25 FA Cup (v1)
// Source: Challonge bracket https://challonge.com/tfplfacup

export interface Seed2425 {
  seed: number;
  team: string;
  owner: string;
}

export interface Match2425 {
  seed1: number; team1: string; owner1: string; score1: number;
  seed2: number; team2: string; owner2: string; score2: number;
  tiebreaker?: boolean; // score decided by goals tiebreaker
}

export const SEEDS_2425: Seed2425[] = [
  { seed: 1,  team: "Kobbie's Kids",         owner: "Marvin Ling" },
  { seed: 2,  team: "smith rowe_v_wade",      owner: "Hanson Xia" },
  { seed: 3,  team: "Cech Mate",              owner: "Tyler Neal" },
  { seed: 4,  team: "Turkish Hairlines",      owner: "Avi Kumar" },
  { seed: 5,  team: "TylerQ",                 owner: "Tyler Quedens" },
  { seed: 6,  team: "fc havertz",             owner: "Joel Mathew" },
  { seed: 7,  team: "Bryan Gil FC",           owner: "Aroon Tcholakov" },
  { seed: 8,  team: "Slot's Tots",            owner: "Julian Tarazi" },
  { seed: 9,  team: "Rolls Rice",             owner: "Zoha Khan" },
  { seed: 10, team: "Arnold Palmer FC",       owner: "Seth Gerus" },
  { seed: 11, team: "Change Name",            owner: "Brynn Miller" },
  { seed: 12, team: "Heskey Time",            owner: "Kamil Sacha" },
  { seed: 13, team: "Archie Come Home",       owner: "Aj Pepperney" },
  { seed: 14, team: "Cheeks FC",              owner: "Rehan Khan" },
  { seed: 15, team: "Peps Lads",              owner: "Linden Eberle" },
  { seed: 16, team: "Siuuuuuu Later",         owner: "Ryan Gallagher" },
  { seed: 17, team: "ReecesPieces",           owner: "Charlie Mullen" },
  { seed: 18, team: "Eze Come Eze Go",        owner: "James Giles" },
  { seed: 19, team: "Project Mbappe",         owner: "Tim Davis" },
  { seed: 20, team: "Carter's Angels",        owner: "Carter WitmerGautsch" },
  { seed: 21, team: "FC Wincinnati",          owner: "Alex Quedens" },
  { seed: 22, team: "Vardy Party",            owner: "Chandler Ashman" },
  { seed: 23, team: "My team man guy",        owner: "" },
  { seed: 24, team: "AshiSaka",               owner: "Derek Huddleston" },
  { seed: 25, team: "Yaikz FC",               owner: "Aiko Dzikowski" },
  { seed: 26, team: "SecondPlaceBelow",       owner: "William Okine" },
  { seed: 27, team: "Unemployed FC",          owner: "John Saunders" },
  { seed: 28, team: "Kai me a river",         owner: "JD Garcia" },
  { seed: 29, team: "Reds_go_marching_on",    owner: "Ken Okine" },
  { seed: 30, team: "Sham Wow Guy",           owner: "Will Franzoni" },
  { seed: 31, team: "lebron",                 owner: "Ben Josiah" },
  { seed: 32, team: "wizards",                owner: "Aaron Frank" },
  { seed: 33, team: "The Tigers",             owner: "Hunter Stemple" },
  { seed: 34, team: "Slopeds",                owner: "Michael Giles" },
  { seed: 35, team: "Manos",                  owner: "Casey Manos" },
  { seed: 36, team: "Aches and Pains",        owner: "Imran Khan" },
  { seed: 37, team: "west ham sandwich",      owner: "Emaly Vatne" },
  { seed: 38, team: "haaland is washed",      owner: "Logan Roth" },
  { seed: 39, team: "21iscoming",             owner: "Freddie Wilhelm" },
  // seed 40 did not participate
];

// Helper to look up a seed from the list
const s = (n: number): Seed2425 =>
  SEEDS_2425.find(x => x.seed === n) ?? { seed: n, team: `Seed ${n}`, owner: "" };

function m(
  seed1: number, score1: number,
  seed2: number, score2: number,
  tiebreaker = false,
): Match2425 {
  const a = s(seed1), b = s(seed2);
  return { seed1, team1: a.team, owner1: a.owner, score1,
           seed2, team2: b.team, owner2: b.owner, score2,
           ...(tiebreaker ? { tiebreaker: true } : {}) };
}

// winner is always the first entry (seed1) unless score2 > score1
export const ROUNDS_2425: Record<string, Match2425[]> = {
  // 7 preliminary matches — seeds 26-39 (seed 40 absent)
  r1: [
    m(33, 57, 32, 53),
    m(36, 54, 29, 29),
    m(28, 71, 37, 39),
    m(31, 53, 34, 48),
    m(26, 42, 39, 28),
    m(30, 60, 35, 39),
    m(27, 59, 38, 42),
  ],
  // Round of 32 — 16 matches (seeds 1-25 + 7 R1 winners)
  r32: [
    m(16, 44, 17, 32),
    m(25, 54,  8, 49),
    m( 9, 62, 24, 41),
    m(13, 92, 20, 43),
    m(12, 44, 21, 28),
    m(18, 50, 15, 44),
    m(10, 35, 23, 27),
    m(19, 57, 14, 48),
    m(22, 45, 11, 42),
    m(33, 70,  1, 47),
    m(36, 47,  4, 46),
    m(28, 57,  5, 49),
    m( 2, 51, 31, 46),
    m( 7, 36, 26, 34),
    m( 3, 44, 30, 38),
    m(27, 51,  6, 43),
  ],
  // Round of 16 — 8 matches
  r16: [
    m( 9, 62, 25, 56),
    m(16, 77, 33, 48),
    m(36, 57, 13, 50),
    m(28, 83, 12, 68),
    m(18, 66,  2, 50),
    m(10, 73,  7, 49),
    m(19, 69,  3, 67),
    m(22,  1, 27,  0, true),
  ],
  // Quarterfinals
  qf: [
    m(16,   1,  9,  0, true),
    m(36, 140, 28, 95),
    m(10, 141, 18, 106),
    m(22, 131, 19, 67),
  ],
  // Semifinals
  sf: [
    m(36, 99, 16, 77),
    m(22, 94, 10, 87),
  ],
  // Final
  final: [
    m(22, 100, 36, 68),
  ],
  // 3rd place
  third: [
    m(16, 88, 10, 87),
  ],
};

export const PODIUM_2425 = {
  champion:  { seed: 22, team: "Vardy Party",      owner: "Chandler Ashman" },
  runnerUp:  { seed: 36, team: "Aches and Pains",  owner: "Imran Khan" },
  third:     { seed: 16, team: "Siuuuuuu Later",   owner: "Ryan Gallagher" },
};
