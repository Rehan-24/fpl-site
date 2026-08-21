// public/hooks/useFACupSeeding.ts
// The frozen seeding for a season (who is seed #N) -- written once at
// freeze time by backend/scripts/facup_freeze.py. This is the identity
// lookup FACupBracket uses instead of a static per-season import; it's
// empty until that season's freeze has actually run.

import { useEffect, useState } from "react";

const BACKEND = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

export interface SeedEntry {
  seed: number;
  owner_name: string;
  team: string;
  league: "premier" | "championship";
  score: number | null;
  reason: string | null;
  entry_id: number | null;
}

export type SeedMap = Record<number, SeedEntry>; // keyed by seed number

let _cache: SeedMap | null = null;
let _cacheSeason: string | undefined;

export function useFACupSeeding(season?: string): { seeding: SeedMap; loading: boolean; error: string | null } {
  const [seeding, setSeeding] = useState<SeedMap>(_cacheSeason === season ? (_cache ?? {}) : {});
  const [loading, setLoading] = useState(_cacheSeason !== season);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (_cacheSeason === season && _cache) {
      setSeeding(_cache);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const seasonQS = season ? `?season=${encodeURIComponent(season)}` : "";
        const res = await fetch(`${BACKEND}/api/facup/seeding${seasonQS}`);
        if (!res.ok) throw new Error(`Seeding fetch failed: ${res.status}`);
        const json = await res.json();
        const rows: SeedEntry[] = json.seeding ?? [];
        const map: SeedMap = {};
        rows.forEach((r) => { map[r.seed] = r; });
        if (!cancelled) {
          _cache = map;
          _cacheSeason = season;
          setSeeding(map);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load seeding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [season]);

  return { seeding, loading, error };
}
