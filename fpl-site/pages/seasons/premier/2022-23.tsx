// pages/seasons/premier/2022-23.tsx
// Static archive — 2022-23 Premier League (v2)
// Data source: Final 2022-23 v2 Premier Table PDF
import Head from "next/head";
import NavBar from "../../../components/NavBar";
import PastSeasonsButton from "../../../components/PastSeasonsButton";
import SeasonSummaryCard, { SeasonSummaryData } from "../../../components/SeasonSummaryCard";

const SEASON = "2022-23";
const TITLE  = "2022-23 Premier League Season (v2)";

interface Row {
  pos: number; team: string; owner: string;
  pts: number; w: number; d: number; l: number;
  score: number; scoreA: number; pm: number;
  transfers: number; hit: number;
  worldRank: string;
  reward?: string; relegated?: boolean; isBot?: boolean;
  wc1: string; wc2: string; fh: string; tc: string; bb: string;
}

// "Expired" chips → "—"; used chips show GW number
// Position 19 (AVERAGE) was a bot team participating in the league.
const ROWS: Row[] = [
  { pos:  1, team: "joel FC",             owner: "Joel Matthew",          pts: 85, w: 28, d: 1, l:  9, score: 2342, scoreA: 2023, pm:  319, transfers: 29, hit:  0, worldRank: "1,111,065", reward: "Champion $105",         wc1: "GW5",  wc2: "GW29", fh: "GW12",    tc: "GW32", bb: "GW38"    },
  { pos:  2, team: "Carter's Angels",     owner: "Carter Witmer-Gautsch", pts: 79, w: 26, d: 1, l: 11, score: 2348, scoreA: 2082, pm:  266, transfers: 34, hit:  0, worldRank: "1,058,091", reward: "Champions League $50",  wc1: "GW12", wc2: "GW36", fh: "GW8",     tc: "GW26", bb: "GW30"    },
  { pos:  3, team: "DaddyDowski9",        owner: "Kamil Sacha",           pts: 77, w: 25, d: 2, l: 11, score: 2349, scoreA: 1876, pm:  473, transfers: 33, hit: 24, worldRank: "1,049,157", reward: "Champions League $40",  wc1: "GW8",  wc2: "GW32", fh: "GW28",    tc: "GW37", bb: "GW35"    },
  { pos:  4, team: "USA 2022 WC Champs",  owner: "Seth Gerus",            pts: 74, w: 24, d: 2, l: 12, score: 2363, scoreA: 1945, pm:  418, transfers: 38, hit: 20, worldRank: "930,395",   reward: "Champions League $30",  wc1: "—",    wc2: "GW25", fh: "GW12",    tc: "GW2",  bb: "GW22"    },
  { pos:  5, team: "Siuuuuuu Later",      owner: "Ryan Gallagher",        pts: 74, w: 24, d: 2, l: 12, score: 2328, scoreA: 2010, pm:  318, transfers: 36, hit: 12, worldRank: "1,242,379", reward: "Europa League $20",     wc1: "GW6",  wc2: "GW29", fh: "GW12",    tc: "GW25", bb: "GW37"    },
  { pos:  6, team: "Cheeks FC",           owner: "Rehan Khan",            pts: 74, w: 24, d: 2, l: 12, score: 2319, scoreA: 2027, pm:  292, transfers: 36, hit:  8, worldRank: "1,329,831", reward: "Europa League $15",     wc1: "GW12", wc2: "GW26", fh: "GW35",    tc: "GW22", bb: "GW37"    },
  { pos:  7, team: "Top Mug",             owner: "Aaron Frank",           pts: 73, w: 24, d: 1, l: 13, score: 2244, scoreA: 2015, pm:  229, transfers: 26, hit:  0, worldRank: "2,154,508", reward: "Conference League $10", wc1: "GW13", wc2: "—",    fh: "GW37",    tc: "GW21", bb: "GW38"    },
  { pos:  8, team: "FirstPlace",          owner: "Will Okine",            pts: 68, w: 22, d: 2, l: 14, score: 2157, scoreA: 2060, pm:   97, transfers: 30, hit:  8, worldRank: "3,246,159",                                 wc1: "GW13", wc2: "GW23", fh: "GW12",    tc: "GW24", bb: "GW37"    },
  { pos:  9, team: "Clifton FC",          owner: "Colin Thein",           pts: 67, w: 22, d: 1, l: 15, score: 2205, scoreA: 2147, pm:   58, transfers: 31, hit:  0, worldRank: "2,634,751",                                 wc1: "—",    wc2: "GW25", fh: "GW12",    tc: "GW23", bb: "—"       },
  { pos: 10, team: "Jkells",              owner: "JD Keller",             pts: 66, w: 21, d: 3, l: 14, score: 2248, scoreA: 2179, pm:   69, transfers: 30, hit:  8, worldRank: "2,107,923",                                 wc1: "GW8",  wc2: "GW26", fh: "GW12",    tc: "GW30", bb: "GW29"    },
  { pos: 11, team: "Aches and Pains",     owner: "Imran Khan",            pts: 63, w: 20, d: 3, l: 15, score: 2129, scoreA: 2038, pm:   91, transfers: 36, hit:  4, worldRank: "3,608,051",                                 wc1: "GW4",  wc2: "GW33", fh: "GW28",    tc: "GW37", bb: "—"       },
  { pos: 12, team: "Lotteries&Liberties", owner: "Behruz Bazarov",        pts: 61, w: 19, d: 4, l: 15, score: 2368, scoreA: 2068, pm:  300, transfers: 59, hit:  8, worldRank: "894,262",                                   wc1: "GW3",  wc2: "GW23", fh: "—",       tc: "GW29", bb: "—"       },
  { pos: 13, team: "Justlike1961",        owner: "Gabe Neuenschwander",   pts: 61, w: 20, d: 1, l: 17, score: 2022, scoreA: 1972, pm:   50, transfers: 13, hit:  0, worldRank: "4,969,851",                                 wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 14, team: "713 FC",              owner: "Drew Ballard",          pts: 60, w: 19, d: 3, l: 16, score: 2161, scoreA: 2179, pm:  -18, transfers: 35, hit:  0, worldRank: "3,196,382",                                 wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 15, team: "Lewangoalski",        owner: "Chanse Ashman",         pts: 59, w: 19, d: 2, l: 17, score: 2230, scoreA: 2124, pm:  106, transfers: 30, hit:  0, worldRank: "2,325,152",                                 wc1: "GW12", wc2: "GW18", fh: "GW9",     tc: "GW20", bb: "GW32"    },
  { pos: 16, team: "Batana FC",           owner: "Albert Medancic",       pts: 58, w: 19, d: 1, l: 18, score: 2083, scoreA: 2091, pm:   -8, transfers: 16, hit:  0, worldRank: "4,194,992",                                 wc1: "—",    wc2: "—",    fh: "GW12",    tc: "—",    bb: "—"       },
  { pos: 17, team: "MySonisHeung",        owner: "Charlie Mullen",        pts: 56, w: 18, d: 2, l: 18, score: 2128, scoreA: 2134, pm:   -6, transfers:  8, hit: 16, worldRank: "3,613,954",                                 wc1: "—",    wc2: "—",    fh: "GW14",    tc: "GW37", bb: "—"       },
  { pos: 18, team: "Bits FC",             owner: "Will Franzoni",         pts: 54, w: 17, d: 3, l: 18, score: 2097, scoreA: 2140, pm:  -43, transfers: 34, hit: 24, worldRank: "4,020,650",                                 wc1: "—",    wc2: "—",    fh: "GW3",     tc: "GW32", bb: "—"       },
  { pos: 19, team: "AVERAGE",             owner: "(bot)",                 pts: 49, w: 16, d: 1, l: 21, score: 2026, scoreA: 2112, pm:  -86, transfers: 23, hit:  8, worldRank: "—",         isBot: true,                    wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 20, team: "21iscoming",          owner: "Freddie Wilhelm",       pts: 49, w: 16, d: 1, l: 21, score: 1953, scoreA: 2128, pm: -175, transfers:  0, hit:  0, worldRank: "5,815,112",                                 wc1: "GW8",  wc2: "—",    fh: "GW17",    tc: "—",    bb: "—"       },
  { pos: 21, team: "One Kiss FC",         owner: "Indranshu Das",         pts: 46, w: 15, d: 1, l: 22, score: 1743, scoreA: 1934, pm: -191, transfers:  8, hit:  4, worldRank: "8,087,825", relegated: true,                wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 22, team: "Siguardson U9",       owner: "Linden Eberle",         pts: 41, w: 13, d: 2, l: 23, score: 2092, scoreA: 2147, pm:  -55, transfers: 17, hit:  4, worldRank: "4,080,082", relegated: true,                wc1: "GW8",  wc2: "—",    fh: "GW12",    tc: "—",    bb: "—"       },
  { pos: 23, team: "The Tigers",          owner: "Hunter Stemple",        pts: 35, w: 11, d: 2, l: 25, score: 1704, scoreA: 2018, pm: -314, transfers:  2, hit:  0, worldRank: "8,431,773", relegated: true,                wc1: "GW14", wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 24, team: "Change Name",         owner: "Tyler Thompson",        pts: 34, w: 11, d: 1, l: 26, score: 1979, scoreA: 2193, pm: -214, transfers:  5, hit:  4, worldRank: "5,501,027", relegated: true,                wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 25, team: "Picka City",          owner: "Ive Babic",             pts: 34, w: 11, d: 1, l: 26, score: 1677, scoreA: 2124, pm: -447, transfers:  2, hit:  0, worldRank: "8,656,734", relegated: true,                wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 26, team: "United4eva",          owner: "Ken Okine",             pts: 32, w: 10, d: 2, l: 26, score: 1597, scoreA: 1996, pm: -399, transfers:  0, hit:  0, worldRank: "9,237,845", relegated: true,                wc1: "—",    wc2: "—",    fh: "—",       tc: "—",    bb: "—"       },
  { pos: 27, team: "KRPAN",               owner: "Alan Krpan",            pts: 22, w:  7, d: 1, l: 30, score: 1584, scoreA: 2164, pm: -580, transfers: 29, hit: 88, worldRank: "9,327,015", relegated: true,                wc1: "—",    wc2: "—",    fh: "—",       tc: "GW3",  bb: "—"       },
  { pos: 28, team: "Nottingham to Glory", owner: "Tim Davis",             pts: 20, w:  6, d: 2, l: 30, score: 1590, scoreA: 2057, pm: -467, transfers:  0, hit:  0, worldRank: "9,283,171", relegated: true,                wc1: "—",    wc2: "—",    fh: "—",       tc: "GW28", bb: "—"       },
];

// Score-rank analysis (27 real teams + bot at pos 19 with score 2026):
//   Bot's score 2026 sits between Batana FC (2083) and Justlike1961 (2022),
//   pushing Justlike to score_rank 20.
//   Biggest jump up:  Lotteries&Liberties — 12th by pts →  1st by score (+11)
//   Biggest drop:     Justlike1961        — 13th by pts → 20th by score  (−7)
//
// Chip counts (27 real teams, bot excluded from total):
//   Wildcard 1: 14/27 · peak GW8
//   Wildcard 2: 12/27 · peak GW29
//   Free Hit:   17/27 · peak GW12
//   Triple Captain: 17/27 · peak GW37
//   Bench Boost: 10/27 · peak GW37
//
// Global rank: best Lotteries&Liberties 894,262 · worst KRPAN 9,327,015 · avg 4,152,153
const summary: SeasonSummaryData = {
  season: SEASON,
  league: "premier",
  top7: [
    { position: 1, team: "joel FC",            owner: "Joel Matthew",          points: 85, title_reward: "Champion $105"         },
    { position: 2, team: "Carter's Angels",    owner: "Carter Witmer-Gautsch", points: 79, title_reward: "Champions League $50"  },
    { position: 3, team: "DaddyDowski9",       owner: "Kamil Sacha",           points: 77, title_reward: "Champions League $40"  },
    { position: 4, team: "USA 2022 WC Champs", owner: "Seth Gerus",            points: 74, title_reward: "Champions League $30"  },
    { position: 5, team: "Siuuuuuu Later",     owner: "Ryan Gallagher",        points: 74, title_reward: "Europa League $20"     },
    { position: 6, team: "Cheeks FC",          owner: "Rehan Khan",            points: 74, title_reward: "Europa League $15"     },
    { position: 7, team: "Top Mug",            owner: "Aaron Frank",           points: 73, title_reward: "Conference League $10" },
  ],
  relegated: [
    { position: 21, team: "One Kiss FC",         owner: "Indranshu Das",     points: 46 },
    { position: 22, team: "Siguardson U9",       owner: "Linden Eberle",     points: 41 },
    { position: 23, team: "The Tigers",          owner: "Hunter Stemple",    points: 35 },
    { position: 24, team: "Change Name",         owner: "Tyler Thompson",    points: 34 },
    { position: 25, team: "Picka City",          owner: "Ive Babic",         points: 34 },
    { position: 26, team: "United4eva",          owner: "Ken Okine",         points: 32 },
    { position: 27, team: "KRPAN",               owner: "Alan Krpan",        points: 22 },
    { position: 28, team: "Nottingham to Glory", owner: "Tim Davis",         points: 20 },
  ],
  promoted: [],
  score_movers: {
    biggest_up:   { team: "Lotteries&Liberties", owner: "Behruz Bazarov",      pts_rank: 12, score_rank:  1, delta:  11 },
    biggest_down: { team: "Justlike1961",        owner: "Gabe Neuenschwander", pts_rank: 13, score_rank: 20, delta:  -7 },
  },
  chip_usage: [
    { chip: "Wildcard 1",     used: 14, total: 27, pct: 52, peak_gw: "GW8"  },
    { chip: "Wildcard 2",     used: 12, total: 27, pct: 44, peak_gw: "GW29" },
    { chip: "Free Hit",       used: 17, total: 27, pct: 63, peak_gw: "GW12" },
    { chip: "Triple Captain", used: 17, total: 27, pct: 63, peak_gw: "GW37" },
    { chip: "Bench Boost",    used: 10, total: 27, pct: 37, peak_gw: "GW37" },
  ],
  overall_rank: {
    best:    { team: "Lotteries&Liberties", rank: 894262   },
    worst:   { team: "KRPAN",               rank: 9327015  },
    average: { rank: 4152153 },
  },
};

function rowBg(row: Row) {
  if (row.pos === 1) return "bg-yellow-200";
  if (row.pos === 2) return "bg-gray-300";
  if (row.pos === 3) return "bg-orange-200";
  if (row.relegated) return "bg-red-200";
  return "";
}

function chipCell(val: string, bg: string) {
  const used = val !== "—";
  return (
    <td className={`px-2 py-2 border-b border-gray-400 text-center text-xs ${used ? "font-medium" : "text-gray-400"} ${bg}`}>
      {val}
    </td>
  );
}

export default function PremierArchive2223() {
  return (
    <main className="bg-gradient-to-b from-blue-200 via-white to-purple-100 min-h-screen text-[#37003c]">
      <Head>
        <title>{TITLE} | tFPL</title>
        <meta property="og:title"       content={TITLE} />
        <meta property="og:description" content="2022-23 Premier League final standings" />
        <meta property="og:url"         content="https://tfpl.vercel.app/seasons/premier/2022-23" />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="THE Fantasy Premier League" />
        <meta property="og:image"       content="https://gmkoutsi.com/wp-content/uploads/2023/08/fantasy-premier-league.webp" />
      </Head>

      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#37003c]">{TITLE}</h1>
          <PastSeasonsButton league="premier" currentSeason={SEASON} />
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
          <h2 className="font-bold text-2xl mb-4">{SEASON} Final Standings</h2>
          <p className="text-xs text-gray-500 mb-4">
            Position 19 (AVERAGE) was a bot team participating in the league.
            Bottom 8 (positions 21–28) were relegated.
          </p>
          <div className="overflow-x-auto">
            <table className="bg-purple-100 border-separate border-spacing-x-[1px] rounded-md shadow-md text-sm">
              <thead>
                <tr>
                  {["Pos", "Team", "Owner", "Pts", "W", "D", "L", "Score", "Score Against", "+/−", "Transfers", "Hit", "Global Rank", "WC1", "WC2", "FH", "TC", "BB"].map(h => (
                    <th key={h} className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center whitespace-nowrap">
                      {h}
                    </th>
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
                        {row.relegated && <div className="text-[10px] text-red-700 font-bold">↓ Relegated</div>}
                        {row.isBot && <div className="text-[10px] text-gray-500 italic">bot</div>}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 font-medium whitespace-nowrap ${bg} ${row.isBot ? "italic text-gray-500" : ""}`}>{row.team}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-xs text-gray-600 whitespace-nowrap ${bg}`}>{row.owner}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center font-bold ${bg}`}>{row.pts}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.w}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.d}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.l}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.score.toLocaleString()}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.scoreA.toLocaleString()}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center font-medium ${bg} ${row.pm > 0 ? "text-green-700" : row.pm < 0 ? "text-red-700" : ""}`}>
                        {row.pm > 0 ? `+${row.pm}` : row.pm}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.transfers}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg} ${row.hit > 0 ? "text-red-700 font-medium" : ""}`}>
                        {row.hit > 0 ? `-${row.hit}` : "—"}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center text-xs ${bg}`}>{row.worldRank}</td>
                      {chipCell(row.wc1, bg)}
                      {chipCell(row.wc2, bg)}
                      {chipCell(row.fh,  bg)}
                      {chipCell(row.tc,  bg)}
                      {chipCell(row.bb,  bg)}
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
