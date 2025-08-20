
'use client'
import { useEffect, useMemo, useState } from 'react'

type VsRow = { opponentTeamId: string; opponentTeam: string; w:number; l:number; d:number; }

export default function MatchupTrackerCard({ ownerName }: { ownerName: string }) {
  const [rows, setRows] = useState<VsRow[]>([])
  const [expanded, setExpanded] = useState(false)
  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tfpl.onrender.com').replace(/\/$/, ''),
    []
  );

  useEffect(()=>{
    if (!ownerName) return
    fetch(`${API_BASE}/api/managers/${encodeURIComponent(ownerName)}/matchups`)
      .then(r=>r.json())
      .then(d=>setRows(d.vs||[]))
      .catch(()=>setRows([]))
  }, [ownerName])

  const score = (r:VsRow) => r.w - r.l + 0.25*r.d
  const sorted = useMemo(()=> [...rows].sort((a,b)=>score(b)-score(a)), [rows])
  const best = sorted.slice(0,3)
  const worst = [...sorted].reverse().slice(0,3)
  const body = expanded ? sorted : [...best, ...worst]

  return (
    <div className="relative rounded-xl bg-gradient-to-r from-blue-200 via-blue-400 to-green-500 text-[#37003c] shadow p-5 overflow-hidden">
      <div className="hero-card-ripple pointer-events-none select-none absolute inset-0"
           style={{backgroundImage: "url('/images/patterns/hero-card-ripple.svg')", backgroundRepeat: "no-repeat", backgroundPosition: "right top", backgroundSize: "cover", zIndex: 1}} />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#38003c]">Matchup Tracker (All-Time)</h3>
        <button onClick={()=>setExpanded(e=>!e)} className="absolute top-3 right-3 bg-[#37003c]/15 hover:bg-[#37003c]/25 text-[#37003c] text-xs font-semibold rounded-full px-4 py-1 transition z-20 pointer-events-auto">
          {expanded ? 'Show Summary' : 'Show All'}
        </button>
      </div>

      {!expanded && (
        <div className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 font-semibold text-[#38003c]">Most Beaten</div>
            {best.map(r=> (
              <div key={`b-${r.opponentTeamId}`} className="flex justify-between rounded-md border border-gray-300 bg-white px-3 py-2">
                <span className="truncate">{r.opponentTeam}</span>
                <span className="font-semibold">{r.w}-{r.l}-{r.d}</span>
              </div>
            ))}
            {!best.length && <div className="text-sm opacity-70">No data yet.</div>}
          </div>
          <div>
            <div className="mb-1 font-semibold text-[#38003c]">Toughest Opponents</div>
            {worst.map(r=> (
              <div key={`w-${r.opponentTeamId}`} className="flex justify-between rounded-md border border-gray-300 bg-white px-3 py-2">
                <span className="truncate">{r.opponentTeam}</span>
                <span className="font-semibold">{r.w}-{r.l}-{r.d}</span>
              </div>
            ))}
            {!worst.length && <div className="text-sm opacity-70">No data yet.</div>}
          </div>
        </div>
      )}

      {expanded && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-[#38003c]">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-2 text-left font-semibold">Opponent</th>
                <th className="py-2 text-center font-semibold">W</th>
                <th className="py-2 text-center font-semibold">L</th>
                <th className="py-2 text-center font-semibold">D</th>
                <th className="py-2 text-center font-semibold">Record</th>
              </tr>
            </thead>
            <tbody>
              {body.map(r => (
                <tr key={r.opponentTeamId} className="border-b border-gray-300">
                  <td className="py-2">{r.opponentTeam}</td>
                  <td className="py-2 text-center">{r.w}</td>
                  <td className="py-2 text-center">{r.l}</td>
                  <td className="py-2 text-center">{r.d}</td>
                  <td className="py-2 text-center font-semibold">{r.w}-{r.l}-{r.d}</td>
                </tr>
              ))}
              {!body.length && (
                <tr><td colSpan={5} className="py-4 text-center opacity-70">No matchups recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
