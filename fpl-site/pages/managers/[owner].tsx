import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import NavBar from '../../components/NavBar'

type TrophyKey = 'premier' | 'fa' | 'championship'
type Trophy = { type: TrophyKey; count: number }

interface Manager {
  name: string;
  team: string;
  current_league?: string;
  years_playing?: number;
  best_finish?: string | null;
  titles?: number;
  titles_list?: string;
  bio?: string;
  image_url: string;
  dynamic_image_url: string;
  fpl_team_url?: string;
  favorite_club?: string;
  placements?: number | string;
  social_url?: string;
  trophies?: Trophy[];
}

const TROPHY_ICONS: Record<TrophyKey, string> = {
  premier: '/images/trophies/prem_trophy.png',
  fa: '/images/trophies/fa_cup_trophy.png',
  championship: '/images/trophies/championship_trophy.png',
}

// repeat each trophy icon by its count
const expandTrophies = (ts?: Trophy[]) =>
  (ts ?? []).flatMap(t => Array.from({ length: t.count ?? 0 }, () => t.type))

// default
const DEFAULT_AVATAR = '/images/dynamic_images/placeholder.png'

export default function ManagerBio() {
  const { query, isReady } = useRouter()
  const ownerSlug = Array.isArray(query.owner) ? query.owner[0] : query.owner
  const [manager, setManager] = useState<Manager | null>(null)

  useEffect(() => {
    if (!isReady || !ownerSlug) return
    const ownerName = decodeURIComponent(ownerSlug)
    fetch(`https://tfpl.onrender.com/api/managers?owner=${encodeURIComponent(ownerName)}`)
      .then(res => res.json())
      .then(setManager)
      .catch(console.error)
  }, [isReady, ownerSlug])

  const { first, last } = useMemo(() => {
    const parts = (manager?.name || '').split(' ')
    return { first: parts[0] || '', last: parts.slice(1).join(' ') }
  }, [manager?.name])

  if (!manager) return <p className="p-6">Loading…</p>
  if ((manager as any).error) return <p className="p-6 text-red-600">Manager not found</p>

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-purple-700 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-[#37003c]">Team Bio</h1>
        <NavBar />
      </header>

      <section className="p-6 space-y-6">
        <Link href="/managers" className="underline">&larr; Back to Team Bios</Link>

        {/* HERO CARD (FPL-style + ripple overlay) */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-r from-blue-300 via-blue-400 to-green-500 text-[#37003c]">
          {/* ripple vector from /public/images/patterns/content-card-vector.svg */}
            <div
              className="pointer-events-none select-none absolute inset-y-0 right-0 left-24 sm:left-40 md:left-48"
              style={{
                backgroundImage: "url('/images/patterns/hero-card-ripple.svg')",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right top',
                backgroundSize: 'cover', // try 'contain' if you want less stretch
              }}
            />
          {/* subtle highlight blobs (kept) */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,.5), transparent 40%), radial-gradient(ellipse at 90% 60%, rgba(255,255,255,.3), transparent 55%)',
            }}
          />

          {/* manager image (with fallback to DEFAULT_AVATAR) */}
          <img
            src={manager.dynamic_image_url || DEFAULT_AVATAR}
            alt={manager.name}
            className="absolute bottom-0 h-32 sm:h-40 md:h-44 object-cover select-none"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              if (img.src.endsWith(DEFAULT_AVATAR)) return
              img.src = DEFAULT_AVATAR
            }}
          />

          {/* follow button */}
          {manager.social_url && (
            <a
              href={manager.social_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 bg-[#37003c]/15 hover:bg-[#37003c]/25 text-[#37003c] text-xs font-semibold rounded-full px-4 py-1 transition"
            >
              Follow
            </a>
          )}

          {/* text block (indented to clear image) */}
          <div className="relative p-5 sm:p-6 ml-28 sm:ml-40 md:ml-48">
            <div className="text-base sm:text-lg opacity-90">{first}</div>
            <div className="text-3xl sm:text-4xl font-extrabold -mt-1 leading-tight">
              {last || first}
            </div>

            {/* trophies next to name */}
            <div className="mt-2 flex flex-wrap gap-1">
              {expandTrophies(manager.trophies).map((t, i) => (
                <img
                  key={`${t}-${i}`}
                  src={TROPHY_ICONS[t as TrophyKey]}
                  alt={`${t} trophy`}
                  className="h-4 w-4"
                  loading="lazy"
                />
              ))}
            </div>

            {/* meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm opacity-90">
              <span>{manager.team}</span>
              <span>•</span>
              <span>{manager.favorite_club || 'Favorite club: —'}</span>
              <span>•</span>
              <span>{manager.placements ?? 0} Placements </span>
            </div>
          </div>
        </div>

        {/* INFO CARD (details) */}
        <div className="rounded-xl bg-white/70 backdrop-blur shadow p-5 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bio</h3>
            <p className="text-sm leading-relaxed">
              {manager.bio || 'No bio yet.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Quick stats</h4>
              <ul className="text-sm space-y-1">
                <li><strong>Current League:</strong> {manager.current_league || '—'}</li>
                <li><strong>Experience:</strong> {manager.years_playing ?? '—'}</li>
                <li><strong>Best Finish:</strong> {manager.best_finish ?? '—'}</li>
                <li><strong>Titles:</strong> {manager.titles ?? 0}</li>
                {manager.titles_list && (
                  <li><strong>Titles Won:</strong> {manager.titles_list}</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Links</h4>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>FPL Team:</strong>{' '}
                  {manager.fpl_team_url && manager.fpl_team_url !== 'TBD' ? (
                    <a
                      href={manager.fpl_team_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      View on FPL
                    </a>
                  ) : (
                    'TBD'
                  )}
                </li>
                {manager.social_url && (
                  <li>
                    <strong>Social:</strong>{' '}
                    <a
                      href={manager.social_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Profile
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
