// pages/seasons/premier/2021-22.tsx
// Static archive — 2021-22 Premier League (v1)
// Data source: screenshot of app (partial — only top 14 visible)
import Head from "next/head";
import NavBar from "../../../components/NavBar";
import PastSeasonsButton from "../../../components/PastSeasonsButton";

const SEASON = "2021-22";
const TITLE  = "2021-22 Premier League Season (v1)";

const ROWS = [
  { pos: 1,  team: "Cheeks FC",           owner: "Rehan Khan",      pts: 79, w: 26, d: 1, l: 11, reward: "Champion"         },
  { pos: 2,  team: "NK Pjescana",          owner: "Albert Medancic", pts: 76, w: 25, d: 1, l: 12, reward: "Champions League" },
  { pos: 3,  team: "Lotteries&Liberties",  owner: "Behruz Bazarov",  pts: 75, w: 25, d: 0, l: 13, reward: "Champions League" },
  { pos: 4,  team: "F the glazers FC",     owner: "Elijah Garitson", pts: 69, w: 23, d: 0, l: 15 },
  { pos: 5,  team: "Vardy Party",          owner: "Chandler Ashman", pts: 69, w: 23, d: 0, l: 15 },
  { pos: 6,  team: "AFC Richmond",         owner: "Seth Gerus",      pts: 67, w: 22, d: 1, l: 15 },
  { pos: 7,  team: "Couldnthinkofaname",   owner: "William Okine",   pts: 61, w: 20, d: 1, l: 17 },
  { pos: 8,  team: "Aches and Pains",      owner: "Imran Khan",      pts: 57, w: 19, d: 0, l: 19 },
  { pos: 9,  team: "(.Y.)",               owner: "Ramón Bajeca",    pts: 57, w: 19, d: 0, l: 19 },
  { pos: 10, team: "BFC",                  owner: "Colin Thein",     pts: 57, w: 19, d: 0, l: 19 },
  { pos: 11, team: "420BlaiseMatuidi",      owner: "Ive Babic",       pts: 54, w: 18, d: 0, l: 20 },
  { pos: 12, team: "Over the Hill",        owner: "Connor Hill",     pts: 51, w: 17, d: 0, l: 21 },
  { pos: 13, team: "red_devil",            owner: "Ken Okine",       pts: 48, w: 16, d: 0, l: 22 },
  { pos: 14, team: "Arsenal in 7",         owner: "Karan Mehta",     pts: 46, w: 15, d: 1, l: 22 },
];

function rowBg(pos: number) {
  if (pos === 1) return "bg-yellow-200";
  if (pos === 2) return "bg-gray-300";
  if (pos === 3) return "bg-orange-200";
  return "";
}

export default function PremierArchive2122() {
  return (
    <main className="bg-gradient-to-b from-blue-200 via-white to-purple-100 min-h-screen text-[#37003c]">
      <Head>
        <title>{TITLE} | tFPL</title>
        <meta property="og:title"       content={TITLE} />
        <meta property="og:description" content="2021-22 Premier League final standings" />
        <meta property="og:url"         content="https://tfpl.vercel.app/seasons/premier/2021-22" />
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
        {/* Screenshot notice */}
        <div className="px-4 py-3 bg-blue-50 border-l-4 border-blue-400 rounded text-sm text-blue-800">
          <span className="font-bold">📸 Note:</span> The data shown is all the data saved via screenshot of the app.
          Only the top 14 positions are visible from the original screenshot.
        </div>

        <div>
          <h2 className="font-bold text-2xl mb-4">{SEASON} Final Standings</h2>
          <div className="overflow-x-auto">
            <table className="bg-purple-100 border-separate border-spacing-x-[1px] rounded-md shadow-md text-sm">
              <thead>
                <tr>
                  {["Position", "Team", "Owner", "Points", "W", "D", "L"].map(h => (
                    <th key={h} className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold text-center whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => {
                  const bg = rowBg(row.pos);
                  return (
                    <tr key={row.pos} className={bg}>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>
                        <div className="font-bold text-lg">{row.pos}</div>
                        {"reward" in row && row.reward && (
                          <div className="italic text-xs text-purple-700">{row.reward}</div>
                        )}
                      </td>
                      <td className={`px-3 py-2 border-b border-gray-400 font-medium ${bg}`}>{row.team}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-xs text-gray-600 ${bg}`}>{row.owner}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center font-bold ${bg}`}>{row.pts}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.w}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.d}</td>
                      <td className={`px-3 py-2 border-b border-gray-400 text-center ${bg}`}>{row.l}</td>
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
