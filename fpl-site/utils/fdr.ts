
// utils/fdr.ts
export type LastGame = {
  gf: number;
  ga: number;
  result: 'W' | 'D' | 'L';
  date: string;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function recentStrengthIndex(lastGames: LastGame[]): number {
  if (!lastGames.length) return 0.5;
  const maxGames = Math.min(5, lastGames.length);
  const slice = lastGames.slice(-5);
  const formPts = slice.reduce((acc, g, i, arr) => {
    const w = g.result === 'W' ? 3 : g.result === 'D' ? 1 : 0;
    const weight = 0.8 + 0.2 * (i / (arr.length - 1 || 1));
    return acc + w * weight;
  }, 0);
  const formPct = formPts / (3 * maxGames);
  const avgDiff = slice.reduce((a,g)=>a+(g.gf-g.ga),0)/maxGames;
  const avgFor  = slice.reduce((a,g)=>a+g.gf,0)/maxGames;
  const diffTerm = sigmoid(avgDiff / 10);
  const forTerm  = sigmoid((avgFor - 50) / 25);
  const idx = 0.6 * formPct + 0.3 * diffTerm + 0.1 * forTerm;
  return clamp(idx, 0, 1);
}

export function idxToFDR(opIdx: number): 1|2|3|4|5 {
  const difficulty = 1 + Math.round((1 - opIdx) * 4);
  return clamp(difficulty, 1, 5) as 1|2|3|4|5;
}

export function fallbackFDRFromLastSeasonFinish(rank: number, leagueSize: number): 1|2|3|4|5 {
  const pct = (rank - 1) / (Math.max(1, leagueSize - 1));
  const difficulty = 5 - Math.round(pct * 4);
  return clamp(difficulty, 1, 5) as 1|2|3|4|5;
}

export function computeOpponentFDR(opts: {
  opponentLastGames?: LastGame[];
  opponentLastSeasonRank?: number;
  leagueSize?: number;
}): 1|2|3|4|5 {
  const lg = opts.opponentLastGames || [];
  if (lg.length >= 5) return idxToFDR(recentStrengthIndex(lg));
  if (opts.opponentLastSeasonRank && opts.leagueSize) {
    return fallbackFDRFromLastSeasonFinish(opts.opponentLastSeasonRank, opts.leagueSize);
  }
  return 3;
}
