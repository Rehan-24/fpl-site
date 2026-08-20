import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import { useStandings } from '@/public/hooks/useStandings';
import useGWDeadline from '@/public/hooks/useGWDeadline';
import { useFACupBracket, BracketMatchup } from '@/public/hooks/useFACupBracket';
import { useProjectedSeeding } from '@/public/hooks/useProjectedSeeding';
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

function getSeedOwner(seed: number | null | undefined): string | null {
  if (!seed) return null;
  return SEEDS.find(s => s.seed === seed)?.owner ?? null;
}

function FACupPreview() {
  const { bracket, currentGw } = useFACupBracket();

  // Determine which round to show:
  // 1. The earliest round with unplayed matchups (upcoming or in-progress)
  //    — this handles the case where GW31 is next and R1 has no scores yet
  // 2. If all rounds are complete, show progress summary
  const displayRound = (() => {
    for (let i = 0; i < ROUND_ORDER.length; i++) {
      const r = ROUND_ORDER[i];
      const roundMatchups = bracket.filter(m => m.round === r);
      // Show this round if it has matchups and at least one has no winner
      if (roundMatchups.length > 0 && roundMatchups.some(m => m.winner_seed == null)) {
        return r;
      }
    }
    return null;
  })();

  const roundLabel = displayRound ? ROUND_LABELS[displayRound] : null;
  const roundGw    = displayRound ? ROUND_GW[displayRound] : null;

  // All matchups for the display round that haven't been decided yet
  const featured = bracket
    .filter(m => m.round === displayRound && m.winner_seed == null)
    .sort((a, b) => a.matchup_idx - b.matchup_idx)
    .slice(0, 4);

  // Between-rounds summary data
  const lastCompletedRound = (() => {
    for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
      const r = ROUND_ORDER[i];
      const roundMatchups = bracket.filter(m => m.round === r);
      if (roundMatchups.length > 0 && roundMatchups.every(m => m.winner_seed != null)) return r;
    }
    return null;
  })();

  const finalMatchup = bracket.find(m => m.round === "final");
  const champion = finalMatchup?.winner_seed ? getSeedName(finalMatchup.winner_seed) : null;

  const eliminated = new Set(
    bracket
      .filter(m => m.winner_seed != null)
      .map(m => m.winner_seed === m.seed1 ? m.seed2 : m.seed1)
      .filter(Boolean)
  );
  const remaining = 40 - eliminated.size;

  const isLive = (m: BracketMatchup) =>
    !!currentGw && m.gw === currentGw && m.winner_seed == null && m.score1 != null;

  return (
    <>
      {/* Header — matches Premier/Championship style */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold">FA Cup</h3>
        {roundLabel && roundGw && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ background: "#37003c", color: "#32FF6A" }}>
            {roundLabel} · GW{roundGw}
          </span>
        )}
      </div>

      {featured.length > 0 ? (
        <>
          <div className="text-xs uppercase font-bold text-gray-500 mb-2">Matchups</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {featured.map(m => {
              const live = isLive(m);
              const t1 = getSeedName(m.seed1);
              const t2 = m.seed2 ? getSeedName(m.seed2) : "TBD";
              return (
                <div key={`${m.round}-${m.matchup_idx}`}
                  className="rounded overflow-hidden text-xs"
                  style={{
                    border: live ? "1px solid #32FF6A" : "0.5px solid #ddd6fe",
                    boxShadow: live ? "0 0 0 2px rgba(50,255,106,.15)" : "none",
                  }}>
                  {/* Match header — green like table headers */}
                  <div className="flex items-center justify-between px-2 py-1"
                    style={{ background: "#32FF6A" }}>
                    <span className="font-bold text-[10px] uppercase tracking-wide"
                      style={{ color: "#37003c" }}>
                      {roundLabel}
                    </span>
                    {live && (
                      <span className="font-bold rounded px-1"
                        style={{ fontSize: 8, background: "#37003c", color: "#32FF6A" }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  {/* Row 1 */}
                  <div className="flex items-center justify-between px-2 py-1.5"
                    style={{ borderBottom: "0.5px solid #ddd6fe" }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 flex-shrink-0" style={{ fontSize: 9, minWidth: 14 }}>
                          {m.seed1}
                        </span>
                        <span className="text-sm truncate">{t1}</span>
                      </div>
                      {getSeedOwner(m.seed1) && (
                        <div className="text-xs text-gray-600 no-underline hover:underline focus-visible:underline" style={{ paddingLeft: 18 }}>
                          <Link href={`/managers/${encodeURIComponent(getSeedOwner(m.seed1)!)}`}>
                            {getSeedOwner(m.seed1)}
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="font-semibold ml-2 flex-shrink-0" style={{ color: "#37003c" }}>
                      {m.score1 != null ? m.score1 : "—"}
                    </span>
                  </div>
                  {/* Row 2 */}
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 flex-shrink-0" style={{ fontSize: 9, minWidth: 14 }}>
                          {m.seed2 ?? ""}
                        </span>
                        <span className={`text-sm truncate ${!m.seed2 ? "italic text-gray-400" : ""}`}>
                          {t2}
                        </span>
                      </div>
                      {getSeedOwner(m.seed2) && (
                        <div className="text-xs text-gray-600 no-underline hover:underline focus-visible:underline" style={{ paddingLeft: 18 }}>
                          <Link href={`/managers/${encodeURIComponent(getSeedOwner(m.seed2)!)}`}>
                            {getSeedOwner(m.seed2)}
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="font-semibold ml-2 flex-shrink-0" style={{ color: "#37003c" }}>
                      {m.score2 != null ? m.score2 : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        // Between rounds or finished: podium if complete, bracket progress otherwise
        <div className="mb-3">
          {champion ? (
            <>
              <div className="text-xs uppercase font-bold text-gray-500 mb-2">2025/26 Results</div>
              <div className="flex flex-col gap-2">
                {/* Champion */}
                {(() => {
                  const thirdMatchup = bracket.find(m => m.round === "3rd");
                  const runnerUp = finalMatchup?.winner_seed === finalMatchup?.seed1
                    ? getSeedName(finalMatchup?.seed2)
                    : getSeedName(finalMatchup?.seed1);
                  const runnerUpSeed = finalMatchup?.winner_seed === finalMatchup?.seed1
                    ? finalMatchup?.seed2 : finalMatchup?.seed1;
                  const thirdPlace = thirdMatchup?.winner_seed
                    ? getSeedName(thirdMatchup.winner_seed) : null;
                  const thirdSeed = thirdMatchup?.winner_seed;
                  const podium = [
                    { label: "Champion",   emoji: "🥇", team: champion,    seed: finalMatchup?.winner_seed, bg: "#fefce8", border: "#eab308", badgeBg: "#fef3c7", badgeColor: "#92400e" },
                    { label: "Runner-up",  emoji: "🥈", team: runnerUp,    seed: runnerUpSeed,              bg: "#f9fafb", border: "#d1d5db", badgeBg: "#f3f4f6", badgeColor: "#6b7280" },
                    { label: "3rd Place",  emoji: "🥉", team: thirdPlace,  seed: thirdSeed,                 bg: "#fff7ed", border: "#d97706", badgeBg: "#ffedd5", badgeColor: "#92400e" },
                  ];
                  return podium.filter(p => p.team).map(p => (
                    <div key={p.label} className="rounded overflow-hidden"
                      style={{ border: `1.5px solid ${p.border}` }}>
                      <div className="flex items-center gap-1.5 px-2 py-1"
                        style={{ background: "#32FF6A" }}>
                        <span style={{ fontSize: 14 }}>{p.emoji}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: "#37003c" }}>{p.label}</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-2"
                        style={{ background: p.bg }}>
                        <div>
                          <div className="text-sm font-medium" style={{ color: "#37003c" }}>{p.team}</div>
                          {getSeedOwner(p.seed) && (
                            <div className="text-xs text-gray-600 no-underline hover:underline focus-visible:underline mt-0.5">
                              <Link href={`/managers/${encodeURIComponent(getSeedOwner(p.seed)!)}`}>
                                {getSeedOwner(p.seed)}
                              </Link>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                          style={{ background: p.badgeBg, color: p.badgeColor }}>
                          Seed {p.seed}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs uppercase font-bold text-gray-500 mb-2">Bracket Progress</div>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between py-1 border-b border-[#ddd6fe]">
                  <span className="text-gray-600">Teams remaining</span>
                  <span className="font-semibold">{remaining} / 40</span>
                </div>
                {lastCompletedRound && (
                  <div className="flex justify-between py-1 border-b border-[#ddd6fe]">
                    <span className="text-gray-600">Last completed</span>
                    <span className="font-semibold">{ROUND_LABELS[lastCompletedRound]}</span>
                  </div>
                )}
                {lastCompletedRound && ROUND_ORDER.indexOf(lastCompletedRound) < ROUND_ORDER.length - 1 && (() => {
                  const nextRound = ROUND_ORDER[ROUND_ORDER.indexOf(lastCompletedRound) + 1];
                  return (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Next up</span>
                      <span className="font-semibold">{ROUND_LABELS[nextRound]} · GW{ROUND_GW[nextRound]}</span>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}

      <ProjectedSeedingTeaser />

      <Link href="/facup"
        className="block text-center text-xs font-semibold py-1.5 rounded transition-colors"
        style={{ border: "0.5px solid #5b329e", color: "#5b329e" }}>
        View full bracket →
      </Link>
    </>
  );
}

function ProjectedSeedingTeaser() {
  const { seeds, byes, basis, loading, error } = useProjectedSeeding();

  if (loading || error || seeds.length === 0) return null;

  const top = seeds.slice(0, 4);
  const isAlphabetical = (basis || "").startsWith("alphabetical");

  return (
    <div className="mb-3 pt-3 border-t border-[#ddd6fe]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs uppercase font-bold text-gray-500">Next Season's Projected Seeding</span>
        {isAlphabetical && (
          <span className="text-[9px] font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
            preseason
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {top.map((s) => (
          <div key={s.seed} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-purple-300 font-bold w-4 flex-shrink-0">{s.seed}</span>
              <span className="truncate">{s.owner}</span>
              {s.seed <= byes && (
                <span className="text-[8px] font-bold bg-green-100 text-green-800 px-1 rounded flex-shrink-0">
                  BYE
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
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
