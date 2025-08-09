import { useCachedFetch } from './useCachedFetch';

export function useFACup() {
  const url = `https://tfpl.onrender.com/api/facup`; // adjust if different
  const key = `facup`;
  return useCachedFetch<any>(url, key, 4000);
}
