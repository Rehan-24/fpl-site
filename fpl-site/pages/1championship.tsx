import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Premier() {
  const [data, setData] = useState([]);
  const [downloadFile, setDownloadFile] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/standings?league=championship')
      .then(res => res.json())
      .then(setData);
  }, []);

  const handleGenerate = async () => {
    const res = await fetch('http://localhost:8000/api/standings?league=championship');
    const result = await res.json();
    if (result.file) {
      setDownloadFile(result.file);
      alert('Excel generated! You can now download it.');
    }
  };

  const positionLabels = {
    "1": "Champion $225", "2": "Champions League $105", "3": "Champions League $90",
    "4": "Champions League $80", "5": "Europa League $55", "6": "Europa League $45",
    "7": "Conference League $35", "8": "Battle of The Mid", "9": "Battle of The Mid",
    "10": "Battle of The Mid", "11": "Battle of The Mid", "12": "Battle of The Mid",
    "13": "Battle of The Mid", "14": "Battle of The Mid", "15": "Battle of The Mid",
    "16": "Relegation Battle", "17": "Relegation", "18": "Relegation", "19": "Relegation", "20": "Relegation"
  };

  const getCellStyle = (key, val, row) => {
    const num = parseFloat(val?.toString().replace(/[^\d.\-]/g, '')) || 0;

    if (key === "Chips Used" || key === "Free Hit" || key === "Wildcard 1" || key === "Wildcard 2" || key === "Triple Captain" || key === "Bench Boost" || key === "AssMan") {
      if (val.includes("GW")) return "bg-red-200";
      if (val.includes("Expired")) return "bg-orange-200";
      if (val.includes("Available")) return "bg-green-200";
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

    const topHighlight = ["GW Points on Bench", "Season Points on Bench", "GW Transfers Made", "Total Transfers Made"];
    if (topHighlight.includes(key)) {
      const values = data.map(r => parseFloat(r[key])).filter(n => !isNaN(n));
      const nonZero = values.filter(n => n > 0);
      if (nonZero.length === 0) return "";
      const sorted = [...nonZero].sort((a, b) => b - a);
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
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <div className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="text-4xl font-bold text-[#37003c]">tFPL League</h1>
        <nav className="mt-4 flex gap-4">
          <Link href="/"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">Home</button></Link>
          <Link href="/premier"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">Premier</button></Link>
          <Link href="/championship"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">Championship</button></Link>
          <Link href="/facup"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">FA Cup</button></Link>
        </nav>
      </div>

      <section className="p-6">
        <h2 className="text-3xl font-bold mb-4">Championship Table</h2>

        <button onClick={handleGenerate} className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded mb-6">
          Generate/Update Table
        </button>
        {downloadFile && (
          <a
            href={`http://localhost:8000/api/download?file=${downloadFile}`}
            className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded ml-4"
            download
          >
            Download Excel
          </a>
        )}

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border-separate border-spacing-x-[1px] shadow-md rounded-md overflow-hidden bg-purple-100">
            <thead>
              <tr>
                {data[0] && Object.keys(data[0]).map((key) => (
                  key !== "Owner" && key !== "Title Reward" && (
                    <th key={key} className="px-3 py-2 text-center font-semibold text-xs bg-gray-100 text-[#37003c]">
                      {key}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t">
                  {Object.entries(row).map(([key, val], j) => {
                    if (key === "Position") {
                      return (
                        <td key={j} className={`px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle(key, val, row)}`}>
                          <div className="text-center font-bold text-lg">{val}</div>
                          <div className="text-center text-xs italic text-purple-700">{positionLabels[val]}</div>
                        </td>
                      );
                    }
                    if (key === "Title Reward") return null;
                    if (key === "Team") {
                      return (
                        <td key={j} className={`px-3 py-2 text-sm border-b border-gray-400 ${getCellStyle(key, val, row)}`}>
                          <div className="text-left font-medium">{val}</div>
                          <div className="text-left text-xs text-gray-600">{row.Owner}</div>
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
