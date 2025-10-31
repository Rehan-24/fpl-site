'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useManagers } from '@/public/hooks/useManagers'

type Fixture = {
  gw: number;
  kickoff_utc?: string | null;
  finished?: boolean;
  is_home: boolean;
  opponentTeam: string;
  opponentManager?: string;
  score_for?: number | null;
  score_against?: number | null;
  fdr?: 1|2|3|4|5;
}

export default function FixtureFDRCard({ ownerName }: { ownerName: string }) {
  const [rows, setRows] = useState<Fixture[]>([]);
  const [showAll, setShowAll] = useState(false);

  // managers list for mapping Team -> { name, fpl_team_url }
  const { data: managersData } = useManagers();
  const managersByTeam = useMemo(() => {
    const m = new Map<string, { name?: string; fpl?: string | null | undefined }>();
    (managersData || []).forEach((mgr: any) => {
      const key = String(mgr?.team || mgr?.team_name || '').trim().toLowerCase();
      if (!key) return;
      m.set(key, { name: mgr?.name || mgr?.owner || mgr?.owner_name, fpl: mgr?.fpl_team_url || null });
    });
    return m;
  }, [managersData]);

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
          opponentTeam: r.opponent_team ?? r.opponentTeam ?? "",
          opponentManager: r.opponent_owner ?? r.opponentManager,
          score_for: r.score_for,
          score_against: r.score_against,
          fdr: r.fdr,
        }));
        setRows(mapped);
      })
      .catch(() => setRows([]));
  }, [ownerName, showAll, API_BASE]);

  // Badge color (matches your screenshot)
  const fdrBadge = (n?: number | null) => {
    const base = "inline-flex h-6 w-6 items-center justify-center rounded-md font-semibold";
    if (n == null || n < 1 || n > 5) return base + " bg-gray-300 text-gray-700";
    const map: Record<number, string> = {
      1: "bg-[#00f28a] text-white",
      2: "bg-[#00f28a] text-white",
      3: "bg-[#e5e5e5] text-gray-700",
      4: "bg-[#ff2a5c] text-white",
      5: "bg-[#6b0f2b] text-white",
    };
    return `${base} ${map[n]}`;
  };

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
        {rows.map((fx, idx) => {
          const teamKey = String(fx.opponentTeam || "").trim().toLowerCase();
          const meta = managersByTeam.get(teamKey);
          const mgrName = fx.opponentManager || meta?.name || "";
          const fplUrl = meta?.fpl || null;

          return (
            <li key={idx} className={`py-2 flex items-center justify-between ${showAll && fx.finished ? 'opacity-60' : ''}`}>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#38003c]">
                  GW{fx.gw} · {fx.is_home ? 'Home' : 'Away'} · {resultStr(fx)}
                </div>
                <div className="text-sm text-[#38003c] opacity-90 no-underline hover:underline focus-visible:underline">
                  vs{" "}
                  <span className="font-semibold">
                    {fplUrl ? (
                      <a href={fplUrl} target="_blank" rel="noreferrer">
                        {fx.opponentTeam}
                      </a>
                    ) : (
                      fx.opponentTeam
                    )}
                  </span>
                  {mgrName ? (
                    <>
                      {" "}
                      (
                      <Link href={`/managers/${encodeURIComponent(mgrName)}`}>
                        {mgrName}
                      </Link>
                      )
                    </>
                  ) : null}
                </div>
              </div>
              <span className={fdrBadge(fx.fdr)} aria-label={`Fixture Difficulty ${fx.fdr ?? '–'}`}>
                {fx.fdr ?? '–'}
              </span>
            </li>
          );
        })}
        {!rows.length && <li className="py-2 text-sm opacity-70">No fixtures found.</li>}
      </ul>
    </div>
  );
}
