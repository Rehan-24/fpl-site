// Website/fpl-site/public/hooks/useStandings.ts
import { useEffect, useRef, useState } from "react";
import { fetchLatestSnapshot, fetchLiveStandings, SnapshotResponse } from "@/lib/api";

type Row = Record<string, any>;
type UseStandingsOpts = { pollMs?: number; league?: "premier" | "championship"; gw?: number };

export function useStandings(defaultLeague?: string, opts?: UseStandingsOpts) {
  const league = opts?.league || defaultLeague || "premier";
  const gw = opts?.gw; // optional, usually undefined for “latest”
  const pollMs = opts?.pollMs ?? 5 * 60 * 1000;

  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false); // we can toggle true when we serve a snapshot

  const abortRef = useRef<AbortController | null>(null);
  const etagRef = useRef<string | null>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  // Normalize whatever shape the backend sends
  const normalizeRows = (j: any): Row[] => {
    if (!j) return [];
    if (Array.isArray(j)) return j;
    if (Array.isArray(j?.rows)) return j.rows;
    if (Array.isArray(j?.data?.rows)) return j.data.rows;
    if (j?.payload?.rows && Array.isArray(j.payload.rows)) return j.payload.rows; // snapshot wrapper
    return [];
  };

  const fetchOnce = async () => {
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      setLoading(true);

      // 1) Try DB snapshot first
      try {
        const snap: SnapshotResponse = await fetchLatestSnapshot(league, gw);
        // If we got here, snapshot exists — show it immediately
        setRows(normalizeRows(snap));
        // Use the snapshot timestamp as updatedAt
        const ts = snap?.generated_at
          ? new Date(
              // be robust to "YYYY-MM-DD HH:MM:SS+00" vs ISO with "T"
              String(snap.generated_at).replace(" ", "T").replace("+00", "Z")
            ).getTime()
          : Date.now();

        setUpdatedAt(Number.isFinite(ts) ? ts : Date.now());
        setUsingCache(true);
        setLoading(false);
        return; // stop here; live fetch is optional
      } catch (e: any) {
        // Only ignore typical "not found" cases and fall through to live
        // Anything else (network/500) we still fall through to try live
      }

      // 2) Fall back to live standings (your existing path)
      const headers: Record<string, string> = {};
      if (etagRef.current) headers["If-None-Match"] = etagRef.current;
      if (lastModifiedRef.current) headers["If-Modified-Since"] = lastModifiedRef.current;

      // We can’t pass headers to fetchLiveStandings (it uses fetch inside),
      // so we’ll just call it directly and rely on the server’s caching.
      const live = await fetchLiveStandings(league);

      // Note: If you want to keep the 304 optimization, inline the fetch here
      // like you previously had and set etagRef/lastModifiedRef accordingly.

      const r = normalizeRows(live);
      setRows(r);
      setUpdatedAt(Date.now());
      setUsingCache(false);
      setLoading(false);
    } catch (e) {
      if (!ac.signal.aborted) {
        setLoading(false);
        // Don’t throw; let the page render its button/error UI
      }
    }
  };

  useEffect(() => {
    fetchOnce();
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchOnce();
    }, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league, gw, pollMs]);

  const refresh = () => fetchOnce();
  return { data: rows, updatedAt, loading, usingCache, refresh };
}
