// public/hooks/useManagers.ts
import { useCallback, useEffect, useMemo, useState } from "react";

type TrophyKey = "premier" | "fa" | "championship";
type Trophy = { type: TrophyKey; count: number };

export type ManagerUI = {
  name: string;
  team: string;
  favorite_club: string;
  placements: number | string;        // page handles number|string
  image_url: string;
  social_url: string;
  titles: number;
  trophies?: Trophy[];
  // keep dynamic for future use
  dynamic_image_url?: string;
};

const DEFAULT_AVATAR = "/images/managers/no_pp.jpg";

const mapTrophyType = (t: any): TrophyKey => {
  const s = String(t || "").toLowerCase();
  if (s.includes("prem")) return "premier";
  if (s.includes("champ")) return "championship";
  return "fa";
};

const toInt = (v: any, d = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
};

const adapt = (m: any): ManagerUI => {
  // Works for both legacy {name,team,...} and DB {owner_name,display_name,...}
  const name = m?.name ?? m?.owner_name ?? "";
  const team = m?.team ?? m?.display_name ?? "";
  const placementsRaw = m?.placements;
  const placements =
    Array.isArray(placementsRaw)
      ? placementsRaw.length
      : placementsRaw ?? 0;

  const image =
    m?.image_url || m?.dynamic_image_url || DEFAULT_AVATAR;

  const trophies: Trophy[] = Array.isArray(m?.trophies)
    ? m.trophies.map((t: any) => ({
        type: mapTrophyType(t?.type),
        count: toInt(t?.count, 0),
      }))
    : [];

  return {
    name,
    team,
    favorite_club: m?.favorite_club ?? "",
    placements,
    image_url: image,
    dynamic_image_url: m?.dynamic_image_url ?? "",
    social_url: m?.social_url ?? "",
    titles: toInt(m?.titles, 0),
    trophies,
  };
};

export function useManagers() {
  const [data, setData] = useState<ManagerUI[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_BASE_URL || "https://tfpl.onrender.com")
        .replace(/\/$/, ""),
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/managers`, {
        headers: { "Accept": "application/json" },
        // Next.js (app router) hint; ignored in pages router
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw : [raw];
      setData(arr.map(adapt));
    } catch (e: any) {
      setError(e?.message || "Failed to load managers");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    if (data === null) refresh();
  }, [data, refresh]);

  return { data, loading, error, refresh };
}
