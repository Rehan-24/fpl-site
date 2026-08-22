// public/hooks/useHypotheticalBracket.ts
// "If the Cup started today" -- a full hypothetical bracket (every
// round) recomputed live from current standings. Only the
// Qualification Round pairings are real seeding; everything past that
// assumes the better seed wins, purely for preview purposes.

import { useCallback, useEffect, useRef, useState } from "react";

const BACKEND = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

const POLL_MS = 10 * 60 * 1000; // 10 min -- not a live-scoring page

export interface HBSeed {
  seed: number;
  owner: string;
  team: string;
  league: "premier" | "championship";
  score: number;
  reason: string;
}

export interface HBMatch {
  seed1: HBSeed | null;
  seed2: HBSeed | null;
  winner_seed: number;
  walkover?: boolean;
}

export interface HypotheticalBracketData {
  lastSeason: string | null;
  basis: string | null;
  autoQualify: number;
  qualificationRound: HBMatch[];
  roundOf32: HBMatch[];
  roundOf16: HBMatch[];
  quarterfinals: HBMatch[];
  semifinals: HBMatch[];
  final: HBMatch[];
  thirdPlace: HBMatch[];
  champion: HBSeed | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

let _cache: any = null;
let _cacheTs = 0;
const STALE_MS = 60_000;

export function useHypotheticalBracket(): HypotheticalBracketData {
  const [data, setData] = useState<any>(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (_cache && Date.now() - _cacheTs < STALE_MS) {
      setData(_cache);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND}/api/facup/hypothetical-bracket`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Hypothetical bracket fetch failed: ${res.status}`);
      }
      const json = await res.json();
      _cache = json;
      _cacheTs = Date.now();
      setData(json);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load hypothetical bracket");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll]);

  return {
    lastSeason: data?.last_season ?? null,
    basis: data?.basis ?? null,
    autoQualify: data?.auto_qualify ?? 16,
    qualificationRound: data?.qualification_round ?? [],
    roundOf32: data?.round_of_32 ?? [],
    roundOf16: data?.round_of_16 ?? [],
    quarterfinals: data?.quarterfinals ?? [],
    semifinals: data?.semifinals ?? [],
    final: data?.final ?? [],
    thirdPlace: data?.third_place ?? [],
    champion: data?.champion ?? null,
    loading,
    error,
    lastUpdated,
    refresh: fetchAll,
  };
}
