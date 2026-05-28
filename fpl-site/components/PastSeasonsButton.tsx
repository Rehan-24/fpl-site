import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

interface SeasonEntry {
  season: string;
  champion: string | null;
  manager: string | null;
  version: string | null;
}

interface Props {
  league: "premier" | "championship";
  currentSeason?: string;
}

// Static fallback — renders immediately; backend fetch may add/update newer seasons
const STATIC_SEASONS: Record<string, SeasonEntry[]> = {
  premier: [
    { season: "2025-26", version: "v5", champion: "Slopeds FC",    manager: "Michael Giles"  },
    { season: "2024-25", version: "v4", champion: "Cheeks FC",     manager: "Rehan Khan"     },
    { season: "2023-24", version: "v3", champion: "Maguire's Men", manager: "Marvin Ling"    },
    { season: "2022-23", version: "v2", champion: "joel FC",       manager: "Joel Matthew"   },
    { season: "2021-22", version: "v1", champion: "Cheeks FC",     manager: "Rehan Khan"     },
  ],
  championship: [
    { season: "2025-26", version: "v3", champion: "wizards", manager: "Aaron Frank"    },
    { season: "2024-25", version: "v2", champion: "TylerQ",  manager: "Tyler Quedens" },
  ],
};

export default function PastSeasonsButton({ league, currentSeason }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seasons, setSeasons] = useState<SeasonEntry[]>(STATIC_SEASONS[league] ?? []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/seasons?league=${league}`)
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.seasons)) return;
        // Merge: backend entries update champion/manager; static-only entries are kept
        const merged = STATIC_SEASONS[league]?.map(s => {
          const live = d.seasons.find((x: SeasonEntry) => x.season === s.season);
          return live ? { ...s, ...live } : s;
        }) ?? d.seasons;
        setSeasons(merged);
      })
      .catch(() => {}); // keep static fallback on error
  }, [league]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = seasons;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#32FF6A] text-[#37003c] font-semibold px-4 py-2 rounded shadow text-sm whitespace-nowrap"
      >
        Past Seasons {open ? "▲" : "▾"}
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-56 bg-white border border-[#37003c] rounded shadow-lg z-50">
          <div className="px-3 py-2 text-xs font-bold text-[#37003c] border-b border-gray-200 uppercase tracking-wide">
            View a Past Season
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500 italic">No archives yet</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.season}
                onClick={() => {
                  setOpen(false);
                  router.push(`/seasons/${league}/${s.season}`);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#37003c] hover:bg-purple-100"
              >
                <div className="font-medium">
                  {s.season}{s.version ? ` (${s.version})` : ""}
                </div>
                {(s.manager || s.champion) && (
                  <div className="text-xs text-gray-500 truncate">
                    🥇 {s.manager ?? s.champion}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
