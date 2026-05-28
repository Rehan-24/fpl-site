// pages/seasons/premier/2023-24.tsx
// Static archive — 2023-24 Premier League (v3)
// Data source: FINAL_23-24_PREMIER_TABLE_v3.pdf
import Head from "next/head";
import NavBar from "../../../components/NavBar";
import PastSeasonsButton from "../../../components/PastSeasonsButton";

const SEASON = "2023-24";
const TITLE  = "2023-24 Premier League Season (v3)";

interface Row {
  pos: number; team: string; owner: string;
  pts: number; w: number; d: number; l: number;
  score: number; scoreA: number; pm: number;
  transfers: number; hit: number;
  reward?: string; relegated?: boolean;
  wc1: string; fh: string; tc: string; bb: string;
}

const ROWS: Row[] = [
  { pos:  1, team: "Maguire's Men",         owner: "Marvin Ling",          pts: 76, w: 25, d: 1, l: 12, score: 2403, scoreA: 2179, pm:  224, transfers: 44, hit: 40, reward: "Champion $220",         wc1: "GW31", fh: "GW38", tc: "GW36", bb: "GW37"    },
  { pos:  2, team: "Siuuuuu Later",          owner: "Ryan Gallagher",       pts: 70, w: 23, d: 1, l: 14, score: 2203, scoreA: 2098, pm:  105, transfers: 31, hit:  8, reward: "Champions League $100", wc1: "GW25", fh: "GW37", tc: "GW34", bb: "GW33"    },
  { pos:  3, team: "joel fc",                owner: "Joel Mathew",          pts: 66, w: 21, d: 3, l: 14, score: 2362, scoreA: 2215, pm:  147, transfers: 37, hit: 12, reward: "Champions League $85",  wc1: "GW21", fh: "GW20", tc: "GW29", bb: "GW35"    },
  { pos:  4, team: "Top Mug",                owner: "Aaron Frank",          pts: 66, w: 22, d: 0, l: 16, score: 2210, scoreA: 2200, pm:   10, transfers: 33, hit:  0, reward: "Champions League $75",  wc1: "GW26", fh: "GW25", tc: "GW10", bb: "GW38"    },
  { pos:  5, team: "Hale End Merchants",     owner: "Avi Kumar",            pts: 64, w: 21, d: 1, l: 16, score: 2486, scoreA: 2431, pm:   55, transfers: 40, hit: 28, reward: "Europa League $50",     wc1: "GW35", fh: "GW29", tc: "GW25", bb: "GW37"    },
  { pos:  6, team: "The Merchants",          owner: "Chandler Ashman",      pts: 63, w: 21, d: 0, l: 17, score: 2288, scoreA: 2219, pm:   69, transfers: 34, hit:  0, reward: "Europa League $40",     wc1: "GW33", fh: "GW19", tc: "GW34", bb: "GW5"     },
  { pos:  7, team: "Carter's Angels",        owner: "Carter WitmerGautsch", pts: 60, w: 19, d: 3, l: 16, score: 2371, scoreA: 2205, pm:  166, transfers: 34, hit: 16, reward: "Conference League $30", wc1: "GW26", fh: "GW29", tc: "GW34", bb: "GW37"    },
  { pos:  8, team: "Cheeks FC",              owner: "Rehan Khan",           pts: 60, w: 20, d: 0, l: 18, score: 2347, scoreA: 2175, pm:  172, transfers: 37, hit: 16,                                  wc1: "GW36", fh: "GW29", tc: "GW35", bb: "GW37"    },
  { pos:  9, team: "Ivan Toney Bail Fund",   owner: "will franzoni",        pts: 59, w: 19, d: 2, l: 17, score: 2197, scoreA: 2152, pm:   45, transfers: 32, hit: 20,                                  wc1: "GW9",  fh: "GW8",  tc: "GW24", bb: "GW5"     },
  { pos: 10, team: "FirstPlace",             owner: "William Okine",        pts: 58, w: 18, d: 4, l: 16, score: 2178, scoreA: 2090, pm:   88, transfers: 35, hit: 12,                                  wc1: "GW21", fh: "GW2",  tc: "GW3",  bb: "GW20"    },
  { pos: 11, team: "Lotteries&Liberties",    owner: "Behruz Bazarov",       pts: 57, w: 19, d: 0, l: 19, score: 2233, scoreA: 2201, pm:   32, transfers: 22, hit:  0,                                  wc1: "GW21", fh: "—",    tc: "GW28", bb: "—"       },
  { pos: 12, team: "Mucho Gusto FC",         owner: "Seth Gerus",           pts: 57, w: 19, d: 0, l: 19, score: 2233, scoreA: 2268, pm:  -35, transfers: 31, hit:  4,                                  wc1: "GW21", fh: "GW8",  tc: "GW4",  bb: "GW11"    },
  { pos: 13, team: "Top20Player",            owner: "Zak Keller",           pts: 54, w: 18, d: 0, l: 20, score: 2204, scoreA: 2283, pm:  -79, transfers: 20, hit:  4,                                  wc1: "GW30", fh: "GW26", tc: "GW37", bb: "GW38"    },
  { pos: 14, team: "old and grumpy",         owner: "Imran khan",           pts: 54, w: 18, d: 0, l: 20, score: 2102, scoreA: 2196, pm:  -94, transfers: 20, hit:  0,                                  wc1: "GW33", fh: "GW29", tc: "—",    bb: "—"       },
  { pos: 15, team: "Power of Gil",           owner: "Kamil S",              pts: 50, w: 16, d: 2, l: 20, score: 2109, scoreA: 2238, pm: -129, transfers: 17, hit:  4,                                  wc1: "GW8",  fh: "—",    tc: "—",    bb: "—"       },
  { pos: 16, team: "white Ben can't jump",   owner: "JD Garcia",            pts: 49, w: 15, d: 4, l: 19, score: 2198, scoreA: 2184, pm:   14, transfers: 28, hit: 24,                                  wc1: "GW5",  fh: "—",    tc: "GW6",  bb: "GW2"     },
  { pos: 17, team: "Reece's Pieces",         owner: "Charlie Mullen",       pts: 43, w: 14, d: 1, l: 23, score: 2207, scoreA: 2303, pm:  -96, transfers: 45, hit: 84, relegated: true,                 wc1: "GW29", fh: "—",    tc: "GW38", bb: "—"       },
  { pos: 18, team: "NK ISTRA",               owner: "Albert Medancic",      pts: 42, w: 14, d: 0, l: 24, score: 2021, scoreA: 2298, pm: -277, transfers: 10, hit:  0, relegated: true,                 wc1: "GW6",  fh: "—",    tc: "—",    bb: "—"       },
  { pos: 19, team: "ABCDE FC",               owner: "Emaly Vatne",          pts: 42, w: 14, d: 0, l: 24, score: 1984, scoreA: 2162, pm: -178, transfers:  9, hit:  0, relegated: true,                 wc1: "—",    fh: "—",    tc: "—",    bb: "—"       },
  { pos: 20, team: "Clifton FC",             owner: "Colin Thein",          pts: 38, w: 12, d: 2, l: 24, score: 2015, scoreA: 2254, pm: -239, transfers: 12, hit:  0, relegated: true,                 wc1: "—",    fh: "—",    tc: "—",    bb: "—"       },
];

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

export default function PremierArchive2324() {
  return (
    <main className="bg-gradient-to-b from-blue-200 via-white to-purple-100 min-h-screen text-[#37003c]">
      <Head>
        <title>{TITLE} | tFPL</title>
        <meta property="og:title"       content={TITLE} />
        <meta property="og:description" content="2023-24 Premier League final standings" />
        <meta property="og:url"         content="https://tfpl.vercel.app/seasons/premier/2023-24" />
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

      <section className="p-6 space-y-6">
        <div>
          <h2 className="font-bold text-2xl mb-1">{SEASON} Final Standings</h2>
          <p className="text-xs text-gray-500 mb-4">
            Bottom 4 (positions 17–20) were relegated. Note: this season had no Wildcard 2.
          </p>
          <div className="overflow-x-auto">
            <table className="bg-purple-100 border-separate border-spacing-x-[1px] rounded-md shadow-md text-sm">
              <thead>
                <tr>
                  {["Pos", "Team", "Owner", "Pts", "W", "D", "L", "Score", "Score Against", "+/−", "Transfers", "Hit", "WC1", "FH", "TC", "BB"].map(h => (
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
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 font-medium whitespace-nowrap ${bg}`}>{row.team}</td>
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
                      {chipCell(row.wc1, bg)}
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
