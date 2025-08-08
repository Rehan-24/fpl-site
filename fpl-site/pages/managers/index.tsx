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
    .then((res) => res.json())
    .then(setManagers)
    .catch(console.error)
}, [])


  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-[#37003c]">Team Bios</h1>
        <NavBar />       
      </header>

      <section className="p-6">
        <ul className="space-y-2">
          {managers.map(m => (
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
      </section>
    </main>
  )
}
