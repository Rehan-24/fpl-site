import { useCachedFetch } from './useCachedFetch';


type TrophyKey = 'premier' | 'fa' | 'championship';
type Trophy = { type: TrophyKey; count: number };

export interface Manager {
  trophies?: Trophy[];
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
}

export function useManagers() {
  const url = `https://tfpl.onrender.com/api/managers`;
  const key = `managers:list`;
  return useCachedFetch<Manager[]>(url, key, 4000);
}

export function useManager(ownerName: string | null | undefined) {
  const enabled = Boolean(ownerName);
  const BASE = (process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com").replace(/\/$/, "");
  const url = enabled
    ? `${BASE}/api/standings?league=${encodeURIComponent(ownerName!)}}`
    : '';
  const key = enabled ? `managers:owner:${ownerName}` : 'noop';

  // When not enabled, just return idle state
  if (!enabled) {
    return { data: null as Manager | null, usingCache: false, loading: false, error: null, refresh: () => {} };
  }
  return useCachedFetch<Manager>(url, key, 4000);
}