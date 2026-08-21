// components/FACupBracket.tsx
//
// Fully data-driven: every round's layout comes from the live bracket
// rows themselves (backend/scripts/facup_freeze.py writes placeholder
// rows for every round at freeze time, so there's always something to
// group and render), and seed identity comes from the live seeding
// table instead of a static per-season import. No season-specific
// constants live in this file -- it works for whichever season the
// backend is currently pointed at (or an explicit `season` prop).

import { useEffect, useRef, useId } from "react";
import { useFACupBracket, BracketMatchup } from "@/public/hooks/useFACupBracket";
import { useFACupSeeding, SeedEntry } from "@/public/hooks/useFACupSeeding";

const ROUND_ORDER = ["r1", "r32", "r16", "qf", "sf"] as const;
const ROUND_TITLES: Record<string, string> = {
  r1: "Round 1", r32: "Round of 32", r16: "Round of 16",
  qf: "Quarterfinals", sf: "Semifinals",
};

interface Props {
  season?: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function LeagueDot({ league }: { league: "premier" | "championship" }) {
  return (
    <span
      className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0 mt-px"
      style={{ background: league === "premier" ? "#5b329e" : "#3b82f6" }}
    />
  );
}

let _matchCounter = 0;
function nextMatch() { return ++_matchCounter; }

// ── PlayerRow ─────────────────────────────────────────────────────────────────

interface PlayerRowProps {
  seedNum:   number | null;
  seedInfo:  SeedEntry | null;
  score:     number | null;
  goals:     number | null;
  showGoals: boolean;
  isWinner:  boolean;
  isLive:    boolean;
  label?:    string; // "Winner of M5" style, when seedNum is null
  currentGw: number | null;
}

function PlayerRow({ seedNum, seedInfo, score, goals, showGoals, isWinner, isLive, label, currentGw }: PlayerRowProps) {
  let bg = "";
  if (!seedNum)      bg = " bg-purple-50";
  else if (isWinner) bg = " bg-green-50";
  else if (isLive)   bg = " bg-purple-50";

  const fplUrl = seedInfo?.entry_id
    ? `https://fantasy.premierleague.com/entry/${seedInfo.entry_id}${currentGw ? `/event/${currentGw - 1}` : ""}`
    : null;

  const nameEl = seedNum && seedInfo ? (
    fplUrl ? (
      <a
        href={fplUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${seedInfo.team} on FPL`}
        className={`flex-1 truncate font-medium hover:underline hover:text-[#5b329e] transition-colors ${isWinner ? "font-bold" : ""} text-[#37003c]`}
      >
        {seedInfo.team}
      </a>
    ) : (
      <span className={`flex-1 truncate font-medium ${isWinner ? "font-bold" : ""} text-[#37003c]`}>
        {seedInfo.team}
      </span>
    )
  ) : seedNum ? (
    <span className="flex-1 truncate font-medium text-[#37003c]">Seed {seedNum}</span>
  ) : (
    <span className="flex-1 truncate text-[10px] font-bold tracking-wide text-purple-400 italic">
      {label ?? "TBD"}
    </span>
  );

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 min-h-[30px] relative text-[11px]${bg}`}>
      {isLive && seedNum && (
        <span className="absolute top-0 right-0 bg-[#32FF6A] text-[#37003c] text-[7px] font-bold tracking-widest px-1 rounded-bl">
          live
        </span>
      )}
      <span className="text-[9px] font-bold text-purple-300 w-[14px] text-right flex-shrink-0">
        {seedNum ?? ""}
      </span>
      {seedInfo
        ? <LeagueDot league={seedInfo.league} />
        : <span className="inline-block w-[5px] h-[5px] rounded-full bg-purple-200 flex-shrink-0 mt-px" />
      }
      {nameEl}
      {isWinner
        ? <span className="inline-block w-[5px] h-[5px] rounded-full bg-[#32FF6A] flex-shrink-0" />
        : <span className="inline-block w-[5px] h-[5px] flex-shrink-0" />
      }
      {showGoals && goals !== null && (
        <span className="text-[8px] text-purple-300 flex-shrink-0" title="Goals (tiebreaker)">
          {goals}⚽
        </span>
      )}
      {score !== null ? (
        <span className="text-[12px] font-bold min-w-[20px] text-right text-[#37003c]">{score}</span>
      ) : (
        <span className="text-[10px] text-purple-200 min-w-[20px] text-right">—</span>
      )}
    </div>
  );
}

// ── MatchupCard ───────────────────────────────────────────────────────────────

interface MatchupCardProps {
  matchup:   BracketMatchup | null;
  seeding:   Record<number, SeedEntry>;
  isLive:    boolean;
  matchNum:  number;
  label1?:   string;
  label2?:   string;
  extraCls?: string;
  currentGw: number | null;
}

function MatchupCard({ matchup, seeding, isLive, matchNum, label1, label2, extraCls = "", currentGw }: MatchupCardProps) {
  const win1 = !!matchup?.winner_seed && matchup.winner_seed === matchup.seed1;
  const win2 = !!matchup?.winner_seed && matchup.winner_seed === matchup.seed2;
  const tied = matchup?.score1 != null && matchup?.score2 != null
    && matchup.score1 === matchup.score2;

  let border = "border-[#ddd6fe]";
  if (isLive)                           border = "border-[#32FF6A] shadow-[0_0_0_2px_rgba(50,255,106,0.2)]";
  else if (extraCls.includes("gold"))   border = "border-yellow-400 shadow-[0_0_0_2px_rgba(234,179,8,0.15)]";
  else if (extraCls.includes("bronze")) border = "border-gray-400 shadow-[0_0_0_2px_rgba(156,163,175,0.15)]";

  return (
    <div className={`w-[172px] bg-white border-[1.5px] ${border} rounded-md overflow-hidden flex-shrink-0 mb-2 hover:border-purple-400 transition-colors`}>
      <div className="px-2 py-[3px] bg-purple-50 border-b border-purple-100 flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-widest uppercase text-purple-300">
          Match {matchNum}
        </span>
        {isLive && (
          <span className="text-[7px] font-bold tracking-widest uppercase bg-[#32FF6A] text-[#37003c] px-1.5 py-0.5 rounded">
            live
          </span>
        )}
      </div>
      <PlayerRow
        seedNum={matchup?.seed1 ?? null} seedInfo={matchup?.seed1 ? seeding[matchup.seed1] ?? null : null}
        score={matchup?.score1 ?? null} goals={matchup?.goals1 ?? null}
        showGoals={!!tied} isWinner={win1} isLive={false}
        label={label1} currentGw={currentGw}
      />
      <div className="border-t border-purple-100" />
      <PlayerRow
        seedNum={matchup?.seed2 ?? null} seedInfo={matchup?.seed2 ? seeding[matchup.seed2] ?? null : null}
        score={matchup?.score2 ?? null} goals={matchup?.goals2 ?? null}
        showGoals={!!tied} isWinner={win2} isLive={false}
        label={label2} currentGw={currentGw}
      />
    </div>
  );
}

// ── Round column ──────────────────────────────────────────────────────────────

function RoundCol({ title, gw, id, children }: {
  title: string; gw: number | null; id: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-shrink-0 w-[182px]" id={id}>
      <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200 whitespace-nowrap">
        {title}
        {gw != null && <span className="block text-[9.5px] font-normal text-purple-300 mt-0.5">GW {gw}</span>}
      </div>
      <div className="pt-2.5">{children}</div>
    </div>
  );
}

// ── Main bracket ──────────────────────────────────────────────────────────────

export default function FACupBracket({ season }: Props) {
  const { bracket, currentGw, loading, error, lastUpdated, refresh } = useFACupBracket(season);
  const { seeding, loading: seedingLoading } = useFACupSeeding(season);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);

  _matchCounter = 0;

  // Group live bracket rows by round, sorted by matchup_idx -- this IS
  // the layout; no static per-season arrays needed.
  const byRound: Record<string, BracketMatchup[]> = {};
  bracket.forEach(m => {
    (byRound[m.round] ??= []).push(m);
  });
  Object.values(byRound).forEach(rows => rows.sort((a, b) => a.matchup_idx - b.matchup_idx));

  const r1   = byRound["r1"]   ?? [];
  const r32  = byRound["r32"]  ?? [];
  const r16  = byRound["r16"]  ?? [];
  const qf   = byRound["qf"]   ?? [];
  const sf   = byRound["sf"]   ?? [];
  const finalM = (byRound["final"] ?? [])[0] ?? null;
  const thirdM = (byRound["3rd"]   ?? [])[0] ?? null;

  const live = (m: BracketMatchup | null) =>
    !!m && !!currentGw && m.gw === currentGw && !m.winner_seed && !!m.seed1;

  // Match numbers, derived purely from how many rows each round has.
  const matchNums: Record<string, number> = {};
  let mc = 0;
  r1.forEach((_, i)  => { matchNums[`r1-${i}`]  = ++mc; });
  r32.forEach((_, i) => { matchNums[`r32-${i}`] = ++mc; });
  r16.forEach((_, i) => { matchNums[`r16-${i}`] = ++mc; });
  qf.forEach((_, i)  => { matchNums[`qf-${i}`]  = ++mc; });
  sf.forEach((_, i)  => { matchNums[`sf-${i}`]  = ++mc; });
  if (finalM) matchNums["final-0"] = ++mc;
  if (thirdM) matchNums["3rd-0"]   = ++mc;

  function wLabel(round: string, idx: number) {
    return `Winner of M${matchNums[`${round}-${idx}`] ?? "?"}`;
  }
  function lLabel(round: string, idx: number) {
    return `Loser of M${matchNums[`${round}-${idx}`] ?? "?"}`;
  }
  // A Round-2 row's TBD side (whichever of seed1/seed2 is null) waits on
  // the winner of R1 row m.feeds_r1_matchup_idx.
  function r32Label(m: BracketMatchup): string | undefined {
    if (m.feeds_r1_matchup_idx == null) return undefined;
    return wLabel("r1", m.feeds_r1_matchup_idx);
  }

  const champ  = finalM?.winner_seed ? seeding[finalM.winner_seed]?.team ?? "TBD" : "TBD";
  const runner = finalM?.winner_seed
    ? seeding[finalM.winner_seed === finalM.seed1 ? (finalM.seed2 ?? 0) : (finalM.seed1 ?? 0)]?.team ?? "TBD"
    : "TBD";
  const third  = thirdM?.winner_seed ? seeding[thirdM.winner_seed]?.team ?? "TBD" : "TBD";

  // ── SVG connector overlay ──────────────────────────────────────────────────

  function drawConnectors() {
    const wrap = wrapRef.current;
    const svg  = svgRef.current;
    if (!wrap || !svg) return;

    const wr = wrap.getBoundingClientRect();
    const _wrap = wrap;
    svg.setAttribute("width",  String(_wrap.scrollWidth));
    svg.setAttribute("height", String(_wrap.scrollHeight));
    svg.setAttribute("viewBox", `0 0 ${_wrap.scrollWidth} ${_wrap.scrollHeight}`);

    function my(el: Element): number {
      const r = el.getBoundingClientRect();
      return (r.top + r.bottom) / 2 - wr.top + _wrap.scrollTop;
    }
    function rx(el: Element): number {
      return el.getBoundingClientRect().right - wr.left + _wrap.scrollLeft;
    }
    function lx(el: Element): number {
      return el.getBoundingClientRect().left - wr.left + _wrap.scrollLeft;
    }

    const lines: string[] = [];

    function addLine(x1: number, y1: number, x2: number, y2: number, stroke: string, dash = "") {
      lines.push(
        `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="1"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`
      );
    }

    function connectPairs(
      fromCards: Element[],
      toCards:   Element[],
      pairMap:   [number, number][],
      stroke:    string,
      dash = ""
    ) {
      const groups: Map<number, number[]> = new Map();
      pairMap.forEach(([fi, ti]) => {
        if (!groups.has(ti)) groups.set(ti, []);
        groups.get(ti)!.push(fi);
      });

      groups.forEach((fromIdxs, toIdx) => {
        const tc = toCards[toIdx];
        if (!tc) return;
        const ytTarget = my(tc);
        const xtLeft   = lx(tc);

        const midpoints = fromIdxs.map(fi => {
          const fc = fromCards[fi];
          if (!fc) return null;
          return { y: my(fc), xRight: rx(fc) };
        }).filter(Boolean) as { y: number; xRight: number }[];

        if (midpoints.length === 0) return;

        const midX = midpoints[0].xRight + (xtLeft - midpoints[0].xRight) / 2;

        midpoints.forEach(({ y, xRight }) => {
          addLine(xRight, y, midX, y, stroke, dash);
        });

        if (midpoints.length > 1) {
          const yMin = Math.min(...midpoints.map(p => p.y));
          const yMax = Math.max(...midpoints.map(p => p.y));
          const yMid = (yMin + yMax) / 2;
          addLine(midX, yMin, midX, yMax, stroke, dash);
          addLine(midX, yMid, xtLeft, ytTarget, stroke, dash);
        } else {
          addLine(midX, midpoints[0].y, xtLeft, ytTarget, stroke, dash);
        }
      });
    }

    // R1 -> R32: derived live from each r32 row's feeds_r1_matchup_idx,
    // rather than a hardcoded per-season mapping.
    const r1Cards  = Array.from(_wrap.querySelectorAll("#col-r1  .mu-card"));
    const r32Cards = Array.from(_wrap.querySelectorAll("#col-r32 .mu-card"));
    const r1ToR32: [number, number][] = [];
    r32.forEach((m, r32Idx) => {
      if (m.feeds_r1_matchup_idx != null) r1ToR32.push([m.feeds_r1_matchup_idx, r32Idx]);
    });
    connectPairs(r1Cards, r32Cards, r1ToR32, "#a78bfa");

    // R32 -> R16, R16 -> QF, QF -> SF: standard 2-to-1 halving, derived
    // from actual row counts rather than hardcoded sizes.
    const r16Cards = Array.from(_wrap.querySelectorAll("#col-r16 .mu-card"));
    const halving = (n: number): [number, number][] =>
      Array.from({ length: n }, (_, i) => [i, Math.floor(i / 2)] as [number, number]);
    connectPairs(r32Cards, r16Cards, halving(r32.length), "#ddd6fe");

    const qfCards = Array.from(_wrap.querySelectorAll("#col-qf .mu-card"));
    connectPairs(r16Cards, qfCards, halving(r16.length), "#ddd6fe");

    const sfCards = Array.from(_wrap.querySelectorAll("#col-sf .mu-card"));
    connectPairs(qfCards, sfCards, halving(qf.length), "#ddd6fe");

    const finalEl = _wrap.querySelector("#card-final .mu-card");
    const thirdEl = _wrap.querySelector("#card-3rd .mu-card");
    if (finalEl && sfCards.length >= 2) {
      connectPairs(sfCards, [finalEl], [[0,0],[1,0]], "#ddd6fe");
    }
    if (thirdEl && sfCards.length >= 2) {
      connectPairs(sfCards, [thirdEl], [[0,0],[1,0]], "#9ca3af", "3,2");
    }

    const p1 = _wrap.querySelector("#podium-1");
    const p2 = _wrap.querySelector("#podium-2");
    const p3 = _wrap.querySelector("#podium-3");
    if (finalEl && p1 && p2) {
      const yF = my(finalEl), xF = rx(finalEl);
      const yP1 = my(p1), yP2 = my(p2);
      const xP = lx(p1);
      const midX = xF + (xP - xF) / 2;
      addLine(xF, yF, midX, yF, "#eab308", "4,3");
      addLine(midX, yP1, midX, yP2, "#eab308", "4,3");
      addLine(midX, yP1, xP, yP1, "#eab308", "4,3");
      addLine(midX, yP2, xP, yP2, "#eab308", "4,3");
    }
    if (thirdEl && p3) {
      const y3 = my(thirdEl), x3 = rx(thirdEl);
      const yP3 = my(p3), xP3 = lx(p3);
      const midX = x3 + (xP3 - x3) / 2;
      addLine(x3, y3, midX, y3, "#d97706", "3,2");
      addLine(midX, y3, midX, yP3, "#d97706", "3,2");
      addLine(midX, yP3, xP3, yP3, "#d97706", "3,2");
    }

    svg.innerHTML = lines.join("");
  }

  useEffect(() => {
    const t1 = setTimeout(drawConnectors, 100);
    const t2 = setTimeout(drawConnectors, 500);
    const t3 = setTimeout(drawConnectors, 1200);
    window.addEventListener("resize", drawConnectors);
    let ro: ResizeObserver | null = null;
    if (wrapRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(drawConnectors);
      ro.observe(wrapRef.current);
    }
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener("resize", drawConnectors);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracket, seeding]);

  if ((loading || seedingLoading) && bracket.length === 0) {
    return <div className="px-5 py-10 text-center text-purple-400 text-sm">Loading bracket…</div>;
  }

  if (!loading && bracket.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm">
        <p className="text-gray-500 font-medium mb-1">No bracket yet for this season.</p>
        <p className="text-gray-400 text-xs">
          The tournament hasn't been frozen yet — check the Seedings tab for the
          live projection until then.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-3">
      <div className="flex flex-wrap gap-3 px-5 mb-2 text-[11px] text-purple-600 items-center">
        {[["#32FF6A","Live"],["#22c55e","Winner"],["#5b329e","Premier"],["#3b82f6","Championship"]].map(([c,l])=>(
          <span key={l} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{background:c}}/>
            {l}
          </span>
        ))}
        <span className="text-purple-300">⚽ shown when tied</span>
        <span className="text-purple-300">🔗 team name = FPL link</span>
        {lastUpdated && (
          <span className="ml-auto text-purple-300 text-[10px]">
            Updated {new Date(lastUpdated).toLocaleTimeString()} ·{" "}
            <button onClick={refresh} className="underline hover:text-purple-600">Refresh</button>
          </span>
        )}
        {error && <span className="text-red-400 text-[10px]">{error}</span>}
      </div>

      <div className="overflow-x-auto px-5 pb-4">
        <div ref={wrapRef} style={{ position: "relative", width: "max-content" }}>
          <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }} />

          <div className="flex items-start gap-0">

            <RoundCol title="Round 1" gw={r1[0]?.gw ?? null} id="col-r1">
              {r1.map((m, i) => (
                <div key={i} className="mu-card">
                  <MatchupCard matchup={m} seeding={seeding} isLive={live(m)} matchNum={matchNums[`r1-${i}`]} currentGw={currentGw} />
                </div>
              ))}
            </RoundCol>

            {r32.length > 0 && <div className="w-10 flex-shrink-0" />}

            {r32.length > 0 && (
              <RoundCol title="Round of 32" gw={r32[0]?.gw ?? null} id="col-r32">
                {r32.map((m, i) => (
                  <div key={i} className="mu-card">
                    <MatchupCard
                      matchup={m} seeding={seeding} isLive={live(m)} matchNum={matchNums[`r32-${i}`]}
                      label1={!m.seed1 ? r32Label(m) : undefined}
                      label2={!m.seed2 ? r32Label(m) : undefined}
                      currentGw={currentGw}
                    />
                  </div>
                ))}
              </RoundCol>
            )}

            {r16.length > 0 && <div className="w-10 flex-shrink-0" />}

            {r16.length > 0 && (
              <RoundCol title="Round of 16" gw={r16[0]?.gw ?? null} id="col-r16">
                {r16.map((m, i) => {
                  const [aIdx, bIdx] = [i * 2, i * 2 + 1];
                  return (
                    <div key={i} className="mu-card">
                      <MatchupCard
                        matchup={m} seeding={seeding} isLive={live(m)} matchNum={matchNums[`r16-${i}`]}
                        label1={!m.seed1 ? wLabel("r32", aIdx) : undefined}
                        label2={!m.seed2 ? wLabel("r32", bIdx) : undefined}
                        currentGw={currentGw}
                      />
                    </div>
                  );
                })}
              </RoundCol>
            )}

            {qf.length > 0 && <div className="w-10 flex-shrink-0" />}

            {qf.length > 0 && (
              <RoundCol title="Quarterfinals" gw={qf[0]?.gw ?? null} id="col-qf">
                {qf.map((m, i) => {
                  const [aIdx, bIdx] = [i * 2, i * 2 + 1];
                  return (
                    <div key={i} className="mu-card">
                      <MatchupCard
                        matchup={m} seeding={seeding} isLive={live(m)} matchNum={matchNums[`qf-${i}`]}
                        label1={!m.seed1 ? wLabel("r16", aIdx) : undefined}
                        label2={!m.seed2 ? wLabel("r16", bIdx) : undefined}
                        currentGw={currentGw}
                      />
                    </div>
                  );
                })}
              </RoundCol>
            )}

            {sf.length > 0 && <div className="w-10 flex-shrink-0" />}

            {sf.length > 0 && (
              <RoundCol title="Semifinals" gw={sf[0]?.gw ?? null} id="col-sf">
                {sf.map((m, i) => {
                  const [aIdx, bIdx] = [i * 2, i * 2 + 1];
                  return (
                    <div key={i} className="mu-card">
                      <MatchupCard
                        matchup={m} seeding={seeding} isLive={live(m)} matchNum={matchNums[`sf-${i}`]}
                        label1={!m.seed1 ? wLabel("qf", aIdx) : undefined}
                        label2={!m.seed2 ? wLabel("qf", bIdx) : undefined}
                        currentGw={currentGw}
                      />
                    </div>
                  );
                })}
              </RoundCol>
            )}

            {(finalM || thirdM) && <div className="w-10 flex-shrink-0" />}

            {(finalM || thirdM) && (
              <div className="flex flex-col flex-shrink-0 w-[182px]">
                <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200">
                  Finals Week
                  {finalM?.gw != null && <span className="block text-[9.5px] font-normal text-purple-300 mt-0.5">GW {finalM.gw}</span>}
                </div>
                <div className="pt-2.5">
                  {finalM && (
                    <>
                      <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-600 text-center pb-1">🥇 Final</p>
                      <div id="card-final">
                        <div className="mu-card">
                          <MatchupCard
                            matchup={finalM} seeding={seeding} isLive={live(finalM)} matchNum={matchNums["final-0"]}
                            extraCls="gold"
                            label1={!finalM.seed1 ? wLabel("sf", 0) : undefined}
                            label2={!finalM.seed2 ? wLabel("sf", 1) : undefined}
                            currentGw={currentGw}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {thirdM && (
                    <>
                      <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 text-center pb-1 pt-3">🥉 3rd Place</p>
                      <div id="card-3rd">
                        <div className="mu-card">
                          <MatchupCard
                            matchup={thirdM} seeding={seeding} isLive={live(thirdM)} matchNum={matchNums["3rd-0"]}
                            extraCls="bronze"
                            label1={!thirdM.seed1 ? lLabel("sf", 0) : undefined}
                            label2={!thirdM.seed2 ? lLabel("sf", 1) : undefined}
                            currentGw={currentGw}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {finalM?.winner_seed && (
              <>
                <div className="w-10 flex-shrink-0" />
                <div className="flex flex-col flex-shrink-0 w-[130px]">
                  <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200">
                    Podium
                  </div>
                  <div className="pt-2.5 flex flex-col gap-2">
                    <div id="podium-1" className="rounded-lg p-3 text-center" style={{background:"linear-gradient(135deg,#fefce8,#fef9c3)",border:"2px solid #eab308"}}>
                      <div className="text-2xl mb-1">🥇</div>
                      <div className="text-[9px] font-bold tracking-widest uppercase text-amber-800">Champion</div>
                      <div className="text-[12px] font-bold text-[#37003c] mt-0.5 break-words leading-tight">{champ}</div>
                    </div>
                    <div id="podium-2" className="rounded-lg p-3 text-center" style={{background:"linear-gradient(135deg,#f9fafb,#f3f4f6)",border:"2px solid #d1d5db"}}>
                      <div className="text-2xl mb-1">🥈</div>
                      <div className="text-[9px] font-bold tracking-widest uppercase text-gray-500">Runner-up</div>
                      <div className="text-[12px] font-bold text-[#37003c] mt-0.5 break-words leading-tight">{runner}</div>
                    </div>
                    <div id="podium-3" className="rounded-lg p-3 text-center" style={{background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #d97706"}}>
                      <div className="text-2xl mb-1">🥉</div>
                      <div className="text-[9px] font-bold tracking-widest uppercase text-amber-700">3rd Place</div>
                      <div className="text-[12px] font-bold text-[#37003c] mt-0.5 break-words leading-tight">{third}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
