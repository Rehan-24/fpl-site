'use client'
import { useEffect, useMemo, useState } from 'react'

type ApiFixture = {
  gw: number
  kickoff_utc: string | null
  finished: boolean
  is_home: boolean
  opponent_owner: string
  opponent_team: string
  score_for: number | null
  score_against: number | null
  fdr?: 1 | 2 | 3 | 4 | 5
}

type UiFixture = {
  gw: number
  kickoffUtc: string | null
  finished: boolean
  homeAway: 'H' | 'A'
  opponentTeam: string
  opponentOwner: string
  fdr?: 1 | 2 | 3 | 4 | 5
}

export default function FixtureFDRCard({ ownerName }: { ownerName: string }) {
  const [apiRows, setApiRows] = useState<ApiFixture[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const q = showAll ? '?all=1' : ''
        const res = await fetch(`/api/managers/${encodeURIComponent(ownerName)}/fixtures${q}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setApiRows(Array.isArray(data?.fixtures) ? data.fixtures : [])
      } catch (e: any) {
        if (e.name !== 'AbortError') setError('Failed to load fixtures')
        setApiRows([])
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => ctrl.abort()
  }, [ownerName, showAll])

  // Map API → UI
  const fixtures: UiFixture[] = useMemo(
    () =>
      apiRows.map((r) => ({
        gw: r.gw,
        kickoffUtc: r.kickoff_utc,
        finished: !!r.finished,
        homeAway: r.is_home ? 'H' : 'A',
        opponentTeam: r.opponent_team,
        opponentOwner: r.opponent_owner,
        fdr: r.fdr,
      })),
    [apiRows]
  )

  const fdrBadge = (n: number | undefined) => {
    const val = n ?? 3
    const base =
      'inline-flex h-6 w-6 items-center justify-center rounded-md font-semibold'
    if (val >= 4) return base + ' bg-red-500 text-white'
    if (val === 3) return base + ' bg-yellow-400 text-black'
    return base + ' bg-green-500 text-white'
  }

  const isPast = (fx: UiFixture) => {
    if (fx.finished) return true
    if (!fx.kickoffUtc) return false
    return new Date(fx.kickoffUtc) < new Date()
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : 'TBD'

  return (
    <div className="relative rounded-xl bg-gradient-to-r from-blue-200 via-blue-400 to-green-500 text-[#37003c] shadow p-5 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#38003c]">
          Fixtures &amp; FDR (active season)
        </h3>
        <button
          onClick={() => setShowAll((s) => !s)}
          className="absolute top-3 right-3 bg-[#37003c]/15 hover:bg-[#37003c]/25 text-[#37003c] text-xs font-semibold rounded-full px-4 py-1 transition z-20 pointer-events-auto"
        >
          {showAll ? 'Show next 3' : 'Show all'}
        </button>
      </div>

      <div
        className="hero-card-ripple pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage: "url('/images/patterns/hero-card-ripple.svg')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right top',
          backgroundSize: 'cover',
          zIndex: 1,
        }}
      />

      {loading && (
        <div className="py-2 text-sm opacity-70">Loading fixtures…</div>
      )}
      {error && <div className="py-2 text-sm opacity-70">{error}</div>}

      {!loading && !error && (
        <ul className="divide-y divide-gray-300 relative z-10">
          {fixtures.map((fx, idx) => (
            <li
              key={`${fx.gw}-${fx.opponentOwner}-${fx.kickoffUtc ?? 'na'}-${idx}`}
              className={`py-2 flex items-center justify-between ${
                isPast(fx) ? 'opacity-60' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#38003c]">
                  GW{fx.gw} · {fx.homeAway === 'H' ? 'Home' : 'Away'} ·{' '}
                  {formatDate(fx.kickoffUtc)}
                </div>
                <div className="text-sm text-[#38003c] opacity-90">
                  vs <span className="font-semibold">{fx.opponentTeam}</span>{' '}
                  (<span className="italic">{fx.opponentOwner}</span>)
                </div>
              </div>
              <span
                className={fdrBadge(fx.fdr)}
                aria-label={`Fixture Difficulty ${fx.fdr ?? 3}`}
                title={`FDR ${fx.fdr ?? 3}`}
              >
                {fx.fdr ?? 3}
              </span>
            </li>
          ))}
          {!fixtures.length && (
            <li className="py-2 text-sm opacity-70">
              No fixtures found for this season.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
