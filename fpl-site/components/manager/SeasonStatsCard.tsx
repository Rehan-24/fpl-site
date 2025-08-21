
'use client'
import { useEffect, useState, useMemo } from 'react'

type SeasonRow = { season:string; placement:number|null; points:number; score:number; overallRank:number|null }

export default function SeasonStatsCard({ ownerName }: { ownerName: string }) {
  const [rows, setRows] = useState<SeasonRow[]>([])
  const API_BASE = useMemo(
      () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tfpl.onrender.com').replace(/\/$/, ''),
      []
  );

  useEffect(()=>{
    if (!ownerName) return
    fetch(`${API_BASE}/api/managers/${encodeURIComponent(ownerName)}/seasons`)
      .then(r=>r.json())
      .then(d=>setRows(d.stats||[]))
      .catch(()=>setRows([]))
  }, [ownerName])

  return (
    <div className="relative rounded-xl bg-gradient-to-r from-blue-200 via-blue-400 to-green-500 text-[#37003c] shadow p-5 overflow-hidden">
      <div className="hero-card-ripple pointer-events-none select-none absolute inset-0"
           style={{backgroundImage: "url('/images/patterns/hero-card-ripple.svg')", backgroundRepeat: "no-repeat", backgroundPosition: "right top", backgroundSize: "cover", zIndex: 1}} />
      <h3 className="mb-3 text-lg font-bold text-[#38003c]">Season Stats (All-Time)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-[#38003c]">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="py-2 text-left font-semibold">Season</th>
              <th className="py-2 text-center font-semibold">Placement</th>
              <th className="py-2 text-center font-semibold">Points</th>
              <th className="py-2 text-center font-semibold">Score</th>
              <th className="py-2 text-center font-semibold">Overall Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.season} className="border-b border-gray-300">
                <td className="py-2">{r.season}</td>
                <td className="py-2 text-center">{r.placement ?? '—'}</td>
                <td className="py-2 text-center">{r.points}</td>
                <td className="py-2 text-center">{r.score}</td>
                <td className="py-2 text-center">{r.overallRank ? r.overallRank.toLocaleString() : '—'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} className="py-4 text-center opacity-70">No seasons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
