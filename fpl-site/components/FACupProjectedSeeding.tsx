// components/FACupProjectedSeeding.tsx
// Live "if the Cup started today" seeding preview. Recomputed on the
// backend from current standings every fetch -- nothing here is final
// until the season's freeze date locks the real bracket.

import Link from "next/link";
import { useProjectedSeeding, ProjectedSeed } from "@/public/hooks/useProjectedSeeding";

// Seeds 1-3 are locked to last season's trophy winners regardless of
// current score. Seeds up through round32Cutoff all advance straight
// to the Round of 32 with no game -- score-based, can still shift.
// Everyone else is still fighting for a spot via the Qualification Round.
function qualificationStatus(seed: number, round32Cutoff: number): { label: string; locked: boolean } {
  const locked = seed <= 3;
  if (seed <= round32Cutoff) {
    return { label: locked ? "Qualified for Round of 32" : "Currently Qualified for Round of 32", locked };
  }
  return { label: "Currently Heading to Qualification Round", locked: false };
}

export default function FACupProjectedSeeding() {
  const {
    lastSeason, facupWinner, premWinner, champWinner,
    basis, autoQualify, round32Cutoff, seeds, qualificationRound, loading, error, lastUpdated, refresh,
  } = useProjectedSeeding();

  if (loading && seeds.length === 0) {
    return <div className="px-5 py-10 text-center text-purple-400 text-sm">Loading projected seeding…</div>;
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm">
        <p className="text-red-500 font-medium mb-1">Projected seeding isn't available right now.</p>
        <p className="text-gray-500 text-xs">{error}</p>
        <p className="text-gray-400 text-xs mt-2">
          This is expected right at the start of a new season, while last season's
          Championship winner is mid-transition between leagues — it'll resolve on
          its own once both leagues' tables catch up.
        </p>
        <button onClick={refresh} className="mt-3 text-xs underline text-purple-600">Try again</button>
      </div>
    );
  }

  const isAlphabetical = (basis || "").startsWith("alphabetical");

  return (
    <div className="px-5 py-4 pb-10">
      <h2 className="text-[15px] font-bold text-[#37003c] mb-1 flex items-center gap-2">
        Projected Seeding — If the Cup Started Today
        <span className="flex-1 h-px bg-purple-200 block" />
      </h2>
      <div className="text-xs text-gray-500 mb-3 space-y-1">
        <p>
          Recomputed live from current standings — not final until the bracket
          freezes. Seeds 1–3 are locked in ({lastSeason} trophy winners), seed 4 is
          the highest current scorer. The top {round32Cutoff} seeds advance straight
          to the Round of 32 (the rest of that cutoff is a mechanical consequence of
          needing a clean bracket size, not a special reward); everyone else plays a
          Qualification Round first. Everything past seed 3 will keep shuffling as
          the season plays out.
        </p>
        {isAlphabetical && (
          <p className="inline-block bg-yellow-50 border-l-4 border-yellow-400 px-2 py-1 text-yellow-800">
            No gameweek scores yet this season — seeds 4+ are ordered alphabetically
            by first name until real scores start flowing in.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
        <TrophyChip label="FA Cup" name={facupWinner} />
        <TrophyChip label="Premier" name={premWinner} />
        <TrophyChip label="Championship" name={champWinner} />
      </div>

      <div className="overflow-x-auto rounded-md shadow-sm mb-6">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {["#", "Team", "Manager", "League", "Status", "Score"].map((h, i) => (
                <th
                  key={h}
                  className="bg-[#37003c] text-white px-3 py-2 text-left text-[11px] font-semibold tracking-wide"
                  style={i === 5 ? { textAlign: "right" } : {}}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seeds.map((p: ProjectedSeed, i: number) => {
              const status = qualificationStatus(p.seed, round32Cutoff);
              const bg = i % 2 === 0 ? "bg-white" : "bg-purple-50";
              return (
                <tr key={p.seed} className={`${bg} hover:bg-purple-100 transition-colors`}>
                  <td className="px-3 py-1.5 font-bold text-[#37003c]">{p.seed}</td>
                  <td className="px-3 py-1.5">
                    <span className="font-semibold text-[#37003c]">{p.team}</span>
                  </td>
                  <td className="px-3 py-1.5 text-purple-700">
                    <Link href={`/managers/${encodeURIComponent(p.owner)}`} className="hover:underline">
                      {p.owner}
                    </Link>
                  </td>
                  <td className="px-3 py-1.5">
                    {p.league === "premier" ? (
                      <span className="inline-block text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded tracking-wide">
                        Premier
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded tracking-wide">
                        Champ
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                        status.locked ? "bg-green-100 text-green-800" :
                        p.seed <= round32Cutoff ? "bg-green-50 text-green-700" :
                        "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {status.label}
                    </span>
                    <div className="text-gray-400 text-[10px] mt-0.5">{p.reason}</div>
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold font-mono text-[#37003c]">
                    {p.score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="text-[14px] font-bold text-[#37003c] mb-1 flex items-center gap-2">
        Projected Qualification Round Matchups
        <span className="flex-1 h-px bg-purple-200 block" />
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Top {round32Cutoff} seeds advance straight to the Round of 32. The remaining{" "}
        {qualificationRound.length * 2} seeds play a single Qualification Round,
        paired best-vs-worst, for the last spots. Everything past that depends on
        who actually wins these matches.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {qualificationRound.map((m, i) => (
          <div key={i} className="border border-[#ddd6fe] rounded-md overflow-hidden text-[11px]">
            <div className="bg-purple-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-purple-400">
              Match {i + 1}
            </div>
            <MatchRow seed={m.seed1} />
            <div className="border-t border-purple-100" />
            <MatchRow seed={m.seed2} />
          </div>
        ))}
      </div>

      {lastUpdated && (
        <p className="text-[10px] text-purple-300 mt-4">
          Updated {new Date(lastUpdated).toLocaleTimeString()} ·{" "}
          <button onClick={refresh} className="underline hover:text-purple-600">Refresh</button>
        </p>
      )}
    </div>
  );
}

function TrophyChip({ label, name }: { label: string; name: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 rounded px-2 py-1">
      <span className="font-bold text-purple-400">{label}:</span>
      <span className="text-[#37003c] font-medium">{name ?? "—"}</span>
    </span>
  );
}

function MatchRow({ seed }: { seed: ProjectedSeed }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      <span className="text-[9px] font-bold text-purple-300 w-[16px] text-right flex-shrink-0">
        {seed.seed}
      </span>
      <span className="flex-1 truncate font-medium text-[#37003c]">{seed.team}</span>
    </div>
  );
}
