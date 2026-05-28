// Shared types and components for FA Cup archive pages (/facup/[season])
import Link from "next/link";
import { useEffect, useState } from "react";

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

export interface ArchiveMatch {
  matchup_idx: number;
  seed1: number;  team1: string;  owner1: string;  score1: number | null;
  seed2: number;  team2: string;  owner2: string;  score2: number | null;
  winner_seed: number | null;
  tiebreaker?: boolean;
}

export interface ArchivePodium {
  champion:  { seed: number; team: string; owner: string };
  runnerUp:  { seed: number; team: string; owner: string };
  third:     { seed: number; team: string; owner: string };
}

// ── Match card ─────────────────────────────────────────────────────────────────

export function ArchiveMatchCard({ match }: { match: ArchiveMatch }) {
  const rows = [
    { seed: match.seed1, team: match.team1, score: match.score1, isWin: match.winner_seed === match.seed1 },
    { seed: match.seed2, team: match.team2, score: match.score2, isWin: match.winner_seed === match.seed2 },
  ];
  return (
    <div className="w-[172px] bg-white border-[1.5px] border-[#ddd6fe] rounded-md overflow-hidden flex-shrink-0">
      {match.tiebreaker && (
        <div className="px-2 py-[2px] bg-yellow-50 border-b border-yellow-200 text-[8px] font-bold text-yellow-700 uppercase tracking-wide">
          ⚽ Goals tiebreaker
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i}>
          {i === 1 && <div className="border-t border-purple-100" />}
          <div className={`flex items-center gap-1.5 px-2 py-1.5 min-h-[30px] text-[11px]${row.isWin ? " bg-green-50" : ""}`}>
            <span className="text-[9px] font-bold text-purple-300 w-[14px] text-right flex-shrink-0">
              {row.seed || ""}
            </span>
            <span className={`flex-1 truncate font-medium text-[#37003c]${row.isWin ? " font-bold" : ""}`}>
              {row.team || "TBD"}
            </span>
            {row.isWin && <span className="inline-block w-[5px] h-[5px] rounded-full bg-[#32FF6A] flex-shrink-0" />}
            {row.score !== null ? (
              <span className="text-[12px] font-bold min-w-[20px] text-right text-[#37003c]">{row.score}</span>
            ) : (
              <span className="text-[10px] text-purple-200 min-w-[20px] text-right">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Round section ──────────────────────────────────────────────────────────────

export function ArchiveRoundSection({
  title, gw, matches,
}: { title: string; gw?: number | string; matches: ArchiveMatch[] }) {
  if (!matches.length) return null;
  const sorted = [...matches].sort((a, b) => a.matchup_idx - b.matchup_idx);
  return (
    <div>
      <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 border-b-2 border-purple-200 pb-1.5 mb-3">
        {title}
        {gw && <span className="ml-2 font-normal text-purple-300">GW {gw}</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {sorted.map((m, i) => <ArchiveMatchCard key={i} match={m} />)}
      </div>
    </div>
  );
}

// ── Podium ─────────────────────────────────────────────────────────────────────

export function ArchivePodiumCard({ podium }: { podium: ArchivePodium }) {
  const places = [
    { emoji: "🥇", label: "Champion",  data: podium.champion,  style: { background: "linear-gradient(135deg,#fefce8,#fef9c3)", border: "2px solid #eab308" } },
    { emoji: "🥈", label: "Runner-up", data: podium.runnerUp,  style: { background: "linear-gradient(135deg,#f9fafb,#f3f4f6)", border: "2px solid #d1d5db" } },
    { emoji: "🥉", label: "3rd Place", data: podium.third,     style: { background: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "2px solid #d97706" } },
  ];
  return (
    <div>
      <div className="text-[13px] font-bold uppercase tracking-wide text-purple-600 border-b-2 border-purple-200 pb-1.5 mb-4">
        Podium
      </div>
      <div className="flex flex-wrap gap-4">
        {places.map(({ emoji, label, data, style }) => (
          <div key={label} className="rounded-lg p-4 text-center w-40" style={style}>
            <div className="text-3xl mb-1">{emoji}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
            <div className="text-[13px] font-bold text-[#37003c] leading-tight">{data.team}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{data.owner}</div>
            <div className="text-[9px] text-purple-300 mt-0.5">Seed {data.seed}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Past FA Cups dropdown ──────────────────────────────────────────────────────

interface PastEntry {
  season: string;
  label: string;
  champion?: string | null;
  href: string;
}

// Static fallback (also the initial render state before the fetch resolves)
const STATIC_SEASONS: PastEntry[] = [
  { season: "2025-26", label: "2025-26 (v2)", champion: "Peaky Reijnders",  href: "/facup/2025-26" },
  { season: "2024-25", label: "2024-25 (v1)", champion: "Chandler Ashman", href: "/facup/2024-25" },
];

export function ArchivePastFACupsButton({ currentSeason }: { currentSeason: string }) {
  const [open,    setOpen]    = useState(false);
  const [seasons, setSeasons] = useState<PastEntry[]>(STATIC_SEASONS);

  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/facup/seasons`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.seasons)) setSeasons(d.seasons); })
      .catch(() => {}); // keep static fallback on error
  }, []);

  const entries = seasons;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-[#32FF6A] text-[#37003c] font-semibold px-4 py-2 rounded shadow text-sm whitespace-nowrap"
      >
        Past FA Cups {open ? "▲" : "▾"}
      </button>
      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-52 bg-white border border-[#37003c] rounded shadow-lg z-50">
          <div className="px-3 py-2 text-xs font-bold text-[#37003c] border-b border-gray-200 uppercase tracking-wide">
            View a Past FA Cup
          </div>
          {entries.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500 italic">No archives yet</div>
          ) : entries.map(e => (
            <Link
              key={e.season}
              href={e.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-[#37003c] hover:bg-purple-100"
            >
              <div className="font-medium">{e.label}</div>
              {e.champion && <div className="text-xs text-gray-500">🥇 {e.champion}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
