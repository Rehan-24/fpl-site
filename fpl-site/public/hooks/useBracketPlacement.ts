// public/hooks/useBracketPlacement.ts
// What the bracket layout looks like right now, recomputed live from
// current standings. No results simulated -- the Qualification Round
// and Round of 32 are real; everything after that is TBD.

import { useCallback, useEffect, useRef, useState } from "react";

const BACKEND = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

const POLL_MS = 10 * 60 * 1000; // 10 min -- not a live-scoring page

export interface PlacementSeed {
  seed: number;
  owner: string;
  team: string;
  league: "premier" | "championship";
  score: number;
  reason: string;
}

export interface QualificationMatch {
  seed1: PlacementSeed;
  seed2: PlacementSeed;
}

export interface BracketSlot {
  kind: "seed" | "ko_winner" | "tbd";
  seed?: PlacementSeed;
  match_idx?: number;
}

export interface SlotMatch {
  slot1: BracketSlot;
  slot2: BracketSlot;
}

export interface BracketPlacementData {
  lastSeason: string | null;
  basis: string | null;
  autoQualify: number;
  round32Cutoff: number;
  qualificationRound: QualificationMatch[];
  roundOf32: SlotMatch[];
  roundOf16: SlotMatch[];
  quarterfinals: SlotMatch[];
  semifinals: SlotMatch[];
  final: SlotMatch[];
  thirdPlace: SlotMatch[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

let _cache: any = null;
let _cacheTs = 0;
const STALE_MS = 60_000;

export function useBracketPlacement(): BracketPlacementData {
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
      const res = await fetch(`${BACKEND}/api/facup/bracket-placement`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Bracket placement fetch failed: ${res.status}`);
      }
      const json = await res.json();
      _cache = json;
      _cacheTs = Date.now();
      setData(json);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load bracket placement");
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
    autoQualify: data?.auto_qualify ?? 4,
    round32Cutoff: data?.shape?.round32_cutoff ?? 24,
    qualificationRound: data?.qualification_round ?? [],
    roundOf32: data?.round_of_32 ?? [],
    roundOf16: data?.round_of_16 ?? [],
    quarterfinals: data?.quarterfinals ?? [],
    semifinals: data?.semifinals ?? [],
    final: data?.final ?? [],
    thirdPlace: data?.third_place ?? [],
    loading,
    error,
    lastUpdated,
    refresh: fetchAll,
  };
}
