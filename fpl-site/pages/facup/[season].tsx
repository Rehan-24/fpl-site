import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import NavBar from "../../components/NavBar";
import {
  ArchiveMatchCard, ArchiveRoundSection, ArchivePodiumCard,
  ArchivePastFACupsButton, ArchiveMatch, ArchivePodium,
} from "../../components/FACupArchiveShared";
import { ROUNDS_2425, PODIUM_2425, SEEDS_2425 } from "../../lib/facupData2425";

// Convert the 2024-25 Match2425 format into the shared ArchiveMatch format
function toArchive(rounds: typeof ROUNDS_2425): Record<string, ArchiveMatch[]> {
  const out: Record<string, ArchiveMatch[]> = {};
  for (const [key, matches] of Object.entries(rounds)) {
    out[key] = matches.map((m, i) => ({
      matchup_idx: i,
      seed1: m.seed1, team1: m.team1, owner1: m.owner1, score1: m.score1,
      seed2: m.seed2, team2: m.team2, owner2: m.owner2, score2: m.score2,
      winner_seed: m.score1 >= m.score2 ? m.seed1 : m.seed2,
      tiebreaker: m.tiebreaker,
    }));
  }
  return out;
}

interface Props { season: string }

export default function FACupArchivePage({ season }: Props) {
  const isV1 = season === "2024-25";
  const vLabel = isV1 ? "v1" : "v2";
  const title = `${season} FA Cup (${vLabel})`;

  const rounds = toArchive(ROUNDS_2425);
  const podium: ArchivePodium = {
    champion: PODIUM_2425.champion,
    runnerUp: PODIUM_2425.runnerUp,
    third:    PODIUM_2425.third,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <Head>
        <title>{title} — tFPL</title>
        <meta property="og:title" content={`tFPL ${title}`} />
        <meta property="og:description" content={`${season} Fantasy FA Cup results and bracket`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>

      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold text-[#37003c]">{title}</h1>
          <ArchivePastFACupsButton currentSeason={season} />
        </div>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      <div className="px-5 py-6 space-y-8 max-w-screen-xl mx-auto">
        <ArchivePodiumCard podium={podium} />

        <div className="space-y-7">
          <ArchiveRoundSection title="Final"          matches={rounds.final} />
          <ArchiveRoundSection title="3rd Place"      matches={rounds.third} />
          <ArchiveRoundSection title="Semifinals"     matches={rounds.sf} />
          <ArchiveRoundSection title="Quarterfinals"  matches={rounds.qf} />
          <ArchiveRoundSection title="Round of 16"    matches={rounds.r16} />
          <ArchiveRoundSection title="Round of 32"    matches={rounds.r32} />
          <ArchiveRoundSection title="Round 1"        matches={rounds.r1} />
        </div>

        {/* Seedings */}
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-purple-600 border-b-2 border-purple-200 pb-1.5 mb-3">
            2024-25 Seedings
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
                {SEEDS_2425.map((p, i) => (
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

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [{ params: { season: "2024-25" } }],
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => ({
  props: { season: params?.season ?? "2024-25" },
});
