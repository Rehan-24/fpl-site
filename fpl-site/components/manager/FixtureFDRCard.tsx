
'use client'
import { useEffect, useState } from 'react'

type Fixture = {
  gw: number;
  date: string;
  opponentTeam: string;
  opponentManager: string;
  homeAway: 'H'|'A';
  fdr?: 1|2|3|4|5;
}

export default function FixtureFDRCard({ ownerName }: { ownerName: string }) {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!ownerName) return
    fetch(`/api/managers/${encodeURIComponent(ownerName)}/fixtures`)
      .then(r=>r.json())
      .then(d=>setFixtures(d.fixtures||[]))
      .catch(()=>setFixtures([]))
  }, [ownerName])

  const shown = expanded ? fixtures : fixtures.slice(0,3)

  const fdrBadge = (n: number|undefined) => {
    const val = n ?? 3
    const base = "inline-flex h-6 w-6 items-center justify-center rounded-md font-semibold"
    if (val >= 4) return base + " bg-red-500 text-white"
    if (val === 3) return base + " bg-yellow-400 text-black"
    return base + " bg-green-500 text-white"
  }

  return (
    <div className="relative rounded-xl bg-gradient-to-r from-blue-200 via-blue-400 to-green-500 text-[#37003c] shadow p-5 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#38003c]">Upcoming Fixtures &amp; FDR</h3>
        <button onClick={()=>setExpanded(e=>!e)} className="absolute top-3 right-3 bg-[#37003c]/15 hover:bg-[#37003c]/25 text-[#37003c] text-xs font-semibold rounded-full px-4 py-1 transition z-20 pointer-events-auto">
          {expanded ? 'Show Next 3' : 'Show All'}
        </button>
      </div>
      <div className="hero-card-ripple pointer-events-none select-none absolute inset-0"
           style={{backgroundImage: "url('/images/patterns/hero-card-ripple.svg')", backgroundRepeat: "no-repeat", backgroundPosition: "right top", backgroundSize: "cover", zIndex: 1}} />
      <ul className="divide-y divide-gray-300">
        {shown.map((fx, idx) => (
          <li key={idx} className="py-2 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#38003c]">
                GW{fx.gw} · {fx.homeAway === 'H' ? 'Home' : 'Away'} · {new Date(fx.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-[#38003c] opacity-90">
                vs <span className="font-semibold">{fx.opponentTeam}</span> (<span className="italic">{fx.opponentManager}</span>)
              </div>
            </div>
            <span className={fdrBadge(fx.fdr)} aria-label={`Fixture Difficulty ${fx.fdr ?? 3}`}>{fx.fdr ?? 3}</span>
          </li>
        ))}
        {!shown.length && <li className="py-2 text-sm opacity-70">No upcoming fixtures found.</li>}
      </ul>
    </div>
  )
}
