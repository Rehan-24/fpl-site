import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Premier() {
  const [data, setData] = useState([]);
  const [downloadFile, setDownloadFile] = useState('');

  useEffect(() => {
    fetch('https://tfpl.onrender.com/api/standings?league=premier')
      .then(res => res.json())
      .then(setData);
  }, []);

  const handleGenerate = async () => {
    const res = await fetch(`https://tfpl.onrender.com/api/generate?league=premier`);
    const result = await res.json();
    if (result.file) {
      setDownloadFile(result.file);
      alert('Excel generated! You can now download it.');
    }
  };

  const positionLabels: Record<string, string> = {"1": "Champion $225", "2": "Champions League $105", "3": "Champions League $90", "4": "Champions League $80", "5": "Europa League $55", "6": "Europa League $45", "7": "Conference League $35", "8": "Battle of The Mid", "9": "Battle of The Mid", "10": "Battle of The Mid", "11": "Battle of The Mid", "12": "Battle of The Mid", "13": "Battle of The Mid", "14": "Battle of The Mid", "15": "Battle of The Mid", "16": "Relegation Battle", "17": "Relegation", "18": "Relegation", "19": "Relegation", "20": "Relegation"};

  const getCellStyle = (key: string, val: any, row: Record<string, any>) => {
    const num = parseFloat(val?.toString().replace(/[^\d.\-]/g, '')) || 0;

    if (key === "Chips Used" || key === "Free Hit" || key === "Wildcard 1" || key === "Wildcard 2" || key === "Triple Captain" || key === "Bench Boost" || key === "AssMan") {
      if (val.includes("GW")) return "bg-red-200";
      if (val.includes("Expired")) return "bg-orange-200";
      if (val.includes("Available")) return "bg-green-200";
    }

    if (key === "Score" || key == "Plus/Minus"|| key == "Current Team Value") {
      const values = data.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const sorted = [...values].sort((a, b) => b - a);
      if (num === sorted[0]) return "bg-yellow-200";
      if (num === sorted[1]) return "bg-gray-300";
      if (num === sorted[2]) return "bg-orange-200";
      const asc = [...values].sort((a, b) => a - b);
      if (num === asc[0]||num === asc[1] || num === asc[2]) return "bg-red-200";
    }

    if (key === "Score Against") {
      const values = data.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const sorted = [...values].sort((a, b) => b - a);
      if (num === sorted[0] || num === sorted[1] || num === sorted[2]) return "bg-red-200";
      const asc = [...values].sort((a, b) => a - b);
      if (num === asc[0]) return "bg-yellow-200";
      if (num === asc[1]) return "bg-gray-300";
      if (num === asc[2]) return "bg-orange-200";
    }

    const topHighlight = ["GW Points on Bench", "Season Points on Bench", "GW Transfers", "Total Transfers Made"];
    if (topHighlight.includes(key)) {
      const values = data.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const sorted = [...values].sort((a, b) => b - a);
      if (num === sorted[0] || num === sorted[1] || num === sorted[2]) return "bg-purple-200";
    }

    const redHighlight = ["GW Transfer Hit", "Total Transfer Hit"];
    if (redHighlight.includes(key)) {
      const values = data.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const nonZero = values.filter(n => n > 0);
      if (nonZero.length === 0) return "";
      const sorted = [...nonZero].sort((a, b) => b - a);
      if (num > 0 && (num === sorted[0] || num === sorted[1] || num === sorted[2])) return "bg-red-200";
    }
  };

  return (
    <main className="bg-gradient-to-b from-blue-200 min-h-screen text-[#37003c] text-center to-purple-100 via-white">
      <div className="bg-gradient-to-r from-blue-300 p-6 shadow-lg text-center text-white to-purple-700 via-blue-400">
        <h1 className="font-bold text-4xl text-[#37003c] text-center sm:text-left">
          THE Fantasy Premier League (v5)
        </h1>
        <NavBar />
      </div>

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

        <div className="mt-4 overflow-x-auto text-center">
          <table className="bg-purple-100 border-separate border-spacing-x-[1px] overflow-hidden rounded-md shadow-md text-center text-sm w-full">
            <thead>
              <tr>
                {data[0] && Object.keys(data[0]).map((key) => (
                  key !== "Owner" && key !== "Title Reward" && (
                    <th key={key} className="bg-gray-100 font-semibold px-3 py-2 text-[#37003c] text-center text-xs">
                      {key}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: Record<string, any>, i) => (
                <tr key={i} className="border-t text-center">
                  {Object.entries(row).map(([key, val], j) => {
                    if (key === "Position") {
                      return (
                        <td key={j} className={`px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle(key, val, row)}`}>
                          <div className="font-bold text-center text-lg">{String(val)}</div>
                          <div className="italic text-center text-purple-700 text-xs">{positionLabels[String(val)]}</div>
                        </td>
                      );
                    }
                    if (key === "Title Reward") return null;
                    if (key === "Team") {
                      return (
                        <td key={j} className={`px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle(key, val, row)}`}>
                          <div className="font-medium text-center text-left">{String(val)}</div>
                          <div className="text-xs text-gray-600 text-left text-xs">
                            <Link
                              href={`/managers/${encodeURIComponent(row.Owner)}`}
                              className="hover:underline"
                            >
                              {row.Owner}
                            </Link>
                         </div>
                        </td>
                      );
                    }

                    if (key === "Owner") return null;
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