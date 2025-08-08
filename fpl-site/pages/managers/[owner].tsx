import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import NavBar from '../../components/NavBar'

interface Manager {
  name: string;
  team: string;
  current_league: string;
  years_playing: number;
  best_finish: string | null;
  titles: number;
  titles_list: string;
  bio: string;
  image_url: string;
  fpl_team_url: string;
}

export default function ManagerBio() {
  const { query, isReady } = useRouter()
  const ownerSlug = Array.isArray(query.owner) ? query.owner[0] : query.owner
  const [manager, setManager] = useState<Manager | null>(null)

  useEffect(() => {
    if (!isReady || !ownerSlug) return
    const ownerName = decodeURIComponent(ownerSlug)
    fetch(`https://tfpl.onrender.com/api/managers?owner=${encodeURIComponent(ownerName)}`)
      .then(r => r.json())
      .then(setManager)
      .catch(console.error)
  }, [isReady, ownerSlug])

  if (!manager) return <p className="p-6">Loading…</p>
  if ((manager as any).error)
    return <p className="p-6 text-red-600">Manager not found</p>

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100">
      <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-[#37003c]">Team Bio</h1>
        <NavBar />
      </header>

      <section className="p-6 max-w-3xl mx-auto space-y-6">
        <Link href="/managers" className="text-blue-700 hover:underline">&larr; Back to Team Bios</Link>

        <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow p-6">
          <img
            src={manager.image_url}
            alt={manager.name}
            className="w-32 h-32 rounded-full border mr-6 mb-4 md:mb-0"
          />

          <div className="flex-1">
            <h2 className="text-3xl font-bold text-[#37003c]">{manager.name}</h2>
            <p className="text-sm text-gray-600">
              {manager.team} &mdash; {manager.current_league}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Years playing:</strong> {manager.years_playing}
              </div>
              <div>
                <strong>Best finish:</strong> {manager.best_finish ?? 'N/A'}
              </div>
              <div>
                <strong>Titles won:</strong> {manager.titles_list || 'None'}
              </div>
              <div>
                <strong>FPL team:</strong>{' '}
                {manager.fpl_team_url && manager.fpl_team_url !== 'TBD' ? (
                  <a
                    href={manager.fpl_team_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    View on FPL
                  </a>
                ) : 'TBD'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-gray-700 leading-relaxed">
          {manager.bio}
        </div>
      </section>
    </main>
  )
}
