// components/FACupHypotheticalBracket.tsx
// "If the Cup started today" -- a full hypothetical bracket shown on
// the Bracket tab before the season's real bracket is frozen (GW22).
// Only the Qualification Round is real seeding; everything after that
// assumes the better seed wins, purely as a preview.

import { useHypotheticalBracket, HBMatch } from "@/public/hooks/useHypotheticalBracket";
import { ArchiveRoundSection, ArchivePodiumCard, ArchiveMatch } from "./FACupArchiveShared";

function toArchiveMatch(m: HBMatch, idx: number): ArchiveMatch {
  return {
    matchup_idx: idx,
    seed1: m.seed1?.seed ?? 0,
    team1: m.seed1?.team ?? "BYE",
    owner1: m.seed1?.owner ?? "",
    score1: null,
    seed2: m.seed2?.seed ?? 0,
    team2: m.seed2?.team ?? "BYE",
    owner2: m.seed2?.owner ?? "",
    score2: null,
    winner_seed: m.winner_seed,
  };
}

export default function FACupHypotheticalBracket() {
  const {
    qualificationRound, roundOf32, roundOf16,
    quarterfinals, semifinals, final, thirdPlace, champion,
    loading, error, lastUpdated, refresh,
  } = useHypotheticalBracket();

  if (loading && qualificationRound.length === 0) {
    return <div className="px-5 py-10 text-center text-purple-400 text-sm">Loading hypothetical bracket…</div>;
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm">
        <p className="text-red-500 font-medium mb-1">Hypothetical bracket isn't available right now.</p>
        <p className="text-gray-500 text-xs">{error}</p>
        <button onClick={refresh} className="mt-3 text-xs underline text-purple-600">Try again</button>
      </div>
    );
  }

  const runnerUp = (() => {
    const f = final[0];
    if (!f) return null;
    return f.winner_seed === f.seed1?.seed ? f.seed2 : f.seed1;
  })();
  const thirdWinner = (() => {
    const t = thirdPlace[0];
    if (!t) return null;
    return t.winner_seed === t.seed1?.seed ? t.seed1 : t.seed2;
  })();
  const podium = champion && runnerUp && thirdWinner ? {
    champion: { seed: champion.seed, team: champion.team, owner: champion.owner },
    runnerUp: { seed: runnerUp.seed, team: runnerUp.team, owner: runnerUp.owner },
    third: { seed: thirdWinner.seed, team: thirdWinner.team, owner: thirdWinner.owner },
  } : null;

  return (
    <div className="px-5 py-4 pb-10">
      <h2 className="text-[15px] font-bold text-[#37003c] mb-1 flex items-center gap-2">
        If The Cup Started Today
        <span className="flex-1 h-px bg-purple-200 block" />
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        No bracket has been frozen for this season yet — that happens at the GW22
        kickoff. This is a hypothetical run using today's standings: the
        Qualification Round matchups are real, and every round after that
        assumes the better seed wins, all the way to a hypothetical champion.
        Not a prediction — an upset run is what makes a cup a cup.
      </p>

      <div className="space-y-6 overflow-x-auto pb-2">
        <ArchiveRoundSection title="Qualification Round" matches={qualificationRound.map(toArchiveMatch)} />
        <ArchiveRoundSection title="Round of 32" matches={roundOf32.map(toArchiveMatch)} />
        <ArchiveRoundSection title="Round of 16" matches={roundOf16.map(toArchiveMatch)} />
        <ArchiveRoundSection title="Quarterfinals" matches={quarterfinals.map(toArchiveMatch)} />
        <ArchiveRoundSection title="Semifinals" matches={semifinals.map(toArchiveMatch)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ArchiveRoundSection title="Final" matches={final.map(toArchiveMatch)} />
          <ArchiveRoundSection title="3rd Place" matches={thirdPlace.map(toArchiveMatch)} />
        </div>
      </div>

      {podium && (
        <div className="mt-6">
          <ArchivePodiumCard podium={podium} />
        </div>
      )}

      {lastUpdated && (
        <p className="text-[10px] text-purple-300 mt-4">
          Updated {new Date(lastUpdated).toLocaleTimeString()} ·{" "}
          <button onClick={refresh} className="underline hover:text-purple-600">Refresh</button>
        </p>
      )}
    </div>
  );
}
