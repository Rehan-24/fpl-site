import Head from "next/head";
import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import NavBar from "../../components/NavBar";
import { SEEDS_2425, ROUNDS_2425, PODIUM_2425, Match2425 } from "../../lib/facupData2425";

// ── Helpers ────────────────────────────────────────────────────────────────────

function winner(m: Match2425) {
  return m.score1 >= m.score2
    ? { seed: m.seed1, team: m.team1, owner: m.owner1 }
    : { seed: m.seed2, team: m.team2, owner: m.owner2 };
}

function MatchCard({ match }: { match: Match2425 }) {
  const w = winner(match);
  const win1 = w.seed === match.seed1;
  const win2 = w.seed === match.seed2;

  return (
    <div className="w-[172px] bg-white border-[1.5px] border-[#ddd6fe] rounded-md overflow-hidden flex-shrink-0">
      {match.tiebreaker && (
        <div className="px-2 py-[2px] bg-yellow-50 border-b border-yellow-200 text-[8px] font-bold text-yellow-700 uppercase tracking-wide">
          ⚽ Goals tiebreaker
        </div>
      )}
      {[
        { seed: match.seed1, team: match.team1, score: match.score1, isWin: win1 },
        { seed: match.seed2, team: match.team2, score: match.score2, isWin: win2 },
      ].map((row, i) => (
        <div key={i}>
          {i === 1 && <div className="border-t border-purple-100" />}
          <div className={`flex items-center gap-1.5 px-2 py-1.5 min-h-[30px] text-[11px]${row.isWin ? " bg-green-50" : ""}`}>
            <span className="text-[9px] font-bold text-purple-300 w-[14px] text-right flex-shrink-0">
              {row.seed}
            </span>
            <span className={`flex-1 truncate font-medium text-[#37003c]${row.isWin ? " font-bold" : ""}`}>
              {row.team}
            </span>
            {row.isWin && (
              <span className="inline-block w-[5px] h-[5px] rounded-full bg-[#32FF6A] flex-shrink-0" />
            )}
            <span className="text-[12px] font-bold min-w-[20px] text-right text-[#37003c]">
              {row.score}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundSection({ title, gw, matches }: { title: string; gw?: string; matches: Match2425[] }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 border-b-2 border-purple-200 pb-1.5 mb-3">
        {title}
        {gw && <span className="ml-2 font-normal text-purple-300">GW {gw}</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {matches.map((m, i) => <MatchCard key={i} match={m} />)}
      </div>
    </div>
  );
}

// ── Past FA Cups button ────────────────────────────────────────────────────────

function PastFACupsButton({ currentSeason }: { currentSeason: string }) {
  const entries = [
    { season: "2024-25", label: "2024-25 (v1)", champion: "Chandler Ashman" },
  ].filter(e => e.season !== currentSeason);

  if (entries.length === 0) return null;

  return (
    <div className="relative inline-block group">
      <button className="bg-[#32FF6A] text-[#37003c] font-semibold px-4 py-2 rounded shadow text-sm whitespace-nowrap">
        Past FA Cups ▾
      </button>
      <div className="hidden group-focus-within:block absolute right-0 mt-1 w-52 bg-white border border-[#37003c] rounded shadow-lg z-50">
        <div className="px-3 py-2 text-xs font-bold text-[#37003c] border-b border-gray-200 uppercase tracking-wide">
          View a Past FA Cup
        </div>
        {entries.map(e => (
          <Link
            key={e.season}
            href={`/facup/${e.season}`}
            className="block w-full text-left px-3 py-2 text-sm text-[#37003c] hover:bg-purple-100"
          >
            <div className="font-medium">{e.label}</div>
            <div className="text-xs text-gray-500">🥇 {e.champion}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface Props { season: string }

export default function FACupArchivePage({ season }: Props) {
  const isV1 = season === "2024-25";
  const vLabel = isV1 ? "v1" : "v2";
  const title = `${season} FA Cup (${vLabel})`;

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
          <PastFACupsButton currentSeason={season} />
        </div>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      <div className="px-5 py-6 space-y-8 max-w-screen-xl mx-auto">

        {/* Podium */}
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-purple-600 border-b-2 border-purple-200 pb-1.5 mb-4">
            Podium
          </h2>
          <div className="flex flex-wrap gap-4">
            {[
              { place: "🥇", label: "Champion",   data: PODIUM_2425.champion, style: { background: "linear-gradient(135deg,#fefce8,#fef9c3)", border: "2px solid #eab308" } },
              { place: "🥈", label: "Runner-up",  data: PODIUM_2425.runnerUp, style: { background: "linear-gradient(135deg,#f9fafb,#f3f4f6)", border: "2px solid #d1d5db" } },
              { place: "🥉", label: "3rd Place",  data: PODIUM_2425.third,    style: { background: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "2px solid #d97706" } },
            ].map(({ place, label, data, style }) => (
              <div key={label} className="rounded-lg p-4 text-center w-40" style={style}>
                <div className="text-3xl mb-1">{place}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
                <div className="text-[13px] font-bold text-[#37003c] leading-tight">{data.team}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{data.owner}</div>
                <div className="text-[9px] text-purple-300 mt-0.5">Seed {data.seed}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results — later rounds first */}
        <div className="space-y-7">
          <RoundSection title="Final" matches={ROUNDS_2425.final} />
          <RoundSection title="3rd Place" matches={ROUNDS_2425.third} />
          <RoundSection title="Semifinals" matches={ROUNDS_2425.sf} />
          <RoundSection title="Quarterfinals" matches={ROUNDS_2425.qf} />
          <RoundSection title="Round of 16" matches={ROUNDS_2425.r16} />
          <RoundSection title="Round of 32" matches={ROUNDS_2425.r32} />
          <RoundSection title="Round 1" matches={ROUNDS_2425.r1} />
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
                  {["#", "Team", "Manager"].map((h, i) => (
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
