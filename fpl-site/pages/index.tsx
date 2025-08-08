import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';


export default function Home() {
  const [premier, setPremier] = useState([]);
  const [champ, setChamp] = useState([]);

  useEffect(() => {
    fetch('https://tfpl.onrender.com/api/standings?league=premier')
      .then(res => res.json())
      .then(setPremier);
    fetch('https://tfpl.onrender.com/api/standings?league=championship')
      .then(res => res.json())
      .then(setChamp);
  }, []);

  const renderPreview = (
    data: Record<string, any>[],
    topCount: number,
    bottomCount: number,
    topLabel: string,
    bottomLabel: string
  ) => {
    if (!Array.isArray(data) || data.length === 0)
      return <p className="text-sm">No data available...</p>;

    const top = data.slice(0, topCount);
    const bottom = data.slice(-bottomCount);

    const renderRows = (rows: any[], keyPrefix: string) =>
      rows.map((r, i) => (
        <tr key={keyPrefix + i} className="border-b border-[#37003c]">
          <td className="px-2 py-1 w-6 text-center">{r.Position}</td>
          <td className="px-2 py-1 text-left align-top">
            <div className="leading-tight">
              <div className="text-sm">{r.Team}</div>
              <div className="text-xs text-gray-600">{r.Owner}</div>
            </div>
          </td>
          <td className="px-2 py-1 text-right w-10">{r.Points}</td>
        </tr>
      ));

    return (
      <>
        <div className="text-xs uppercase font-bold text-gray-500 mb-2">
          {topLabel}
        </div>
        <table className="w-full text-sm mb-2 table-fixed">
          <thead>
            <tr className="bg-[#32FF6A] text-[#37003c] text-xs font-bold">
              <th className="text-left px-2 py-1 w-6">#</th>
              <th className="text-left px-2 py-1">Team & Manager</th>
              <th className="text-right px-2 py-1 w-10">Pts</th>
            </tr>
          </thead>
          <tbody>{renderRows(top, 'top')}</tbody>
        </table>

        <div className="text-xs uppercase font-bold text-gray-500 mt-4 mb-2">
          {bottomLabel}
        </div>
        <table className="w-full text-sm mb-2 table-fixed">
          <thead>
            <tr className="bg-[#32FF6A] text-[#37003c] text-xs font-bold">
              <th className="text-left px-2 py-1 w-6">#</th>
              <th className="text-left px-2 py-1">Team & Manager</th>
              <th className="text-right px-2 py-1 w-10">Pts</th>
            </tr>
          </thead>
          <tbody>{renderRows(bottom, 'bot')}</tbody>
        </table>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
       <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
          {/* ripple vector background */}
          <div
              className="pointer-events-none select-none absolute inset-0"
              style={{
                backgroundImage: "url('/images/patterns/navbar_ripple.png')",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center 80%', // Adjust for better centering
                backgroundSize: 'cover', // Ensure it covers full width while keeping aspect ratio
                opacity: 0.12, // Lower opacity to make the ripple more subtle
              }}
          /> 
          {/* Content above ripple */}
          <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Fantasy</h1>
          <NavBar />
      </header>

      <section className="p-4 sm:p-6">
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
