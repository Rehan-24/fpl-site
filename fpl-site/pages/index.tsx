import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import { useStandings } from '@/public/hooks/useStandings';
import useGWDeadline from '@/public/hooks/useGWDeadline';
import { useFACupBracket, BracketMatchup } from '@/public/hooks/useFACupBracket';
import { SEEDS } from '@/lib/facupSeedings';
import Head from 'next/head';



// ── FA Cup preview helpers ────────────────────────────────────────────────────

const ROUND_LABELS: Record<string, string> = {
  r1: "Round 1", r32: "Round of 32", r16: "Round of 16",
  qf: "Quarterfinals", sf: "Semifinals", final: "Final", "3rd": "3rd Place",
};

const ROUND_GW: Record<string, number> = {
  r1: 31, r32: 32, r16: 33, qf: 34, sf: 35, final: 36, "3rd": 36,
};

// Round ordering for finding "current" round
const ROUND_ORDER = ["r1","r32","r16","qf","sf","final","3rd"];

function getSeedName(seed: number | null | undefined): string {
  if (!seed) return "TBD";
  return SEEDS.find(s => s.seed === seed)?.team ?? `Seed ${seed}`;
}

function FACupPreview() {
  const { bracket, currentGw } = useFACupBracket();

  // Find the active round: most advanced round with at least one matchup without a winner
  const activeRound = (() => {
    for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
      const r = ROUND_ORDER[i];
      const roundMatchups = bracket.filter(m => m.round === r);
      if (roundMatchups.length > 0 && roundMatchups.some(m => m.winner_seed == null && m.seed1 != null)) {
        return r;
      }
    }
    return null;
  })();

  // Active matchups: no winner yet, seed1 set
  const activeMatchups = bracket.filter(
    m => m.round === activeRound && m.winner_seed == null && m.seed1 != null
  );

  // Pick 3 randomly (stable across renders using sort by matchup_idx)
  const featured = activeMatchups
    .slice()
    .sort(() => 0) // keep natural order from backend
    .slice(0, 3);

  const roundLabel = activeRound ? ROUND_LABELS[activeRound] ?? activeRound : null;
  const roundGw    = activeRound ? ROUND_GW[activeRound] : null;

  // Between rounds: find the most recently completed round
  const lastCompletedRound = (() => {
    for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
      const r = ROUND_ORDER[i];
      const roundMatchups = bracket.filter(m => m.round === r);
      if (roundMatchups.length > 0 && roundMatchups.every(m => m.winner_seed != null)) {
        return r;
      }
    }
    return null;
  })();

  // Champion (if final is done)
  const finalMatchup = bracket.find(m => m.round === "final");
  const champion = finalMatchup?.winner_seed ? getSeedName(finalMatchup.winner_seed) : null;

  // Count remaining teams
  const eliminated = new Set(
    bracket
      .filter(m => m.winner_seed != null)
      .flatMap(m => [
        m.winner_seed === m.seed1 ? m.seed2 : m.seed1,
      ])
      .filter(Boolean)
  );
  const remaining = 40 - eliminated.size;

  const isLive = (m: BracketMatchup) =>
    !!currentGw && m.gw === currentGw && m.winner_seed == null && m.score1 != null;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">FA Cup</h3>
        {roundLabel && roundGw && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ background: "#37003c", color: "#32FF6A" }}>
            {roundLabel} · GW{roundGw}
          </span>
        )}
      </div>

      {/* Active round: show featured matchups */}
      {featured.length > 0 && (
        <>
          <div className="text-xs uppercase font-bold text-gray-500 mb-2">Featured Matchups</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {featured.map(m => {
              const live = isLive(m);
              const t1 = getSeedName(m.seed1);
              const t2 = m.seed2 ? getSeedName(m.seed2) : (m.round === "r32" ? "W R1" : "TBD");
              return (
                <div key={`${m.round}-${m.matchup_idx}`}
                  className="rounded overflow-hidden text-xs"
                  style={{
                    border: live ? "1px solid #32FF6A" : "0.5px solid #ddd6fe",
                    boxShadow: live ? "0 0 0 2px rgba(50,255,106,.15)" : "none",
                  }}>
                  {/* Match header */}
                  <div className="flex items-center justify-between px-2 py-0.5"
                    style={{ background: live ? "#37003c" : "#f3f0ff" }}>
                    <span className="font-bold tracking-widest uppercase"
                      style={{ fontSize: 9, color: live ? "#32FF6A" : "#7c3aed" }}>
                      {roundLabel}
                    </span>
                    {live && (
                      <span className="font-bold rounded px-1"
                        style={{ fontSize: 8, background: "#32FF6A", color: "#37003c" }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  {/* Row 1 */}
                  <div className="flex items-center justify-between px-2 py-1"
                    style={{ borderBottom: "0.5px solid #ddd6fe" }}>
                    <span className="truncate" style={{ maxWidth: 130 }}>
                      <span className="text-gray-400 mr-1" style={{ fontSize: 9 }}>
                        {m.seed1 ?? ""}
                      </span>
                      {t1}
                    </span>
                    <span className="font-semibold ml-2" style={{ color: "#37003c", minWidth: 20, textAlign: "right" }}>
                      {m.score1 != null ? m.score1 : "—"}
                    </span>
                  </div>
                  {/* Row 2 */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="truncate" style={{ maxWidth: 130 }}>
                      <span className="text-gray-400 mr-1" style={{ fontSize: 9 }}>
                        {m.seed2 ?? ""}
                      </span>
                      <span className={m.seed2 ? "" : "italic text-gray-400"}>{t2}</span>
                    </span>
                    <span className="font-semibold ml-2" style={{ color: "#37003c", minWidth: 20, textAlign: "right" }}>
                      {m.score2 != null ? m.score2 : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Between rounds: bracket progress summary */}
      {featured.length === 0 && (
        <div className="mb-3">
          <div className="text-xs uppercase font-bold text-gray-500 mb-2">Bracket Progress</div>
          <div className="flex flex-col gap-1.5 text-sm">
            {champion ? (
              <div className="rounded p-2 text-center font-semibold"
                style={{ background: "#fef9c3", border: "1px solid #eab308", color: "#92400e" }}>
                🏆 Champion: {champion}
              </div>
            ) : (
              <>
                <div className="flex justify-between py-1" style={{ borderBottom: "0.5px solid #ddd6fe" }}>
                  <span className="text-gray-600">Teams remaining</span>
                  <span className="font-semibold">{remaining} / 40</span>
                </div>
                {lastCompletedRound && (
                  <div className="flex justify-between py-1" style={{ borderBottom: "0.5px solid #ddd6fe" }}>
                    <span className="text-gray-600">Last completed</span>
                    <span className="font-semibold">{ROUND_LABELS[lastCompletedRound]}</span>
                  </div>
                )}
                {/* Show next round */}
                {lastCompletedRound && ROUND_ORDER.indexOf(lastCompletedRound) < ROUND_ORDER.length - 1 && (() => {
                  const nextIdx = ROUND_ORDER.indexOf(lastCompletedRound) + 1;
                  const nextRound = ROUND_ORDER[nextIdx];
                  const nextGw = ROUND_GW[nextRound];
                  return (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Next up</span>
                      <span className="font-semibold">{ROUND_LABELS[nextRound]} · GW{nextGw}</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* View bracket link */}
      <Link href="/facup"
        className="block text-center text-xs font-semibold py-1.5 rounded transition-colors"
        style={{ border: "0.5px solid #5b329e", color: "#5b329e" }}>
        View full bracket →
      </Link>
    </>
  );
}

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
            <FACupPreview />
          </div>
        </div>
      </section>
    </main>
  );
}
