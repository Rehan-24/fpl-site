import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [premier, setPremier] = useState([]);
  const [champ, setChamp] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/standings?league=premier')
      .then(res => res.json())
      .then(setPremier);
    fetch('http://localhost:8000/api/standings?league=championship')
      .then(res => res.json())
      .then(setChamp);
  }, []);

  const renderPreview = (data, topCount, bottomCount, topLabel, bottomLabel) => {
    if (!Array.isArray(data) || data.length === 0) return <p className="text-sm">No data available...</p>;
    const top = data.slice(0, topCount);
    const bottom = data.slice(-bottomCount);
    return (
      <>
        <div className='text-xs uppercase font-bold text-gray-500 mb-2'>{topLabel}</div>
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="bg-[#32FF6A] -200">
              <th className="text-left px-2 py-1">#</th>
              <th className="text-left px-2 py-1">Team & Manager</th>
              <th className="text-right px-2 py-1">Pts</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r, i) => (
              <tr key={"top" + i} className="border-b">
                <td className="px-2 py-1 w-[15px] text-center">{r.Position}</td>
                <td className="px-2 py-1 text-left align-top">
                  <div className="flex flex-col items-start justify-start leading-tight">
                    <div className="text-sm m-0 p-0">{r.Team}</div>
                    <div className="text-xs text-gray-600 m-0 p-0">{r.Owner}</div>
                  </div>
                </td>
                <td className="px-2 py-1 text-right">{r.Points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-xs uppercase font-bold text-gray-500 mt-4 mb-2">{bottomLabel}</div>
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="bg-[#32FF6A]">
              <th className="text-left px-2 py-1">#</th>
              <th className="text-left px-2 py-1">Team & Manager</th>
              <th className="text-right px-2 py-1">Pts</th>
            </tr>
          </thead>
          <tbody>
            {bottom.map((r, i) => (
              <tr key={"bot" + i} className="border-b">
                <td className="px-1 py-1 w-[15px] text-left">{r.Position}</td>
                <td className="pr-2 py-1 text-left align-top">
                  <div className="flex flex-col items-start justify-start leading-tight">
                    <div className="px-2 text-sm m-0 p-0">{r.Team}</div>
                    <div className="px-2 text-xs text-gray-600 m-0 p-0">{r.Owner}</div>
                  </div>
                </td>
                <td className="px-2 py-1 text-right">{r.Points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="text-4xl font-bold text-[#37003c]">Fantasy </h1>
        <nav className="mt-4 flex gap-4">
          <Link href="/"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">Home</button></Link>
          <Link href="/premier"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">Premier</button></Link>
          <Link href="/championship"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">Championship</button></Link>
          <Link href="/facup"><button className="bg-[#32FF6A] text-[#37003c] px-4 py-2 rounded font-semibold shadow">FA Cup</button></Link>
        </nav>
      </header>

      <section className="p-6">
        <h2 className="text-2xl font-bold mb-4">League Previews</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-purple-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">Premier League</h3>
            {renderPreview(premier, 6, 4, 'Title Chase', 'Relegation Battle')}
          </div>
          <div className="bg-purple-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">Championship</h3>
            {renderPreview(champ, 4, 4, 'Promotion Hopes', 'Shameful Behavior')}
          </div>
          <div className="bg-purple-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">FA Cup</h3>
            <p className="text-sm">Seeding – begins January</p>
          </div>
        </div>
      </section>
    </main>
  );
}
