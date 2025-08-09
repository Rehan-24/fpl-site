import { useEffect, useState, useCallback } from 'react';

type Json = any;

function cacheKey(key: string) {
  return `cache:${key}`;
}

async function fetchWithTimeout(url: string, ms = 4000, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export function useCachedFetch<T = Json>(url: string, key: string, timeoutMs = 4000) {
  const [data, setData] = useState<T | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<null | string>(null);

  const load = useCallback(async (forceOnline = false) => {
    setLoading(true);
    setUsingCache(false);
    setError(null);

    try {
      const fresh = await fetchWithTimeout(url, timeoutMs);
      setData(fresh);
      localStorage.setItem(cacheKey(key), JSON.stringify({ ts: Date.now(), data: fresh }));
      setUsingCache(false);
    } catch (e: any) {
      const cached = localStorage.getItem(cacheKey(key));
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(parsed.data ?? null);
        setUsingCache(true);
      } else {
        setData(null);
        setUsingCache(true);
        setError(e?.message || 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  }, [url, key, timeoutMs]);

  useEffect(() => {
    // client-side only (localStorage)
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, usingCache, loading, error, refresh };
}
