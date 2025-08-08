import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Manager {
  name: string
  team: string
  current_league: string
  years_playing: number
  best_finish: string | null
  titles: number
  bio: string
  image_url: string
  fpl_team_url: string
}

export default function ManagerBio() {
  const { query, isReady } = useRouter()
  const ownerSlug = Array.isArray(query.owner) ? query.owner[0] : query.owner
  const [manager, setManager] = useState<Manager | null>(null)

  useEffect(() => {
    if (!isReady || !ownerSlug) return
    const ownerName = decodeURIComponent(ownerSlug)
    fetch(`https://tfpl.onrender.com/api/managers?owner=${encodeURIComponent(ownerName)}`)
      .then((res) => res.json())
      .then(setManager)
      .catch(console.error)
  }, [isReady, ownerSlug])

  if (!manager) return <p className="p-6">Loading…</p>
  if ((manager as any).error) return <p className="p-6 text-red-600">Manager not found</p>

  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <Link href="/managers" className="underline"> &larr; Back to Team Bios </Link>

      <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-6">
        <img src={manager.image_url} alt={manager.name} className="w-32 h-32 rounded-full border" />
        <div>
          <h1 className="text-3xl font-bold">{manager.name}</h1>
          <p className="text-sm text-gray-600">{manager.team} &mdash; {manager.current_league}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <p>{manager.bio}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Years playing:</strong> {manager.years_playing}</li>
          <li><strong>Best finish:</strong> {manager.best_finish ?? 'N/A'}</li>
          <li><strong>Titles:</strong> {manager.titles}</li>
          <li>
            <strong>FPL Team:</strong>{' '}
            {manager.fpl_team_url && manager.fpl_team_url !== 'TBD' ? (
              <a href={manager.fpl_team_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                View on FPL
              </a>
            ) : (
              'TBD'
            )}
          </li>
        </ul>
      </div>
    </main>
  )
}
