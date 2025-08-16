import { useEffect, useRef, useState } from "react";

type UseStandingsOpts = {
  pollMs?: number;          // how often to poll
  league?: "premier" | "championship";
};

export function useStandings(defaultLeague?: string, opts?: UseStandingsOpts) {
  const league = opts?.league || defaultLeague || "premier";
  const pollMs = opts?.pollMs ?? 5 * 60 * 1000; // default: 5 minutes

  const [data, setData] = useState<any>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const etagRef = useRef<string | null>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  const fetchOnce = async () => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (etagRef.current) headers["If-None-Match"] = etagRef.current;
      if (lastModifiedRef.current) headers["If-Modified-Since"] = lastModifiedRef.current;

      const r = await fetch(`/api/standings?league=${encodeURIComponent(league)}`, {
        method: "GET",
        headers,
        signal: ac.signal,
      });

      if (r.status === 304) {
        // unchanged
        setLoading(false);
        return;
      }

      // Capture validators for next round
      const etag = r.headers.get("ETag");
      const lastModified = r.headers.get("Last-Modified");
      if (etag) etagRef.current = etag;
      if (lastModified) lastModifiedRef.current = lastModified;

      const j = await r.json();
      setData(j?.data?.rows ? j.data : j?.data ?? j);
      setUpdatedAt(typeof j?.updated_at === "number" ? j.updated_at : Date.now());
      setUsingCache(false);
    } catch (e) {
      // Soft-fail: keep old data, mark cache
      setUsingCache(true);
    } finally {
      setLoading(false);
    }
  };

  // initial + polling
  useEffect(() => {
    let alive = true;

    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (document.visibilityState === "visible") fetchOnce();
      }, pollMs);
    };

    fetchOnce().then(() => alive && startTimer());

    const vis = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", vis);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", vis);
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [league, pollMs]);

  const refresh = () => fetchOnce();

  return { data, updatedAt, loading, usingCache, refresh };
}
