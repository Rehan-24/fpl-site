// pages/facup/2025-26.tsx
// Static archive for the 2025-26 FA Cup (v2)
import Head from "next/head";
import NavBar from "../../components/NavBar";
import {
  ArchiveRoundSection,
  ArchivePodiumCard,
  ArchivePastFACupsButton,
  type ArchiveMatch,
  type ArchivePodium,
} from "../../components/FACupArchiveShared";
import { ROUNDS_2526, PODIUM_2526, type Match2526 } from "../../lib/facupData2526";
import { SEEDS } from "../../lib/facupSeedings";

const SEASON = "2025-26";
const TITLE  = "2025-26 FA Cup (v2)";

// Convert Match2526 → ArchiveMatch (winner determined by score comparison)
function toArchive(rounds: Record<string, Match2526[]>): Record<string, ArchiveMatch[]> {
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

export default function FACupArchive2526() {
  const rounds  = toArchive(ROUNDS_2526);
  const podium: ArchivePodium = PODIUM_2526;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <Head>
        <title>{TITLE} — tFPL</title>
        <meta property="og:title"       content={`tFPL ${TITLE}`} />
        <meta property="og:description" content="2025-26 Fantasy FA Cup results and bracket" />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="THE Fantasy Premier League" />
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
        <ArchivePodiumCard podium={podium} />

        <div className="space-y-7">
          <ArchiveRoundSection title="Final"         gw={36} matches={rounds.final   ?? []} />
          <ArchiveRoundSection title="3rd Place"     gw={36} matches={rounds["3rd"]  ?? []} />
          <ArchiveRoundSection title="Semifinals"    gw={35} matches={rounds.sf      ?? []} />
          <ArchiveRoundSection title="Quarterfinals" gw={34} matches={rounds.qf      ?? []} />
          <ArchiveRoundSection title="Round of 16"   gw={33} matches={rounds.r16     ?? []} />
          <ArchiveRoundSection title="Round of 32"   gw={32} matches={rounds.r32     ?? []} />
          <ArchiveRoundSection title="Round 1"       gw={31} matches={rounds.r1      ?? []} />
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
