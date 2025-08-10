import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';
import { useStandings } from '../public/hooks/useStandings';
import { useManagers } from '../public/hooks/useManagers';
import useGWDeadline from '@/public/hooks/useGWDeadline';
import Head from 'next/head';

interface Manager {
  name: string;
  team: string;
  fpl_team_url?: string;
}

export default function Premier() {
  const { data, refresh: refreshStandings, loading: loadingStandings, usingCache } = useStandings('premier');
  const { data: managersData, refresh: refreshManagers, loading: loadingManagers, usingCache: usingCacheManagers } = useManagers();
  const { gwInfo, loading, error } = useGWDeadline();
  const [downloadFile, setDownloadFile] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'Position', // Default sort key to 'Position'
    direction: 'asc', // Default direction for Position (ascending)
  });

  const handleGenerate = async () => {
    const res = await fetch(`https://tfpl.onrender.com/api/generate?league=premier`);
    const result = await res.json();
    if (result.file) {
      setDownloadFile(result.file);
      alert('Excel generated! You can now download it.');
    }
  };

  const positionLabels: Record<string, string> = {
    "1": "Champion $225", "2": "Champions League $105", "3": "Champions League $90",
    "4": "Champions League $80", "5": "Europa League $55", "6": "Europa League $45",
    "7": "Conference League $35", "8": "Battle of The Mid", "9": "Battle of The Mid",
    "10": "Battle of The Mid", "11": "Battle of The Mid", "12": "Battle of The Mid",
    "13": "Battle of The Mid", "14": "Battle of The Mid", "15": "Battle of The Mid",
    "16": "Relegation Battle", "17": "Relegation", "18": "Relegation", "19": "Relegation", "20": "Relegation"
  };

  const handleSort = (key: string) => {
    if (key === 'Team') return; // Don't allow sorting on Position or Team
    setSortConfig((prevConfig) => {
      let direction = 'asc';
      if (prevConfig.key === key && prevConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { key, direction };
    });
  };

  const sortedData = [...(data || [])].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    const isNumeric = ['Position', 'Points', 'Wins', 'Draws', 'Losses', 'Score', 'Score Against',
      'Plus/Minus', 'GW Points on Bench', 'Season Points on Bench', 'GW Transfers',
      'GW Transfer Hit', 'Total Transfers Made', 'Total Transfer Hit',
      'Highest Point Total Possible', 'Current Team Value'
    ].includes(sortConfig.key);

    if (isNumeric) {
      const numA = parseFloat(aValue);
      const numB = parseFloat(bValue);
      return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
    } else {
      const strA = String(aValue ?? '').toLowerCase();
      const strB = String(bValue ?? '').toLowerCase();
      return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }
  });

  const getSortIndicator = (key: string) => {
    if (key !== 'Team') {
      if (sortConfig.key === key) {
        return sortConfig.direction === 'asc' ? '▲' : '▼';
      }
      return '↕';
    }
    return '';
  };

  const getCellStyle = (key: string, val: any, row: Record<string, any>) => {
    const num = parseFloat(val?.toString().replace(/[^\d.\-]/g, '')) || 0;
    if (key === "Chips Used" || key === "Free Hit" || key === "Wildcard 1" || key === "Wildcard 2" || key === "Triple Captain" || key === "Bench Boost" || key === "AssMan") {
      if (val.includes("GW")) return "bg-red-200";
      if (val.includes("Expired")) return "bg-orange-200";
      if (val.includes("Available")) return "bg-green-200";
    }
    if (key === "Score" || key == "Plus/Minus" || key == "Current Team Value") {
      const values = (data || []).map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const sorted = [...values].sort((a, b) => b - a);
      if (num === sorted[0]) return "bg-yellow-200";
      if (num === sorted[1]) return "bg-gray-300";
      if (num === sorted[2]) return "bg-orange-200";
      const asc = [...values].sort((a, b) => a - b);
      if (num === asc[0] || num === asc[1] || num === asc[2]) return "bg-red-200";
    }
    if (key === "Score Against") {
      const values = (data || []).map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const sorted = [...values].sort((a, b) => b - a);
      if (num === sorted[0] || num === sorted[1] || num === sorted[2]) return "bg-red-200";
      const asc = [...values].sort((a, b) => a - b);
      if (num === asc[0]) return "bg-yellow-200";
      if (num === asc[1]) return "bg-gray-300";
      if (num === asc[2]) return "bg-orange-200";
    }
    const topHighlight = ["GW Points on Bench", "Season Points on Bench", "GW Transfers", "Total Transfers Made"];
    if (topHighlight.includes(key)) {
      const values = (data || []).map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const sorted = [...values].sort((a, b) => b - a);
      if (num === sorted[0] || num === sorted[1] || num === sorted[2]) return "bg-purple-200";
    }
    const redHighlight = ["GW Transfer Hit", "Total Transfer Hit"];
    if (redHighlight.includes(key)) {
      const values = (data || []).map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const nonZero = values.filter(n => n > 0);
      if (nonZero.length === 0) return "";
      const sorted = [...nonZero].sort((a, b) => b - a);
      if (num > 0 && (num === sorted[0] || num === sorted[1] || num === sorted[2])) return "bg-red-200";
    }
  };

  return (
    <main className="bg-gradient-to-b from-blue-200 min-h-screen text-[#37003c] text-center to-purple-100 via-white">
      <Head>
          <title>The Fantasy Premier League Table</title>
          <meta property="og:title" content="Premier League Table" />
          <meta property="og:description" content="Premier League Table" />
          <meta property="og:image" content="https://logos-world.net/wp-content/uploads/2023/08/Premier-League-New-Logo.png" />
          <meta property="og:url" content="https://tfpl.vercel.app/premier" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="THE Fantasy Premier League" />
        </Head>
      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
        <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Fantasy Premier League (v5)</h1>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>
      {/* Show Gameweek Deadline bar if data is available */}
      {gwInfo && !loading && !error && (
        <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
          <p>GW{gwInfo.gwNumber} Deadline: {gwInfo.deadline}  PST</p>
        </div>
      )}

      {/* Show loading state */}
      {loading && (
        <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
          <p>Loading Gameweek Info...</p>
        </div>
      )}

      {/* Show error state */}
      {error && (
        <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
          <p>{error}</p>
        </div>
      )}

      <section className="p-6 text-left">
        <h2 className="font-bold mb-4 text-3xl text-left">Premier League Table</h2>

        <button onClick={handleGenerate} className="bg-[#32FF6A] mb-6 px-4 py-2 rounded text-[#37003c] text-center">
          Generate/Update Table
        </button>
        {downloadFile && (
          <a
            href={`https://tfpl.onrender.com/api/download?file=${downloadFile}`}
            className="bg-[#32FF6A] ml-4 px-4 py-2 rounded text-[#37003c] text-center"
            download
          >
            Download Excel
          </a>
        )}
        {usingCache && (
          <span className="ml-3 inline-block text-[11px] bg-yellow-200 text-[#37003c] px-2 py-0.5 rounded">
            Viewing cache, information may be outdated
          </span>
          )}

        <div className="mt-4 overflow-x-auto text-center table-container">
          <table className="bg-purple-100 border-separate border-spacing-x-[1px] overflow-hidden rounded-md shadow-md text-center text-sm w-full">
            <thead>
              <tr>
                <th className="sticky sticky-position left-0 bg-[#37003c] font-semibold px-3 py-2 text-white text-center text-xs">
                  <button onClick={() => handleSort("Position")}>
                    Position <span className="opacity-70">{getSortIndicator("Position")}</span>
                  </button>
                </th>

                <th className="sticky sticky-team left-32 bg-[#37003c] font-semibold px-3 py-2 text-white text-center text-xs">
                  <button onClick={() => handleSort("Team")}>
                    Team <span className="opacity-70">{getSortIndicator("Team")}</span>
                  </button>
                </th>

                {(data ?? [])[0] && Object.keys((data ?? [])[0]).map((key) => (
                  key !== "Owner" && key !== "Title Reward" && key !== "Position" && key !== "Team" && (
                    <th key={key} className="bg-[#37003c] font-semibold px-3 py-2 text-white text-center text-xs">
                      <button onClick={() => handleSort(key)}>
                        {key} <span className="opacity-70">{getSortIndicator(key)}</span>
                      </button>
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row: Record<string, any>, i) => (
                <tr key={i} className="border-t text-center">
                  <td className={`sticky sticky-position left-0 px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle("Position", row.Position, row)}`}>
                    <div className="font-bold text-center text-lg">{row.Position}</div>
                    <div className="italic text-center text-purple-700 text-xs">{positionLabels[String(row.Position)]}</div>
                  </td>

                  <td className={`sticky sticky-team left-32 px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle("Team", row.Team, row)}`}>
                    <div className="font-medium text-center text-left">
                      {
                        managersData?.filter(manager => manager.team === row.Team)
                          .map(manager => (
                            manager.fpl_team_url ? (
                              <a
                                href={manager.fpl_team_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {row.Team}
                              </a>
                            ) : (
                              <span>{row.Team}</span>
                            )
                          ))
                      }
                    </div>
                    <div className="text-xs text-gray-600 text-left text-xs">
                      <Link href={`/managers/${encodeURIComponent(row.Owner)}`} className="hover:underline">
                        {row.Owner}
                      </Link>
                    </div>
                  </td>

                  {Object.entries(row).map(([key, val], j) => {
                    if (key === "Position" || key === "Team" || key === "Owner" || key === "Title Reward") return null;
                    return (
                      <td key={j} className={`px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle(key, val, row)}`}>
                        <div className="text-center">{val}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
