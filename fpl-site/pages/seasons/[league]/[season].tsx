import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import NavBar from "../../../components/NavBar";
import PastSeasonsButton from "../../../components/PastSeasonsButton";
import SeasonSummaryCard, { SeasonSummaryData } from "../../../components/SeasonSummaryCard";
import { getPrizeLabel } from "../../../utils/prizes";

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

type Row = Record<string, any>;

const CHIP_KEYS = new Set([
  "Wildcard 1", "Wildcard 2",
  "Triple Captain", "Triple Captain 1", "Triple Captain 2",
  "Bench Boost", "Bench Boost 1", "Bench Boost 2",
  "Free Hit", "Free Hit 1", "Free Hit 2",
  "AssMan",
]);

const FIXED_COLS = [
  "Points", "Wins", "Draws", "Losses",
  "Score", "Score Against", "Plus/Minus",
  "Season Points on Bench", "Total Transfer Hit", "Total Transfers Made",
];

function chipCellBg(val: string): string {
  if (val.startsWith("GW")) return "bg-red-200";
  if (val === "Expired" || val === "Available") return "bg-orange-200";
  return "";
}

function rowBg(league: string, position: number): string {
  if (position === 1) return "bg-yellow-200";
  if (position === 2) return "bg-gray-300";
  if (position === 3) return "bg-orange-200";
  if (league === "premier" && position >= 17) return "bg-red-200";
  if (league === "championship" && position <= 4) return "bg-green-200";
  return "";
}

interface Props {
  league: string;
  season: string;
  summary: SeasonSummaryData;
}

const VERSIONS: Record<string, Record<string, string>> = {
  premier:      { "2025-26": "v5", "2024-25": "v4" },
  championship: { "2025-26": "v3", "2024-25": "v2" },
};

export default function SeasonArchivePage({ league, season, summary }: Props) {
  const isPremier = league === "premier";
  const version = VERSIONS[league]?.[season];
  const title = `${season} ${isPremier ? "Premier League" : "Championship"} Season${version ? ` (${version})` : ""}`;
  const allRows: Row[] = summary.all_rows ?? [];

  const chipCols = allRows.length > 0
    ? Object.keys(allRows[0]).filter((k) => CHIP_KEYS.has(k))
    : [];

  return (
    <main className="bg-gradient-to-b from-blue-200 via-white to-purple-100 min-h-screen text-[#37003c]">
      <Head>
        <title>{title} | tFPL</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`${season} final standings and season summary`} />
        <meta property="og:url" content={`https://tfpl.vercel.app/seasons/${league}/${season}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
        <meta
          property="og:image"
          content={
            isPremier
              ? "https://gmkoutsi.com/wp-content/uploads/2023/08/fantasy-premier-league.webp"
              : "https://4.bp.blogspot.com/-ilHxPtWB8FA/VkS9BiuUpAI/AAAAAAAAxAM/QNQtiFimLyE/s1600/English-Football-League%2B%25281%2529.jpg"
          }
        />
      </Head>

      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#37003c]">{title}</h1>
          <PastSeasonsButton league={league as "premier" | "championship"} currentSeason={season} />
        </div>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      <section className="p-6 space-y-8">

        {/* Season Summary Card */}
        <SeasonSummaryCard data={summary} />

        {/* Static final table */}
        <div>
          <h2 className="font-bold text-2xl mb-4">{season} Final Standings</h2>
          <div className="overflow-x-auto">
            <table className="bg-purple-100 border-separate border-spacing-x-[1px] rounded-md shadow-md text-sm w-full">
              <thead>
                <tr>
                  <th className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center">
                    Position
                  </th>
                  <th className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-left">
                    Team
                  </th>
                  {FIXED_COLS.map((col) => (
                    <th key={col} className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center">
                      {col}
                    </th>
                  ))}
                  {chipCols.map((col) => (
                    <th key={col} className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.map((row) => {
                  const pos = parseInt(String(row.Position), 10);
                  const bg = rowBg(league, pos);
                  return (
                    <tr key={pos} className={bg}>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>
                        <div className="font-bold text-lg">{row.Position}</div>
                        <div className="italic text-xs text-purple-700">
                          {getPrizeLabel(league, pos)}
                        </div>
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 ${bg}`}>
                        <div className="font-medium">
                          {row.Team}
                          {isPremier && pos >= 17 && (
                            <span className="ml-1 text-xs text-red-700 font-bold">↓</span>
                          )}
                          {!isPremier && pos <= 4 && (
                            <span className="ml-1 text-xs text-green-700 font-bold">↑</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          <Link href={`/managers/${encodeURIComponent(row.Owner)}`}>
                            {row.Owner}
                          </Link>
                        </div>
                      </td>
                      {FIXED_COLS.map((col) => (
                        <td key={col} className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>
                          {row[col] ?? "—"}
                        </td>
                      ))}
                      {chipCols.map((col) => {
                        const val = String(row[col] ?? "");
                        return (
                          <td key={col} className={`px-3 py-2 border-b border-gray-400 text-center ${chipCellBg(val) || bg}`}>
                            {val || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const league = String(params?.league ?? "premier");
  const season = String(params?.season ?? "2025-26");

  try {
    const res = await fetch(
      `${BACKEND_BASE}/api/season-summary?league=${encodeURIComponent(league)}&season=${encodeURIComponent(season)}`
    );
    if (!res.ok) return { notFound: true };
    const summary: SeasonSummaryData = await res.json();
    return { props: { league, season, summary } };
  } catch {
    return { notFound: true };
  }
};
