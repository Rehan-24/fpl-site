interface ChipUsage {
  chip: string;
  used: number;
  total: number;
  pct: number;
  peak_gw: string | null;
}

interface TeamEntry {
  position: number;
  team: string;
  owner: string;
  wins?: number;
  draws?: number;
  losses?: number;
  points?: number;
  score?: number;
  title_reward?: string;
}

interface ScoreMover {
  team: string;
  owner: string;
  pts_rank: number;
  score_rank: number;
  delta: number;
}

export interface SeasonSummaryData {
  season: string;
  league: string;
  top7: TeamEntry[];
  relegated: TeamEntry[];
  promoted: TeamEntry[];
  score_movers: {
    biggest_up: ScoreMover;
    biggest_down: ScoreMover;
  };
  chip_usage: ChipUsage[];
  overall_rank: {
    best: { team: string; rank: number } | null;
    worst: { team: string; rank: number } | null;
  } | null;
  all_rows?: Record<string, any>[];
}

function PositionIcon({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-xl">🥇</span>;
  if (pos === 2) return <span className="text-xl">🥈</span>;
  if (pos === 3) return <span className="text-xl">🥉</span>;
  return <span className="font-bold text-[#37003c] w-6 inline-block text-center">{pos}.</span>;
}

function ChipBar({ entry }: { entry: ChipUsage }) {
  const filled = entry.used;
  const empty = entry.total - entry.used;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-[#37003c] w-32 shrink-0">{entry.chip}</span>
      <div className="flex gap-[2px]">
        {Array.from({ length: filled }).map((_, i) => (
          <span key={`f${i}`} className="inline-block w-3 h-3 rounded-sm bg-[#32FF6A]" />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="inline-block w-3 h-3 rounded-sm bg-gray-300" />
        ))}
      </div>
      <span className="text-xs text-[#37003c] font-semibold">{entry.pct}%</span>
      <span className="text-xs text-gray-500">
        {entry.used}/{entry.total}
        {entry.peak_gw ? ` · peak ${entry.peak_gw}` : ""}
      </span>
    </div>
  );
}

export default function SeasonSummaryCard({ data }: { data: SeasonSummaryData }) {
  const isPremier = data.league === "premier";

  return (
    <div className="rounded-lg border border-gray-300 bg-purple-100 shadow-md p-5 space-y-5">

      {/* Top section: Top 7 + Score movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Left: Final standings */}
        <div>
          <h3 className="font-bold text-[#37003c] text-lg mb-3 uppercase tracking-wide">
            Final Top 7
          </h3>
          <div className="space-y-1">
            {data.top7.map((entry) => (
              <div key={entry.position} className="flex items-center gap-2 py-1 border-b border-gray-200">
                <PositionIcon pos={entry.position} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#37003c] text-sm truncate">{entry.team}</div>
                  <div className="text-xs text-gray-500 truncate">{entry.owner}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#37003c]">{entry.points} pts</div>
                  {entry.title_reward && (
                    <div className="text-xs text-purple-700 italic">{entry.title_reward}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Relegated / Promoted */}
          {isPremier && data.relegated.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
                ↓ Relegated
              </div>
              {data.relegated.map((entry) => (
                <div
                  key={entry.position}
                  className="flex items-center gap-2 py-1 bg-red-200 rounded px-2 mb-1"
                >
                  <span className="text-xs font-bold text-[#37003c] w-6">{entry.position}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#37003c] text-sm truncate">{entry.team}</div>
                    <div className="text-xs text-gray-600 truncate">{entry.owner}</div>
                  </div>
                  <span className="text-xs font-bold text-[#37003c] shrink-0">{entry.points} pts</span>
                </div>
              ))}
            </div>
          )}

          {!isPremier && data.promoted.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">
                ↑ Promoted to Premier
              </div>
              {data.promoted.map((entry) => (
                <div
                  key={entry.position}
                  className="flex items-center gap-2 py-1 bg-green-200 rounded px-2 mb-1"
                >
                  <span className="text-xs font-bold text-[#37003c] w-6">{entry.position}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#37003c] text-sm truncate">{entry.team}</div>
                    <div className="text-xs text-gray-600 truncate">{entry.owner}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-[#37003c]">{entry.points} pts</div>
                    {entry.title_reward && (
                      <div className="text-xs text-green-700 italic">{entry.title_reward}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Score movers */}
        <div>
          <h3 className="font-bold text-[#37003c] text-lg mb-3 uppercase tracking-wide">
            If Ranked by Score…
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            Points = match results. Score = raw FPL total. The gap reveals luck vs. skill.
          </p>

          {data.score_movers.biggest_up.delta > 0 && (
            <div className="bg-green-100 border border-green-300 rounded p-3 mb-3">
              <div className="text-xs font-bold text-green-800 uppercase mb-1">↑ Biggest jump up</div>
              <div className="font-semibold text-[#37003c]">{data.score_movers.biggest_up.team}</div>
              <div className="text-xs text-gray-600">{data.score_movers.biggest_up.owner}</div>
              <div className="text-sm text-green-800 font-bold mt-1">
                {ordinal(data.score_movers.biggest_up.pts_rank)} by pts →{" "}
                {ordinal(data.score_movers.biggest_up.score_rank)} by score{" "}
                <span className="text-green-600">(+{data.score_movers.biggest_up.delta})</span>
              </div>
            </div>
          )}

          {data.score_movers.biggest_down.delta < 0 && (
            <div className="bg-red-100 border border-red-300 rounded p-3">
              <div className="text-xs font-bold text-red-800 uppercase mb-1">↓ Biggest drop</div>
              <div className="font-semibold text-[#37003c]">{data.score_movers.biggest_down.team}</div>
              <div className="text-xs text-gray-600">{data.score_movers.biggest_down.owner}</div>
              <div className="text-sm text-red-800 font-bold mt-1">
                {ordinal(data.score_movers.biggest_down.pts_rank)} by pts →{" "}
                {ordinal(data.score_movers.biggest_down.score_rank)} by score{" "}
                <span className="text-red-600">({data.score_movers.biggest_down.delta})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chip usage */}
      {data.chip_usage.length > 0 && (
        <div>
          <h3 className="font-bold text-[#37003c] text-lg mb-2 uppercase tracking-wide border-t border-gray-300 pt-4">
            Chip Usage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {data.chip_usage.map((c) => (
              <ChipBar key={c.chip} entry={c} />
            ))}
          </div>
        </div>
      )}

      {/* Global FPL rank */}
      <div className="border-t border-gray-300 pt-4">
        <h3 className="font-bold text-[#37003c] text-lg mb-2 uppercase tracking-wide">
          Global FPL Rank
        </h3>
        {data.overall_rank ? (
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Best</span>
              <span className="bg-yellow-200 text-[#37003c] px-2 py-0.5 rounded text-sm font-bold">
                {data.overall_rank.best?.team ?? "—"}
              </span>
              <span className="text-sm text-[#37003c]">
                #{data.overall_rank.best?.rank?.toLocaleString() ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Worst</span>
              <span className="bg-red-200 text-[#37003c] px-2 py-0.5 rounded text-sm font-bold">
                {data.overall_rank.worst?.team ?? "—"}
              </span>
              <span className="text-sm text-[#37003c]">
                #{data.overall_rank.worst?.rank?.toLocaleString() ?? "—"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">— Not yet populated</p>
        )}
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
