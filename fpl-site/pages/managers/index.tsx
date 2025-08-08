import { useEffect, useState } from 'react'
import Link from 'next/link'
import NavBar from '../../components/NavBar'

interface Manager {
  name: string
  team: string
  favorite_club: string
  placements: number
  image_url: string
  social_url: string
}

export default function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([])

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
                  <th className="px-6 py-3 text-center text-sm font-semibold text-white">Follow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {managers.map(m => (
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: cards */}
        <div className="sm:hidden space-y-3">
          {managers.map(m => (
            <div key={m.name} className="bg-purple-100 rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <img
                  src={m.image_url}
                  alt={m.name}
                  className="w-12 h-12 rounded-full border"
                />
                <div className="flex-1">
                  <Link
                    href={`/managers/${encodeURIComponent(m.name)}`}
                    className="font-semibold hover:underline"
                  >
                    {m.name}
                  </Link>
                  <div className="text-xs text-gray-600">{m.team}</div>
                  <div className="text-xs text-gray-600">
                    Fav club: {m.favorite_club || '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-gray-500">Placements</div>
                  <div className="text-lg font-bold">{m.placements ?? 0}</div>
                  {m.social_url ? (
                    <a
                      href={m.social_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 bg-[#32FF6A] text-[#37003c] px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      Follow
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
