// components/FACupBracketPlacement.tsx
// What the bracket layout looks like right now, shown on the Bracket
// tab before the season's real bracket is frozen (GW22). No results
// are simulated -- only the auto-qualified/direct-entrant seeds and
// the real Qualification Round pairings are known; every slot that
// depends on an unplayed game shows TBD.

import {
  useBracketPlacement, QualificationMatch, SlotMatch, BracketSlot,
} from "@/public/hooks/useBracketPlacement";
import { ArchiveRoundSection, ArchiveMatch } from "./FACupArchiveShared";

function slotToSide(slot: BracketSlot) {
  if (slot.kind === "seed") {
    const s = slot.seed!;
    return { seed: s.seed, team: s.team, owner: s.owner };
  }
  if (slot.kind === "ko_winner") {
    return { seed: 0, team: `TBD (Match ${(slot.match_idx ?? 0) + 1} winner)`, owner: "" };
  }
  return { seed: 0, team: "TBD", owner: "" };
}

function qualificationToArchiveMatch(m: QualificationMatch, idx: number): ArchiveMatch {
  return {
    matchup_idx: idx,
    seed1: m.seed1.seed, team1: m.seed1.team, owner1: m.seed1.owner, score1: null,
    seed2: m.seed2.seed, team2: m.seed2.team, owner2: m.seed2.owner, score2: null,
    winner_seed: null,
  };
}

function slotMatchToArchiveMatch(m: SlotMatch, idx: number): ArchiveMatch {
  const a = slotToSide(m.slot1);
  const b = slotToSide(m.slot2);
  return {
    matchup_idx: idx,
    seed1: a.seed, team1: a.team, owner1: a.owner, score1: null,
    seed2: b.seed, team2: b.team, owner2: b.owner, score2: null,
    winner_seed: null,
  };
}

export default function FACupBracketPlacement() {
  const {
    round32Cutoff, qualificationRound, roundOf32, roundOf16,
    quarterfinals, semifinals, final, thirdPlace,
    loading, error, lastUpdated, refresh,
  } = useBracketPlacement();

  if (loading && qualificationRound.length === 0) {
    return <div className="px-5 py-10 text-center text-purple-400 text-sm">Loading bracket placement…</div>;
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm">
        <p className="text-red-500 font-medium mb-1">Bracket placement isn't available right now.</p>
        <p className="text-gray-500 text-xs">{error}</p>
        <button onClick={refresh} className="mt-3 text-xs underline text-purple-600">Try again</button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 pb-10">
      <h2 className="text-[15px] font-bold text-[#37003c] mb-1 flex items-center gap-2">
        Bracket Placement — If It Started Today
        <span className="flex-1 h-px bg-purple-200 block" />
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        No bracket has been frozen for this season yet — that happens at the GW22
        kickoff. This shows where things actually stand: the top {round32Cutoff} seeds
        advance straight to the Round of 32, the Qualification Round matchups are
        real, and every slot that depends on an unplayed game shows <strong>TBD</strong>.
      </p>

      <div className="space-y-6 overflow-x-auto pb-2">
        <ArchiveRoundSection title="Qualification Round" matches={qualificationRound.map(qualificationToArchiveMatch)} />
        <ArchiveRoundSection title="Round of 32" matches={roundOf32.map(slotMatchToArchiveMatch)} />
        <ArchiveRoundSection title="Round of 16" matches={roundOf16.map(slotMatchToArchiveMatch)} />
        <ArchiveRoundSection title="Quarterfinals" matches={quarterfinals.map(slotMatchToArchiveMatch)} />
        <ArchiveRoundSection title="Semifinals" matches={semifinals.map(slotMatchToArchiveMatch)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ArchiveRoundSection title="Final" matches={final.map(slotMatchToArchiveMatch)} />
          <ArchiveRoundSection title="3rd Place" matches={thirdPlace.map(slotMatchToArchiveMatch)} />
        </div>
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
