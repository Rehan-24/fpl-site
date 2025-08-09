import { useCachedFetch } from './useCachedFetch';

export function useStandings(league: string) {
  const url = `https://tfpl.onrender.com/api/standings?league=${encodeURIComponent(league)}`;
  const key = `standings:${league}`;
  return useCachedFetch<any[]>(url, key, 4000);
}
