import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import NavBar from '../../components/NavBar'

type TrophyKey = 'premier' | 'fa' | 'championship';
type Trophy = { type: TrophyKey; count: number };

interface Manager {
  name: string;
  team: string;
  favorite_club: string;
  placements: number | string;
  image_url: string;
  social_url: string;
  titles: number;
  trophies?: Trophy[];
}

const TROPHY_ICONS: Record<TrophyKey, string> = {
  premier: '/images/trophies/prem_trophy.png',
  fa: '/images/trophies/fa_cup_trophy.png',
  championship: '/images/trophies/championship_trophy.png',
};

// repeat each trophy icon by its count
const expandTrophies = (ts?: Trophy[]): TrophyKey[] =>
  (ts ?? []).flatMap((t) => Array.from({ length: t.count ?? 0 }, () => t.type));


export default function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([])

  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
  const q = search.trim().toLowerCase()
  if (!q) return managers
  return managers.filter(m =>
    [m.name, m.team, m.favorite_club].some(v =>
      (v || '').toLowerCase().includes(q)
    )
  )
}, [managers, search])


  useEffect(() => {
    fetch('https://tfpl.onrender.com/api/managers')
      .then(res => res.json())
      .then(setManagers)
      .catch(console.error)
  }, [])


  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 p-6 shadow-lg">
        <h1 className="font-bold text-4xl text-[#37003c] text-center sm:text-left">Managers</h1>
        <NavBar />
      </header>

      <section className="p-6">
        {/* Search */}
        <div className="max-w-xl mb-4">
          <label htmlFor="manager-search" className="sr-only">Search managers</label>
          <div className="flex items-center gap-2">
            <input
              id="manager-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by manager, team, or club…"
              className="w-full rounded-md border border-[#37003c]/20 bg-white px-3 py-2 text-[#37003c] placeholder-[#37003c]/50 shadow focus:outline-none focus:ring-2 focus:ring-[#37003c]/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="rounded-md bg-[#32FF6A] px-3 py-2 text-sm font-semibold text-[#37003c] shadow"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-1 text-xs text-[#37003c]/70">
            Showing {filtered.length} of {managers.length}
          </div>
        </div>

        {/* Desktop/Tablet: table */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-purple-100 rounded-lg shadow overflow-hidden">
              <thead>
                <tr className="bg-[#37003c]">
                  <th className="pl-10 pr-4 py-3 text-left text-sm font-semibold text-white">Manager</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Manages</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Favorite Club</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-white">Placements</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-white">Titles</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-white">Follow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(m => (
                  <tr key={m.name} className="hover:bg-purple-50">
                    <td className="px-6 py-4 whitespace-nowrap"> 
                      <div className="flex items-center">
                        <img
                          src={m.image_url}
                          alt={m.name}
                          className="w-10 h-10 rounded-full mr-3 border"
                        />
                        <Link
                          href={`/managers/${encodeURIComponent(m.name)}`}
                          className="text-[#37003c] font-medium hover:underline"
                        >
                          {m.name}
                        </Link>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{m.team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{m.favorite_club || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{m.placements ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">{m.titles ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {m.social_url ? (
                        <a
                          href={m.social_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-[#32FF6A] text-[#37003c] px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          Follow
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>

                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#37003c]/70">
                      No matches for “{search}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: cards */}
                <div className="grid md:hidden gap-3">
          {filtered.map(m => (
            <div
              key={m.name}
              className="bg-purple-100 rounded-lg shadow p-3"
            >
              <div className="flex gap-3 items-center">
                {/* Left: avatar */}
                <img
                  src={m.image_url}
                  alt={m.name}
                  className="w-12 h-12 rounded-full border flex-shrink-0"
                />

                {/* Middle: info */}
                <div className="flex-1"> 
                  <div className="flex items-center flex-wrap gap-1">
                    <Link
                      href={`/managers/${encodeURIComponent(m.name)}`}
                      className="font-semibold text-[#37003c] hover:underline"
                    >
                      {m.name}
                    </Link>
                    <span className="inline-flex items-center flex-wrap gap-1 ml-1 align-middle">
                      {expandTrophies(m.trophies).map((t: TrophyKey, idx: number) => (
                        <img
                          key={`${t}-${idx}`}
                          src={TROPHY_ICONS[t]}
                          alt={`${t} trophy`}
                          className="w-4 h-4 inline-block align-middle"
                          loading="lazy"
                          onError={(e) => {
                            // Helps you see it's a path problem
                            console.warn('Missing trophy icon:', TROPHY_ICONS[t]);
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">{m.team} // {m.favorite_club}</div>
                  {/* Placements under fav club */}
                  <div className="text-xs text-gray-600">Placements: {m.placements}</div>
                </div>

                {/* Right: follow button, vertically centered */}
                <div className="pl-2 flex items-center">
                  <a
                    href={m.social_url || '#'}
                    target={m.social_url}
                    rel={m.social_url}
                    className={`bg-[#32FF6A] text-[#37003c] px-3 py-1 rounded-full text-xs font-semibold ${m.social_url ? '' : 'opacity-60 pointer-events-none'}`}
                  >
                    Follow
                  </a>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-center text-[#37003c]/70 py-6">
              No matches for “{search}”.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
