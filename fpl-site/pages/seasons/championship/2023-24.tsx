// pages/seasons/championship/2023-24.tsx
// Static archive — 2023-24 Championship Season (v1)
// Data source: FINAL_23-24_CHAMPIONSHIP_TABLE_v1.pdf
import Head from "next/head";
import Link from "next/link";
import NavBar from "../../../components/NavBar";
import PastSeasonsButton from "../../../components/PastSeasonsButton";
import SeasonSummaryCard, { SeasonSummaryData } from "../../../components/SeasonSummaryCard";

const SEASON = "2023-24";
const TITLE  = "2023-24 Championship Season (v1)";

interface Row {
  pos: number; team: string; owner: string;
  pts: number; w: number; d: number; l: number;
  score: number; scoreA: number; pm: number;
  bench: number;
  transfers: number; hit: number;
  reward?: string; isBot?: boolean;
  wc: string; fh: string; tc: string; bb: string;
}

// "Available" in PDF (chip unused) → "—"
// Position 18 (AVERAGE) was a bot team participating in the league.
const ROWS: Row[] = [
  { pos:  1, team: "MacAwoniyi Cheese", owner: "James Giles",         pts: 80, w: 26, d: 2, l: 10, score: 2333, scoreA: 2077, pm:  256, bench: 243, transfers: 44, hit: 40, reward: "Champion $50",    wc: "GW25", fh: "GW7",  tc: "GW33", bb: "GW38" },
  { pos:  2, team: "DuhHuddyDubs",      owner: "Derek Huddleston",    pts: 78, w: 26, d: 0, l: 12, score: 2383, scoreA: 2019, pm:  364, bench: 191, transfers: 38, hit: 16, reward: "Promotion $40",   wc: "GW26", fh: "GW29", tc: "GW35", bb: "GW38" },
  { pos:  3, team: "Slopeds",           owner: "Michael Giles",       pts: 75, w: 24, d: 3, l: 11, score: 2264, scoreA: 1967, pm:  297, bench: 269, transfers: 41, hit: 28, reward: "Promotion $35",   wc: "GW21", fh: "GW7",  tc: "GW27", bb: "GW38" },
  { pos:  4, team: "haaland is washed", owner: "Logan Roth",          pts: 73, w: 24, d: 1, l: 13, score: 2148, scoreA: 2028, pm:  120, bench: 380, transfers: 34, hit: 28, reward: "Promotion $25",   wc: "GW37", fh: "GW9",  tc: "GW38", bb: "GW22" },
  { pos:  5, team: "Kloppenheimer",     owner: "Julian Tarazi",       pts: 71, w: 23, d: 2, l: 13, score: 2442, scoreA: 2140, pm:  302, bench: 215, transfers: 30, hit:  4, reward: "Upper Mid $15",   wc: "GW35", fh: "GW29", tc: "GW25", bb: "GW37" },
  { pos:  6, team: "ur moms fav team",  owner: "Brynn Miller",        pts: 68, w: 22, d: 2, l: 14, score: 2203, scoreA: 2054, pm:  149, bench: 246, transfers: 24, hit: 12, reward: "Upper Mid $15",   wc: "—",    fh: "GW29", tc: "GW38", bb: "—"    },
  { pos:  7, team: "R2G ^_^",           owner: "linden eberle",       pts: 67, w: 22, d: 1, l: 15, score: 2174, scoreA: 1996, pm:  178, bench: 118, transfers: 18, hit:  4, reward: "Upper Mid $10",   wc: "GW22", fh: "GW21", tc: "—",    bb: "—"    },
  { pos:  8, team: "touch my areola",   owner: "Hanson Xia",          pts: 66, w: 22, d: 0, l: 16, score: 2367, scoreA: 2205, pm:  162, bench: 278, transfers: 39, hit: 24,                            wc: "GW35", fh: "GW29", tc: "GW25", bb: "GW37" },
  { pos:  9, team: "Oil Money FC",      owner: "Hunter Stemple",      pts: 60, w: 20, d: 0, l: 18, score: 2060, scoreA: 2029, pm:   31, bench: 185, transfers: 14, hit:  8,                            wc: "GW29", fh: "GW2",  tc: "GW11", bb: "—"    },
  { pos: 10, team: "Jawnaldo",          owner: "John Saunders",       pts: 59, w: 19, d: 2, l: 17, score: 2070, scoreA: 2052, pm:   18, bench: 167, transfers: 25, hit:  8,                            wc: "GW10", fh: "—",    tc: "GW34", bb: "GW36" },
  { pos: 11, team: "Rolls Rice",        owner: "Zoha Khan",           pts: 54, w: 18, d: 0, l: 20, score: 1978, scoreA: 1968, pm:   10, bench: 224, transfers: 21, hit: 16,                            wc: "GW36", fh: "—",    tc: "GW38", bb: "—"    },
  { pos: 12, team: "ericdiersasshol",   owner: "Gabe Neuenschwander", pts: 54, w: 18, d: 0, l: 20, score: 1945, scoreA: 2086, pm: -141, bench: 104, transfers:  9, hit:  8,                            wc: "—",    fh: "—",    tc: "—",    bb: "—"    },
  { pos: 13, team: "FC Wincinnati",     owner: "Alex Quedens",        pts: 48, w: 16, d: 0, l: 22, score: 1938, scoreA: 1974, pm:  -36, bench: 317, transfers: 33, hit: 24,                            wc: "GW29", fh: "GW34", tc: "GW17", bb: "GW14" },
  { pos: 14, team: "FC Pingu",          owner: "Indranshu Das",       pts: 48, w: 16, d: 0, l: 22, score: 1848, scoreA: 2121, pm: -273, bench: 231, transfers: 13, hit:  0,                            wc: "GW7",  fh: "GW3",  tc: "—",    bb: "—"    },
  { pos: 15, team: "PokieRoost",        owner: "Andrew Muravitsky",   pts: 46, w: 15, d: 1, l: 22, score: 1798, scoreA: 1978, pm: -180, bench: 40,  transfers:  3, hit:  0,                            wc: "—",    fh: "—",    tc: "—",    bb: "—"    },
  { pos: 16, team: "Casey's team",      owner: "Casey Manos",         pts: 45, w: 15, d: 0, l: 23, score: 1827, scoreA: 2049, pm: -222, bench: 152, transfers:  7, hit:  0,                            wc: "—",    fh: "—",    tc: "—",    bb: "—"    },
  { pos: 17, team: "ROBO CHICKENS",     owner: "Nate Thomas",         pts: 42, w: 14, d: 0, l: 24, score: 1829, scoreA: 2094, pm: -265, bench: 49,  transfers:  1, hit:  0,                            wc: "—",    fh: "—",    tc: "—",    bb: "—"    },
  { pos: 18, team: "AVERAGE",           owner: "(bot)",               pts: 41, w: 13, d: 2, l: 23, score: 2003, scoreA: 2134, pm: -131, bench: 0,   transfers:  0, hit:  0, isBot: true,               wc: "—",    fh: "—",    tc: "—",    bb: "—"    },
  { pos: 19, team: "21iscoming",        owner: "Freddie Wilhelm",     pts: 36, w: 12, d: 0, l: 26, score: 1847, scoreA: 2013, pm: -166, bench: 37,  transfers: 11, hit:  8,                            wc: "GW2",  fh: "GW16", tc: "—",    bb: "—"    },
  { pos: 20, team: "Red devil",         owner: "Ken Okine",           pts: 21, w:  7, d: 0, l: 31, score: 1566, scoreA: 2039, pm: -473, bench: 40,  transfers:  0, hit:  0,                            wc: "—",    fh: "—",    tc: "—",    bb: "—"    },
];

// Score-rank analysis (19 real teams + bot at pos 18 with score 2003):
//   Bot sits between Oil Money FC (2060) and Rolls Rice (1978), pushing
//   all real teams below it one rank down.
//   Biggest jump up:  touch my areola   —  8th by pts →  3rd by score (+5)
//   Biggest drop:     haaland is washed —  4th by pts →  8th by score (−4)
//
// Chip counts (19 real teams, bot excluded from total):
//   Wildcard:       13/19 · peak GW35
//   Free Hit:       12/19 · peak GW29
//   Triple Captain: 11/19 · peak GW38
//   Bench Boost:     8/19 · peak GW38
const summary: SeasonSummaryData = {
  season: SEASON,
  league: "championship",
  top7: [
    { position: 1, team: "MacAwoniyi Cheese", owner: "James Giles",      points: 80, title_reward: "Champion $50"    },
    { position: 2, team: "DuhHuddyDubs",      owner: "Derek Huddleston", points: 78, title_reward: "Promotion $40"   },
    { position: 3, team: "Slopeds",           owner: "Michael Giles",    points: 75, title_reward: "Promotion $35"   },
    { position: 4, team: "haaland is washed", owner: "Logan Roth",       points: 73, title_reward: "Promotion $25"   },
    { position: 5, team: "Kloppenheimer",     owner: "Julian Tarazi",    points: 71, title_reward: "Upper Mid $15"   },
    { position: 6, team: "ur moms fav team",  owner: "Brynn Miller",     points: 68, title_reward: "Upper Mid $15"   },
    { position: 7, team: "R2G ^_^",           owner: "linden eberle",    points: 67, title_reward: "Upper Mid $10"   },
  ],
  relegated: [],
  promoted: [
    { position: 1, team: "MacAwoniyi Cheese", owner: "James Giles",      points: 80, title_reward: "Champion $50"  },
    { position: 2, team: "DuhHuddyDubs",      owner: "Derek Huddleston", points: 78, title_reward: "Promotion $40" },
    { position: 3, team: "Slopeds",           owner: "Michael Giles",    points: 75, title_reward: "Promotion $35" },
    { position: 4, team: "haaland is washed", owner: "Logan Roth",       points: 73, title_reward: "Promotion $25" },
  ],
  score_movers: {
    biggest_up:   { team: "touch my areola",   owner: "Hanson Xia",  pts_rank: 8, score_rank: 3, delta:  5 },
    biggest_down: { team: "haaland is washed", owner: "Logan Roth",  pts_rank: 4, score_rank: 8, delta: -4 },
  },
  chip_usage: [
    { chip: "Wildcard",       used: 13, total: 19, pct: 68, peak_gw: "GW35" },
    { chip: "Free Hit",       used: 12, total: 19, pct: 63, peak_gw: "GW29" },
    { chip: "Triple Captain", used: 11, total: 19, pct: 58, peak_gw: "GW38" },
    { chip: "Bench Boost",    used:  8, total: 19, pct: 42, peak_gw: "GW38" },
  ],
  chip_note: "Wildcard data was incomplete this season — only the most recent wildcard usage per team is recorded",
  overall_rank: null,
};

function rowBg(row: Row) {
  if (row.pos === 1) return "bg-yellow-200";
  if (row.pos === 2) return "bg-gray-300";
  if (row.pos === 3) return "bg-orange-200";
  if (row.pos <= 4) return "bg-green-200";
  return "";
}

function chipCell(val: string, bg: string) {
  if (val.startsWith("GW")) {
    return <td className="px-3 py-2 border-b border-gray-400 text-center text-xs bg-red-200 font-medium">{val}</td>;
  }
  return <td className={`px-3 py-2 border-b border-gray-400 text-center text-xs text-gray-400 ${bg}`}>{val}</td>;
}

export default function ChampionshipArchive2324() {
  return (
    <main className="bg-gradient-to-b from-blue-200 via-white to-purple-100 min-h-screen text-[#37003c]">
      <Head>
        <title>{TITLE} | tFPL</title>
        <meta property="og:title"       content={TITLE} />
        <meta property="og:description" content="2023-24 Championship final standings" />
        <meta property="og:url"         content="https://tfpl.vercel.app/seasons/championship/2023-24" />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="THE Fantasy Premier League" />
        <meta property="og:image"       content="https://4.bp.blogspot.com/-ilHxPtWB8FA/VkS9BiuUpAI/AAAAAAAAxAM/QNQtiFimLyE/s1600/English-Football-League%2B%25281%2529.jpg" />
      </Head>

      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#37003c]">{TITLE}</h1>
          <PastSeasonsButton league="championship" currentSeason={SEASON} />
        </div>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      <section className="p-6 space-y-8">

        {/* Season Summary Card */}
        <SeasonSummaryCard data={summary} hideGlobalRank={true} />

        {/* Static final table */}
        <div>
          <h2 className="font-bold text-2xl mb-4">{SEASON} Final Standings</h2>
          <p className="text-xs text-gray-500 mb-4">
            Top 4 (positions 1–4) were promoted to Premier. Position 18 (AVERAGE) was a bot team participating in the league.
          </p>
          <div className="overflow-x-auto">
            <table className="bg-purple-100 border-separate border-spacing-x-[1px] rounded-md shadow-md text-sm w-full">
              <thead>
                <tr>
                  <th className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center">Position</th>
                  <th className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-left">Team</th>
                  {["Points", "Wins", "Draws", "Losses", "Score", "Score Against", "Plus/Minus",
                    "Season Points on Bench", "Total Transfer Hit", "Total Transfers Made",
                    "WC", "FH", "TC", "BB"].map(h => (
                    <th key={h} className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => {
                  const bg = rowBg(row);
                  return (
                    <tr key={row.pos} className={bg}>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>
                        <div className="font-bold text-lg">{row.pos}</div>
                        {row.reward && <div className="italic text-[10px] text-purple-700 leading-tight">{row.reward}</div>}
                        {row.isBot && <div className="text-[10px] text-gray-500 italic">bot</div>}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 ${bg}`}>
                        <div className={`font-medium${row.isBot ? " italic text-gray-500" : ""}`}>
                          {row.team}
                          {row.pos <= 4 && !row.isBot && (
                            <span className="ml-1 text-xs text-green-700 font-bold">↑</span>
                          )}
                        </div>
                        {row.isBot ? (
                          <div className="text-xs text-gray-500 italic">{row.owner}</div>
                        ) : (
                          <div className="text-xs text-gray-600">
                            <Link href={`/managers/${encodeURIComponent(row.owner)}`}>{row.owner}</Link>
                          </div>
                        )}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center font-bold ${bg}`}>{row.pts}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.w}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.d}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.l}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.score.toLocaleString()}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.scoreA.toLocaleString()}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center font-medium ${bg} ${row.pm > 0 ? "text-green-700" : row.pm < 0 ? "text-red-700" : ""}`}>
                        {row.pm > 0 ? `+${row.pm}` : row.pm}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.bench}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg} ${row.hit > 0 ? "text-red-700 font-medium" : ""}`}>
                        {row.hit > 0 ? `-${row.hit}` : "—"}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>
                        {row.isBot ? "—" : row.transfers}
                      </td>
                      {chipCell(row.wc, bg)}
                      {chipCell(row.fh, bg)}
                      {chipCell(row.tc, bg)}
                      {chipCell(row.bb, bg)}
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
