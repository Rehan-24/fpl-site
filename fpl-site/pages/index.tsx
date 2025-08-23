import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import { useStandings } from '@/public/hooks/useStandings';
import useGWDeadline from '@/public/hooks/useGWDeadline';
import Head from 'next/head';


export default function Home() {
  const {data: premierData, usingCache} = useStandings('premier');
  const {data: championshipData} = useStandings('championship');
  const { gwInfo, loading, error } = useGWDeadline();

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
              <div className="text-xs text-gray-600 text-left no-underline hover:underline focus-visible:underline">
                <Link href={`/managers/${encodeURIComponent(r.Owner)}`}>
                  {r.Owner}
                </Link>
              </div>
            </div>
          </td>
          <td className="px-2 py-1 text-right w-10">{r.Points}</td>
        </tr>
      ));

    return (
      <>
        <Head>
          <title>The Fantasy Premier League Home</title>
          <meta property="og:title" content="THE Fantasy Premier League" />
          <meta property="og:description" content="Quick Overview of Each League" />
          <meta property="og:image" content="https://thefootballcastle.com/wp-content/uploads/2021/12/FANTASY-PREMIER-LEAGUE-HEADER-1.jpg" />
          <meta property="og:url" content="https://tfpl.vercel.app/" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="THE Fantasy Premier League" />
        </Head>

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
            <tbody>
            {bottom.map((r, i) => (
              <tr key={"bot" + i} className="border-b">
                <td className="px-1 py-1 w-[15px] text-left">{r.Position}</td>
                <td className="pr-2 py-1 text-left align-top">
                  <div className="flex flex-col items-start justify-start leading-tight">
                    <div className="px-2 text-sm m-0 p-0">{r.Team}</div>
                    <div className="px-2 text-xs text-gray-600 m-0 p-0 no-underline hover:underline focus-visible:underline">
                      <Link href={`/managers/${encodeURIComponent(r.Owner)}`}>
                        {r.Owner}
                      </Link>
                    </div>
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
       <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
               {/* ripple vector background */}
               <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
                     
               {/* Content above ripple */}
               <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Fantasy</h1>
                     
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

      <section className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-4">League Previews</h2>
          {(usingCache) && (
            <span className="ml-3 inline-block text-[11px] bg-yellow-200 text-[#37003c] px-2 py-0.5 rounded mb-4">
              Viewing cache, information may be outdated
            </span>
          )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-purple-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">Premier League</h3>
            {renderPreview((premierData ?? []), 6, 5, 'Title Chase', 'Relegation Battle')}
          </div>
          <div className="bg-purple-100 p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-2">Championship</h3>
            {renderPreview((championshipData ?? []), 6, 5, 'Promotion Hopes', 'Shameful Behavior')}
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
