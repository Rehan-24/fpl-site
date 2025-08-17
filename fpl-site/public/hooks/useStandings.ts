import { useEffect, useRef, useState } from "react";

type Row = Record<string, any>;
type UseStandingsOpts = { pollMs?: number; league?: "premier" | "championship" };

export function useStandings(defaultLeague?: string, opts?: UseStandingsOpts) {
  const league = opts?.league || defaultLeague || "premier";
  const pollMs = opts?.pollMs ?? 5 * 60 * 1000;

  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const etagRef = useRef<string | null>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  const BASE = (process.env.NEXT_PUBLIC_BACKEND_BASE || "").replace(/\/$/, "");
  const url = `${BASE}/api/standings?league=${encodeURIComponent(league)}`;

  const normalizeRows = (j: any): Row[] => {
    // Accept { data: { rows: [...] } }  or { data: [...] }  or  [...]
    if (Array.isArray(j?.data?.rows)) return j.data.rows as Row[];
    if (Array.isArray(j?.data)) return j.data as Row[];
    if (Array.isArray(j)) return j as Row[];
    return [];
  };

  const fetchOnce = async () => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (etagRef.current) headers["If-None-Match"] = etagRef.current;
      if (lastModifiedRef.current) headers["If-Modified-Since"] = lastModifiedRef.current;

      const r = await fetch(url, { headers, signal: ac.signal });
      if (r.status === 304) {
        setLoading(false);
        return;
      }

      etagRef.current = r.headers.get("ETag");
      lastModifiedRef.current = r.headers.get("Last-Modified");

      const j = await r.json();
      setRows(normalizeRows(j));
      setUpdatedAt(typeof j?.updated_at === "number" ? j.updated_at : Date.now());
      setUsingCache(false);
    } catch {
      setUsingCache(true);
    } finally {
      setLoading(false);
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
  }, [url, pollMs]);

  const refresh = () => fetchOnce();

  return { data: rows, updatedAt, loading, usingCache, refresh };
}
