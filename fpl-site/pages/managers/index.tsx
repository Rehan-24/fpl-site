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

export default function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([])

  useEffect(() => {
    fetch('/api/managers')
      .then((res) => res.json())
      .then(setManagers)
  }, [])

  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <h1 className="text-3xl font-bold mb-4">Team Bios</h1>
      <ul className="space-y-2">
        {managers.map((m) => (
          <li key={m.name}>
            <Link
              href={`/managers/${encodeURIComponent(m.name)}`}
              className="text-blue-700 hover:underline"
            >
              {m.name}
            </Link>{' '}
            — {m.team} ({m.current_league})
          </li>
        ))}
      </ul>
    </main>
  )
}
