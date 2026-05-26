import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

interface SeasonEntry {
  season: string;
  champion: string | null;
  manager: string | null;
}

interface Props {
  league: "premier" | "championship";
  currentSeason?: string;
}

export default function PastSeasonsButton({ league, currentSeason }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seasons, setSeasons] = useState<SeasonEntry[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/seasons?league=${league}`)
      .then((r) => r.json())
      .then((d) => setSeasons(d.seasons || []))
      .catch(() => {});
  }, [league]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = seasons.filter((s) => s.season !== currentSeason);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#32FF6A] text-[#37003c] font-semibold px-4 py-2 rounded shadow text-sm whitespace-nowrap"
      >
        Past Seasons {open ? "▲" : "▾"}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-[#37003c] rounded shadow-lg z-50">
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
                <div className="font-medium">{s.season}</div>
                {(s.manager || s.champion) && (
                  <div className="text-xs text-gray-500 truncate">
                    🥇 {s.manager ?? s.champion}
                    {s.champion && s.manager && (
                      <span className="text-gray-400"> · {s.champion}</span>
                    )}
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
