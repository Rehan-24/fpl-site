// lib/facupData2526.ts
// Static bracket data for the 2025-26 FA Cup (v2)
// Source: scraped from /api/facup/bracket?season=2025-26

import { SEEDS } from "./facupSeedings";

export interface Match2526 {
  seed1: number; team1: string; owner1: string; score1: number;
  seed2: number; team2: string; owner2: string; score2: number;
  tiebreaker?: boolean;
}

const s = (n: number) =>
  SEEDS.find(x => x.seed === n) ?? { seed: n, team: `Seed ${n}`, owner: "" };

function m(
  seed1: number, score1: number,
  seed2: number, score2: number,
  tiebreaker = false,
): Match2526 {
  const a = s(seed1), b = s(seed2);
  return { seed1, team1: a.team, owner1: a.owner, score1,
           seed2, team2: b.team, owner2: b.owner, score2,
           ...(tiebreaker ? { tiebreaker: true } : {}) };
}

// winner is determined by: score1 >= score2 → seed1 wins, otherwise seed2 wins
export const ROUNDS_2526: Record<string, Match2526[]> = {
  // Round 1 (GW31) — seeds 25-40, 8 matches
  r1: [
    m(25, 61, 40, 10),  // 25 wins
    m(26, 17, 39, 65),  // 39 wins
    m(27, 62, 38, 14),  // 27 wins
    m(28, 41, 37, 35),  // 28 wins
    m(29, 64, 36, 54),  // 29 wins
    m(30, 39, 35, 28),  // 30 wins
    m(31, 36, 34, 44),  // 34 wins
    m(32, 40, 33, 63),  // 33 wins
  ],
  // Round of 32 (GW32) — 16 matches
  r32: [
    m( 1, 53, 33, 39),  //  1 wins
    m( 9, 48, 24, 56),  // 24 wins
    m(16, 49, 17, 52),  // 17 wins
    m( 8, 64, 25, 58),  //  8 wins
    m( 5, 55, 28, 30),  //  5 wins
    m(13, 50, 20, 71),  // 20 wins
    m(12, 42, 21, 63),  // 21 wins
    m( 4, 39, 29, 59),  // 29 wins
    m( 3, 59, 30, 36),  //  3 wins
    m(11, 56, 22, 33),  // 11 wins
    m(14, 67, 19, 73),  // 19 wins
    m( 6, 63, 27, 66),  // 27 wins
    m( 7, 56, 39, 52),  //  7 wins
    m(10, 58, 23, 50),  // 10 wins
    m(15, 44, 18, 43),  // 15 wins
    m( 2, 61, 34, 50),  //  2 wins
  ],
  // Round of 16 (GW33) — 8 matches
  r16: [
    m( 1, 117, 24,  70),  //  1 wins
    m(17, 113,  8,  83),  // 17 wins
    m( 5,  75, 20,  66),  //  5 wins
    m(21, 123, 29,  75),  // 21 wins
    m( 3, 110, 11, 109),  //  3 wins (by 1 pt)
    m(19,  47, 27,  89),  // 27 wins
    m( 7,  62, 10,  73),  // 10 wins
    m(15,  63,  2,  87),  //  2 wins
  ],
  // Quarterfinals (GW34)
  qf: [
    m( 1, 48, 17, 56),  // 17 wins
    m( 5, 50, 21, 62),  // 21 wins
    m( 3, 57, 27, 29),  //  3 wins
    m(10, 32,  2, 54),  //  2 wins
  ],
  // Semifinals (GW35)
  sf: [
    m(17, 49, 21, 65),  // 21 wins
    m( 3, 52,  2, 51),  //  3 wins (by 1 pt)
  ],
  // Final (GW36)
  final: [
    m(21, 84, 3, 73),   // 21 wins — Champion
  ],
  // 3rd Place (GW36)
  "3rd": [
    m(17, 90, 2, 83),   // 17 wins
  ],
};

export const PODIUM_2526 = {
  champion: { seed: 21, team: "Peaky Reijnders", owner: "Marvin Ling" },
  runnerUp: { seed:  3, team: "Cincy Til I Cry", owner: "Tyler Quedens" },
  third:    { seed: 17, team: "Carter's Angels", owner: "Carter Witmer Gautsch" },
};
