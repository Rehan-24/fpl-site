import Head from "next/head";
import { GetServerSideProps } from "next";
import NavBar from "../../components/NavBar";
import {
  ArchiveMatchCard, ArchiveRoundSection, ArchivePodiumCard,
  ArchivePastFACupsButton, ArchiveMatch, ArchivePodium,
} from "../../components/FACupArchiveShared";
import { SEEDS } from "../../lib/facupSeedings";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com";

const SEASON = "2025-26";
const TITLE = "2025-26 FA Cup (v2)";

const ROUND_GWS: Record<string, number> = {
  r1: 31, r32: 32, r16: 33, qf: 34, sf: 35, final: 36, "3rd": 36,
};

interface BracketRow {
  round: string;
  matchup_idx: number;
  gw: number;
  seed1: number;
  seed2: number | null;
  score1: number | null;
  score2: number | null;
  goals1: number | null;
  goals2: number | null;
  winner_seed: number | null;
}

function seedInfo(n: number) {
  return SEEDS.find(s => s.seed === n) ?? { seed: n, team: `Seed ${n}`, owner: "" };
}

function toArchiveMatch(row: BracketRow): ArchiveMatch {
  const a = seedInfo(row.seed1);
  const b = row.seed2 != null ? seedInfo(row.seed2) : { seed: 0, team: "TBD", owner: "" };
  const tiebreaker =
    row.score1 !== null &&
    row.score2 !== null &&
    row.score1 === row.score2 &&
    row.goals1 !== null;
  return {
    matchup_idx: row.matchup_idx,
    seed1: row.seed1, team1: a.team, owner1: a.owner, score1: row.score1,
    seed2: b.seed,   team2: b.team, owner2: b.owner, score2: row.score2,
    winner_seed: row.winner_seed,
    tiebreaker,
  };
}

interface Props {
  rounds: Record<string, ArchiveMatch[]>;
  podium: ArchivePodium | null;
}

export default function FACup2526({ rounds, podium }: Props) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <Head>
        <title>{TITLE} — tFPL</title>
        <meta property="og:title" content={`tFPL ${TITLE}`} />
        <meta property="og:description" content="2025-26 Fantasy FA Cup results and bracket" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>

      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold text-[#37003c]">{TITLE}</h1>
          <ArchivePastFACupsButton currentSeason={SEASON} />
        </div>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      <div className="px-5 py-6 space-y-8 max-w-screen-xl mx-auto">
        {podium && <ArchivePodiumCard podium={podium} />}

        <div className="space-y-7">
          <ArchiveRoundSection title="Final"         gw={36} matches={rounds.final  ?? []} />
          <ArchiveRoundSection title="3rd Place"     gw={36} matches={rounds["3rd"] ?? []} />
          <ArchiveRoundSection title="Semifinals"    gw={35} matches={rounds.sf     ?? []} />
          <ArchiveRoundSection title="Quarterfinals" gw={34} matches={rounds.qf     ?? []} />
          <ArchiveRoundSection title="Round of 16"   gw={33} matches={rounds.r16    ?? []} />
          <ArchiveRoundSection title="Round of 32"   gw={32} matches={rounds.r32    ?? []} />
          <ArchiveRoundSection title="Round 1"       gw={31} matches={rounds.r1     ?? []} />
        </div>

        {/* Seedings */}
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-purple-600 border-b-2 border-purple-200 pb-1.5 mb-3">
            2025-26 Seedings
          </h2>
          <div className="overflow-x-auto rounded-md shadow-sm">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {["#", "Team", "Manager"].map(h => (
                    <th key={h} className="bg-[#37003c] text-white px-3 py-2 text-left text-[11px] font-semibold tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEEDS.map((p, i) => (
                  <tr key={p.seed} className={i % 2 === 0 ? "bg-white" : "bg-purple-50"}>
                    <td className="px-3 py-1.5 font-bold text-[#37003c]">{p.seed}</td>
                    <td className="px-3 py-1.5 font-semibold text-[#37003c]">{p.team}</td>
                    <td className="px-3 py-1.5 text-purple-700">{p.owner || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/facup/bracket?season=${SEASON}`);
    if (!res.ok) return { notFound: true };

    const data = await res.json();
    const rows: BracketRow[] = data.bracket ?? [];

    // Group by round
    const rounds: Record<string, ArchiveMatch[]> = {};
    for (const row of rows) {
      if (!rounds[row.round]) rounds[row.round] = [];
      rounds[row.round].push(toArchiveMatch(row));
    }

    // Derive podium from final + 3rd place results
    let podium: ArchivePodium | null = null;
    const finalMatch = rounds.final?.[0];
    const thirdMatch = rounds["3rd"]?.[0];
    if (finalMatch?.winner_seed != null && thirdMatch?.winner_seed != null) {
      const champion = seedInfo(finalMatch.winner_seed);
      const runnerUpSeed =
        finalMatch.winner_seed === finalMatch.seed1 ? finalMatch.seed2 : finalMatch.seed1;
      const runnerUp = seedInfo(runnerUpSeed);
      const third = seedInfo(thirdMatch.winner_seed);
      podium = {
        champion:  { seed: champion.seed,  team: champion.team,  owner: champion.owner },
        runnerUp:  { seed: runnerUp.seed,   team: runnerUp.team,   owner: runnerUp.owner },
        third:     { seed: third.seed,      team: third.team,      owner: third.owner },
      };
    }

    return { props: { rounds, podium } };
  } catch {
    return { notFound: true };
  }
};
