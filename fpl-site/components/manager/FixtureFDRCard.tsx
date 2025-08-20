'use client'
import { useEffect, useState, useMemo } from 'react'

type Fixture = {
  gw: number;
  kickoff_utc?: string | null;      // from backend
  finished?: boolean;
  is_home: boolean;
  opponentTeam: string;             // you use this in render
  opponentManager?: string;         // optional
  score_for?: number | null;
  score_against?: number | null;
  fdr?: 1|2|3|4|5;
}

export default function FixtureFDRCard({ ownerName }: { ownerName: string }) {
  const [rows, setRows] = useState<Fixture[]>([]);
  const [showAll, setShowAll] = useState(false);
  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tfpl.onrender.com').replace(/\/$/, ''),
    []
  );

  useEffect(() => {
  const q = showAll ? "?all=1" : "";
  fetch(`${API_BASE}/api/managers/${encodeURIComponent(ownerName)}/fixtures${q}`)
    .then(r => r.json())
    .then(d => {
      const arr = Array.isArray(d.fixtures) ? d.fixtures : [];
      const mapped: Fixture[] = arr.map((r: any) => ({
        gw: r.gw,
        kickoff_utc: r.kickoff_utc,
        finished: r.finished,
        is_home: r.is_home,
        opponentTeam: r.opponent_team ?? r.opponentTeam ?? "",    // ← map
        opponentManager: r.opponent_owner ?? r.opponentManager,    // ← map
        score_for: r.score_for,
        score_against: r.score_against,
        fdr: r.fdr,
      }));
      setRows(mapped);
    })
    .catch(() => setRows([]));
}, [ownerName, showAll, API_BASE]);


  // Badge color
  const fdrBadge = (n?: number | null) => {
    const base = "inline-flex h-6 w-6 items-center justify-center rounded-md font-semibold";
    if (n == null) return base + " bg-gray-300 text-gray-700";
    if (n >= 4)    return base + " bg-red-500 text-white";
    if (n === 3)   return base + " bg-yellow-400 text-black";
    return           base + " bg-green-500 text-white";
  };

  // Format result if finished
  const resultStr = (fx: Fixture) => {
    if (!fx.finished) return "—";
    const f = fx.score_for ?? 0;
    const a = fx.score_against ?? 0;
    const tag = f === a ? "D" : (f > a ? "W" : "L");
    return `${f}–${a} ${tag}`;
  };

  return (
    <div className="relative rounded-xl bg-gradient-to-r from-blue-200 via-blue-400 to-green-500 text-[#37003c] shadow p-5 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#38003c]">Upcoming Fixtures &amp; FDR</h3>
        <button
          onClick={() => setShowAll(v => !v)}
          className="absolute top-3 right-3 bg-[#37003c]/15 hover:bg-[#37003c]/25 text-[#37003c] text-xs font-semibold rounded-full px-4 py-1 transition z-20 pointer-events-auto">
          {showAll ? 'Show Next 3' : 'Show All'}
        </button>
      </div>
      <div className="hero-card-ripple pointer-events-none select-none absolute inset-0"
           style={{backgroundImage: "url('/images/patterns/hero-card-ripple.svg')", backgroundRepeat: "no-repeat", backgroundPosition: "right top", backgroundSize: "cover", zIndex: 1}} />
      <ul className="divide-y divide-gray-300 relative z-10">
        {rows.map((fx, idx) => (
          <li key={idx} className={`py-2 flex items-center justify-between ${showAll && fx.finished ? 'opacity-60' : ''}`}>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#38003c]">
                GW{fx.gw} · {fx.is_home ? 'Home' : 'Away'} · {resultStr(fx)}
              </div>
              <div className="text-sm text-[#38003c] opacity-90">
                vs <span className="font-semibold">{fx.opponentTeam}</span>
              </div>
            </div>
            <span className={fdrBadge(fx.fdr)} aria-label={`Fixture Difficulty ${fx.fdr ?? '–'}`}>{fx.fdr ?? '–'}</span>
          </li>
        ))}
        {!rows.length && <li className="py-2 text-sm opacity-70">No fixtures found.</li>}
      </ul>
    </div>
  );
}
