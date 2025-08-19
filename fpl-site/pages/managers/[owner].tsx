import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import NavBar from '../../components/NavBar'
import Head from 'next/head';
import FixtureFDRCard from '../../components/manager/FixtureFDRCard'
import SeasonStatsCard from '../../components/manager/SeasonStatsCard'
import MatchupTrackerCard from '../../components/manager/MatchupTrackerCard'


type TrophyKey = 'premier' | 'fa' | 'championship'
type Trophy = { type: TrophyKey; count: number }

interface Manager {
  name: string;
  team: string;
  current_league?: string;
  years_playing?: number;
  premier_years?: number;
  championship_years?: number;
  promotions: string | number;
  relegations: string | number;
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

// Fallback-normalize the API row into the shape this page expects
function normalizeManager(m: any, ownerFallback: string): Manager {
  const placementsRaw = m?.placements;
  return {
    name: (m?.name || m?.owner_name || ownerFallback || "").trim(),
    team: m?.team || m?.display_name || "",
    current_league: m?.current_league ?? m?.league ?? undefined,
    years_playing: m?.years_playing ?? undefined,
    premier_years: m?.premier_years ?? undefined,
    championship_years: m?.championship_years ?? undefined,
    promotions: m?.promotions ?? 0,
    relegations: m?.relegations ?? 0,
    best_finish: m?.best_finish ?? null,
    titles: Number.isFinite(Number(m?.titles)) ? Number(m?.titles) : 0,
    titles_list: m?.titles_list ?? "",
    bio: m?.bio ?? "",
    image_url: m?.image_url || "",
    dynamic_image_url: m?.dynamic_image_url || "",
    fpl_team_url: m?.fpl_team_url || undefined,
    favorite_club: m?.favorite_club || "",
    placements: Array.isArray(placementsRaw) ? placementsRaw.length : (placementsRaw ?? 0),
    social_url: m?.social_url || "",
    trophies: Array.isArray(m?.trophies) ? m.trophies : [],
  };
}

export default function ManagerBio() {
  const { query, isReady } = useRouter()
  const ownerSlug = Array.isArray(query.owner) ? query.owner[0] : query.owner
  const [manager, setManager] = useState<Manager | null>(null)
  const [notFound, setNotFound] = useState(false)
  const safeName = useMemo(() => manager?.name || (typeof ownerSlug === 'string' ? decodeURIComponent(ownerSlug) : ''), [manager?.name, ownerSlug]);


  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tfpl.onrender.com').replace(/\/$/, ''),
    []
  );

  useEffect(() => {
    if (!isReady || !ownerSlug) return;
    const ownerName = decodeURIComponent(ownerSlug);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/managers?owner=${encodeURIComponent(ownerName)}`);
        if (!res.ok) {
          setNotFound(true);
          setManager(null);
          return;
        }
        const data = await res.json();
        setManager(normalizeManager(data, ownerName));
        setNotFound(false);
      } catch (e) {
        console.error(e);
        setNotFound(true);
        setManager(null);
      }
    })();
  }, [isReady, ownerSlug, API_BASE]);

  //const { first, last } = useMemo(() => {
  //  const parts = (manager?.name || '').split(' ')
  //  return { first: parts[0] || '', last: parts.slice(1).join(' ') }
  //}, [manager?.name])

  // for the split:
  const { first, last } = useMemo(() => {
    const parts = (safeName || '').split(' ');
    return { first: parts[0] || '', last: parts.slice(1).join(' ') };
  }, [safeName]);

  if (!manager) return <p className="p-6">Loading…</p>
  if ((manager as any).error) return <p className="p-6 text-red-600">Manager not found</p>

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 to-purple-100 text-[#37003c]">
      <Head>
        <title>{safeName} - tFPL Bio</title>
        <meta property="og:title" content={`${safeName} - tFPL Bio`} />
        <meta property="og:description" content={manager.bio || 'Zidane Threepeat is Underrated'} />
        <meta property="og:image" content={`https://tfpl.vercel.app/${manager.image_url || 'images/managers/empty_preview.jpg'}`} />
        <meta property="og:url" content={`https://tfpl.vercel.app/managers/${safeName}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>
      
      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
        {/* ripple vector background */}
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
              
        {/* Content above ripple */}
        <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">Manager Bio</h1>
              
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      <section className="p-6 space-y-6 text-[#37003c]">
        <Link href="/managers" className="underline">&larr; Back to Manager List</Link>

        {/* HERO CARD (FPL-style + ripple overlay) */}
        <div className="mt-4 relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-r from-blue-300 via-blue-400 to-green-500 text-[#37003c]">
          {/* ripple vector from /public/images/patterns/content-card-vector.svg */}
          <div
            className="hero-card-ripple pointer-events-none select-none absolute inset-0"
            style={{
              backgroundImage: "url('/images/patterns/hero-card-ripple.svg')",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right top',
              backgroundSize: 'cover',
              zIndex: 1,  /* Make sure the ripple stays in the background */
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
            className="hero-image absolute left-7 bottom-0 sm:h-40 h-32 object-cover select-none"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src.endsWith(DEFAULT_AVATAR)) return;
              img.src = DEFAULT_AVATAR;
            }}
          />

          {/* follow button */}
          {manager.social_url && (
            <a
              href={manager.social_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 bg-[#37003c]/15 hover:bg-[#37003c]/25 text-[#37003c] text-xs font-semibold rounded-full px-4 py-1 transition z-20 pointer-events-auto"
            >
              Follow
            </a>
          )}

          {/* text block (indented to clear image) */}
          <div className="relative p-5 sm:p-6 ml-28 sm:ml-40 md:ml-48">
            <div className="text-base sm:text-lg opacity-90">{first}</div>
            {first !== "Carter" ? (
                <div className="text-3xl sm:text-3xl font-extrabold -mt-1 leading-tight">
                  {last || first}
                </div>
              ) :                 
                <div className="text-2xl sm:text-2xl font-extrabold -mt-1 leading-tight">
                  {last || first}
                </div>}

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
              <span>{manager.placements || 0} Placement(s) </span>
            </div>
          </div>
        </div>

        {/* INFO CARD (details) */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-blue-400 to-green-500 backdrop-blur shadow p-5 grid md:grid-cols-2 gap-6 text-[#37003c]">
            {/* ripple vector from /public/images/patterns/content-card-vector.svg */}
            <div
            className="hero-card-ripple pointer-events-none select-none absolute inset-0"
              style={{
                backgroundImage: "url('/images/patterns/hero-card-ripple.svg')",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right top',
                backgroundSize: 'cover',
                zIndex: 1,  /* Make sure the ripple stays in the background */
              }}
            />
            
            <div>
              <h4 className="text-lg font-semibold mb-1">Stats</h4>
              <ul className="text-sm space-y-1">
                <li><strong>Current League:</strong> {manager.current_league || '—'}</li>
                <li><strong>Total Experience:</strong> {manager.years_playing ?? '—'}</li>
                <li><strong>Promotions/Relegations:</strong> {manager.promotions ?? 'N'}/{manager.relegations ?? 'A'}</li>
                <li><strong>Premier Experience:</strong> {manager.premier_years ?? 'N/A'}</li>
                <li><strong>Championship Experience:</strong> {manager.championship_years ?? 'N/A'}</li>
                <li><strong>Best Finish:</strong> {manager.best_finish ?? '—'}</li>
                {manager.titles_list && (
                  <li><strong>Titles:</strong> {manager.titles ?? 0} - {manager.titles_list}</li>
                )}
              </ul>
            </div>
          
            <div>
              <h3 className="text-lg font-semibold mb-2">Bio</h3>
              <p className="text-sm leading-relaxed">
                {manager.bio || 'No bio yet.'}
              </p>

              <div className="mt-4"> {/* space between bio and links */}
                <h4 className="font-semibold mb-1">Links</h4>
                <ul className="text-sm space-y-1">
                  <li>
                    <strong>FPL Team:</strong>{' '}
                    {manager.fpl_team_url && manager.fpl_team_url !== 'Coming Soon...' ? (
                      <a
                        href={manager.fpl_team_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="[#37003c] underline"
                      >
                        View on FPL
                      </a>
                    ) : (
                      'TBD'
                    )}
                  </li>
                  {manager.social_url && (
                    <li>
                      <strong>Socials:</strong>{' '}
                      <a
                        href={manager.social_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#37003c] underline"
                      >
                        Profile
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>


        </div>
        <div className="space-y-4 mt-6">
          <FixtureFDRCard ownerName={manager?.name || ''} />
          <SeasonStatsCard ownerName={manager?.name || ''} />
          <MatchupTrackerCard ownerName={manager?.name || ''} />
        </div>

      </section>
    </main>
  )
}
