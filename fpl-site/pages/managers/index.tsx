import { useEffect, useState } from 'react'
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

export default function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([])

  useEffect(() => {
    fetch('https://tfpl.onrender.com/api/managers')
      .then(r => r.json())
      .then(setManagers)
      .catch(console.error)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100">
      <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-[#37003c]">Team Bios</h1>
        <NavBar />
      </header>

      <section className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {managers.map(m => (
            <Link
              key={m.name}
              href={`/managers/${encodeURIComponent(m.name)}`}
              className="block bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              <div className="flex items-center p-4">
                <img
                  src={m.image_url}
                  alt={m.name}
                  className="w-16 h-16 rounded-full border mr-4"
                />
                <div>
                  <h2 className="text-xl font-semibold text-[#37003c]">{m.name}</h2>
                  <p className="text-sm text-gray-600">
                    {m.team} — {m.current_league}
                  </p>
                </div>
              </div>
              <p className="px-4 pb-4 text-sm text-gray-700 line-clamp-2">
                {m.bio}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
