// public/hooks/useProjectedSeeding.ts
// Live FA Cup seeding projection — recomputed on the backend from current
// standings on every fetch. Not final; the real bracket locks at the
// season's freeze date (GW22 for 2026-27).

import { useCallback, useEffect, useRef, useState } from "react";

const BACKEND = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

const POLL_MS = 10 * 60 * 1000; // 10 min — this isn't a live-scoring page

export interface ProjectedSeed {
  seed: number;
  owner: string;
  team: string;
  league: "premier" | "championship";
  score: number;
  reason: string;
}

export interface ProjectedMatchup {
  seed1: ProjectedSeed;
  seed2: ProjectedSeed;
}

export interface ProjectedSeedingData {
  lastSeason: string | null;
  facupWinner: string | null;
  premWinner: string | null;
  champWinner: string | null;
  basis: string | null;
  autoQualify: number;
  seeds: ProjectedSeed[];
  qualificationRound: ProjectedMatchup[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

let _cache: any = null;
let _cacheTs = 0;
const STALE_MS = 60_000;

export function useProjectedSeeding(): ProjectedSeedingData {
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
      const res = await fetch(`${BACKEND}/api/facup/projected-seeding`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Projected seeding fetch failed: ${res.status}`);
      }
      const json = await res.json();
      _cache = json;
      _cacheTs = Date.now();
      setData(json);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load projected seeding");
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
    facupWinner: data?.facup_winner ?? null,
    premWinner: data?.prem_winner ?? null,
    champWinner: data?.champ_winner ?? null,
    basis: data?.basis ?? null,
    autoQualify: data?.auto_qualify ?? 16,
    seeds: data?.seeds ?? [],
    qualificationRound: data?.qualification_round ?? [],
    loading,
    error,
    lastUpdated,
    refresh: fetchAll,
  };
}
