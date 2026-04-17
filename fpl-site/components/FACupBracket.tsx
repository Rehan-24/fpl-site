// components/FACupBracket.tsx

import { useEffect, useRef, useId } from "react";
import { SEEDS, R1_MATCHUPS, R32_SLOTS, Seed } from "@/lib/facupSeedings";
import { useFACupBracket, BracketMatchup } from "@/public/hooks/useFACupBracket";

// ── helpers ───────────────────────────────────────────────────────────────────

function getSeed(s: number | null | undefined): Seed | null {
  if (!s) return null;
  return SEEDS.find(x => x.seed === s) ?? null;
}

function LeagueDot({ league }: { league: "prem" | "champ" }) {
  return (
    <span
      className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0 mt-px"
      style={{ background: league === "prem" ? "#5b329e" : "#3b82f6" }}
    />
  );
}

// Global match counter — resets each render via the component
let _matchCounter = 0;
function nextMatch() { return ++_matchCounter; }

// ── PlayerRow ─────────────────────────────────────────────────────────────────

interface PlayerRowProps {
  seed:      Seed | null;
  score:     number | null;
  goals:     number | null;
  showGoals: boolean;
  isWinner:  boolean;
  isLive:    boolean;
  label?:    string; // "Winner of M5" style
  currentGw: number | null;
}

function PlayerRow({ seed, score, goals, showGoals, isWinner, isLive, label, currentGw }: PlayerRowProps) {
  let bg = "";
  if (!seed)     bg = " bg-purple-50";
  else if (isWinner) bg = " bg-green-50";
  else if (isLive)   bg = " bg-purple-50";

  const nameEl = seed ? (
    seed.fplUrl ? (
      <a
        href={currentGw ? `${seed.fplUrl}/event/${currentGw-1}` : seed.fplUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${seed.team} on FPL`}
        className={`flex-1 truncate font-medium hover:underline hover:text-[#5b329e] transition-colors ${isWinner ? "font-bold" : ""} text-[#37003c]`}
      >
        {seed.team}
      </a>
    ) : (
      <span className={`flex-1 truncate font-medium ${isWinner ? "font-bold" : ""} text-[#37003c]`}>
        {seed.team}
      </span>
    )
  ) : (
    // FIFA-style "Winner of M3" label
    <span className="flex-1 truncate text-[10px] font-bold tracking-wide text-purple-400 italic">
      {label ?? "TBD"}
    </span>
  );

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 min-h-[30px] relative text-[11px]${bg}`}>
      {isLive && seed && (
        <span className="absolute top-0 right-0 bg-[#32FF6A] text-[#37003c] text-[7px] font-bold tracking-widest px-1 rounded-bl">
          live
        </span>
      )}
      <span className="text-[9px] font-bold text-purple-300 w-[14px] text-right flex-shrink-0">
        {seed?.seed ?? ""}
      </span>
      {seed
        ? <LeagueDot league={seed.league} />
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
  isLive:    boolean;
  matchNum:  number;          // "Match 5" header
  label1?:   string;          // override label for seed1 when TBD
  label2?:   string;          // override label for seed2 when TBD
  extraCls?: string;
  currentGw: number | null;
}

function MatchupCard({ matchup, isLive, matchNum, label1, label2, extraCls = "", currentGw }: MatchupCardProps) {
  const s1   = getSeed(matchup?.seed1);
  const s2   = getSeed(matchup?.seed2);
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
      {/* Match number header */}
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
        seed={s1} score={matchup?.score1 ?? null} goals={matchup?.goals1 ?? null}
        showGoals={!!tied} isWinner={win1} isLive={false}
        label={label1 ?? (s1 ? undefined : "TBD")} currentGw={currentGw}
      />
      <div className="border-t border-purple-100" />
      <PlayerRow
        seed={s2} score={matchup?.score2 ?? null} goals={matchup?.goals2 ?? null}
        showGoals={!!tied} isWinner={win2} isLive={false}
        label={label2 ?? (s2 ? undefined : "TBD")} currentGw={currentGw}
      />
    </div>
  );
}

// ── Round column ──────────────────────────────────────────────────────────────

function RoundCol({ title, gw, id, children }: {
  title: string; gw: number; id: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-shrink-0 w-[182px]" id={id}>
      <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200 whitespace-nowrap">
        {title}
        <span className="block text-[9.5px] font-normal text-purple-300 mt-0.5">GW {gw}</span>
      </div>
      <div className="pt-2.5">{children}</div>
    </div>
  );
}

// ── Main bracket ──────────────────────────────────────────────────────────────

export default function FACupBracket() {
  const { bracket, currentGw, loading, error, lastUpdated, refresh } = useFACupBracket();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);

  // Reset match counter each render
  _matchCounter = 0;

  // Index matchups by "round-idx"
  const idx: Record<string, BracketMatchup> = {};
  bracket.forEach(m => { idx[`${m.round}-${m.matchup_idx}`] = m; });
  const gm = (round: string, i: number) => idx[`${round}-${i}`] ?? null;
  const live = (m: BracketMatchup | null) =>
    !!m && !!currentGw && m.gw === currentGw && !m.winner_seed && !!m.seed1;

  // Build match number map: "round-idx" → match number
  // R1: M1-M8, R32: M9-M24, R16: M25-M32, QF: M33-M36, SF: M37-M38, Final: M39, 3rd: M40
  const matchNums: Record<string, number> = {};
  let mc = 0;
  R1_MATCHUPS.forEach((_, i)         => { matchNums[`r1-${i}`]    = ++mc; });
  R32_SLOTS.forEach((_, i)           => { matchNums[`r32-${i}`]   = ++mc; });
  Array.from({length:8}, (_, i)      => { matchNums[`r16-${i}`]   = ++mc; });
  Array.from({length:4}, (_, i)      => { matchNums[`qf-${i}`]    = ++mc; });
  Array.from({length:2}, (_, i)      => { matchNums[`sf-${i}`]    = ++mc; });
  matchNums["final-0"] = ++mc;
  matchNums["3rd-0"]   = ++mc;

  // "Winner of M#" label generator
  function wLabel(round: string, idx: number) {
    return `Winner of M${matchNums[`${round}-${idx}`] ?? "?"}`;
  }
  function lLabel(round: string, idx: number) {
    return `Loser of M${matchNums[`${round}-${idx}`] ?? "?"}`;
  }

  // Podium names
  const finalM = gm("final", 0);
  const thirdM = gm("3rd", 0);
  const champ  = finalM?.winner_seed ? getSeed(finalM.winner_seed)?.team ?? "TBD" : "TBD";
  const runner = finalM?.winner_seed
    ? getSeed(finalM.winner_seed === finalM.seed1 ? finalM.seed2 : finalM.seed1)?.team ?? "TBD"
    : "TBD";
  const third  = thirdM?.winner_seed ? getSeed(thirdM.winner_seed)?.team ?? "TBD" : "TBD";

  // ── SVG connector overlay ──────────────────────────────────────────────────
  // We draw ONE absolute-positioned SVG over the whole bracket wrapper.
  // All coordinates are relative to wrapRef.

  function drawConnectors() {
    const wrap = wrapRef.current;
    const svg  = svgRef.current;
    if (!wrap || !svg) return;

    const wr = wrap.getBoundingClientRect();
    const _wrap = wrap;
    svg.setAttribute("width",  String(_wrap.scrollWidth));
    svg.setAttribute("height", String(_wrap.scrollHeight));
    svg.setAttribute("viewBox", `0 0 ${_wrap.scrollWidth} ${_wrap.scrollHeight}`);

    // Get the vertical midpoint of an element relative to the wrapper
    function my(el: Element): number {
      const r = el.getBoundingClientRect();
      return (r.top + r.bottom) / 2 - wr.top + _wrap.scrollTop;
    }
    // Get the right edge of an element relative to the wrapper
    function rx(el: Element): number {
      return el.getBoundingClientRect().right - wr.left + _wrap.scrollLeft;
    }
    // Get the left edge of an element relative to the wrapper
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
      pairMap:   [number, number][], // [fromIdx, toIdx] pairs
      stroke:    string,
      dash = ""
    ) {
      // Group fromCards by their toCard
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

        // All from-cards exit from their right edge
        // Route: right-edge → midX → vertical gather → toCard left
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

    // ── R1 → R32 (purple: each R1 match feeds its matching bye slot) ──────────
    // Bye slots are at R32 positions 0, 3, 4, 7, 8, 11, 12, 15
    // M1(R1[0])→R32[3], M2(R1[1])→R32[12], M3(R1[2])→R32[11], M4(R1[3])→R32[4]
    // M5(R1[4])→R32[7], M6(R1[5])→R32[8],  M7(R1[6])→R32[15], M8(R1[7])→R32[0]
    const r1Cards  = Array.from(_wrap.querySelectorAll("#col-r1  .mu-card"));
    const r32Cards = Array.from(_wrap.querySelectorAll("#col-r32 .mu-card"));
    connectPairs(r1Cards, r32Cards, [[0,3],[1,12],[2,11],[3,4],[4,7],[5,8],[6,15],[7,0]], "#a78bfa");

    // ── R32 → R16 (standard 2-to-1 within each quadrant) ────────────────────
    // Q1: R32[0,1,2,3] → R16[0,1]    Q2: R32[4,5,6,7] → R16[2,3]
    // Q3: R32[8,9,10,11]→ R16[4,5]   Q4: R32[12,13,14,15]→R16[6,7]
    const r16Cards = Array.from(_wrap.querySelectorAll("#col-r16 .mu-card"));
    const r32ToR16: [number,number][] = [
      [0,0],[1,0],[2,1],[3,1],
      [4,2],[5,2],[6,3],[7,3],
      [8,4],[9,4],[10,5],[11,5],
      [12,6],[13,6],[14,7],[15,7],
    ];
    connectPairs(r32Cards, r16Cards, r32ToR16, "#ddd6fe");

    // ── R16 → QF ─────────────────────────────────────────────────────────────
    const qfCards = Array.from(_wrap.querySelectorAll("#col-qf .mu-card"));
    const r16ToQF: [number,number][] = [
      [0,0],[1,0],[2,1],[3,1],[4,2],[5,2],[6,3],[7,3],
    ];
    connectPairs(r16Cards, qfCards, r16ToQF, "#ddd6fe");

    // ── QF → SF ───────────────────────────────────────────────────────────────
    const sfCards = Array.from(_wrap.querySelectorAll("#col-sf .mu-card"));
    const qfToSF: [number,number][] = [[0,0],[1,0],[2,1],[3,1]];
    connectPairs(qfCards, sfCards, qfToSF, "#ddd6fe");

    // ── SF → Final (winners) ──────────────────────────────────────────────────
    const finalEl = _wrap.querySelector("#card-final .mu-card");
    const thirdEl = _wrap.querySelector("#card-3rd .mu-card");
    if (finalEl && sfCards.length >= 2) {
      connectPairs(sfCards, [finalEl], [[0,0],[1,0]], "#ddd6fe");
    }

    // ── SF → 3rd place (losers, dashed) ──────────────────────────────────────
    if (thirdEl && sfCards.length >= 2) {
      connectPairs(sfCards, [thirdEl], [[0,0],[1,0]], "#9ca3af", "3,2");
    }

    // ── Final + 3rd → Podium (gold/bronze dashed) ────────────────────────────
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
  }, [bracket]);

  if (loading && bracket.length === 0) {
    return <div className="px-5 py-10 text-center text-purple-400 text-sm">Loading bracket…</div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pb-8 pt-3">
      {/* Legend */}
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

      {/* Bracket scroll wrapper — SVG overlay lives here */}
      <div className="overflow-x-auto px-5 pb-4">
        <div
          ref={wrapRef}
          style={{ position: "relative", width: "max-content" }}
        >
          {/* Connector SVG — absolute, covers full bracket */}
          <svg
            ref={svgRef}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
          />

          <div className="flex items-start gap-0">

            {/* ── ROUND 1 ── */}
            <RoundCol title="Round 1" gw={31} id="col-r1">
              {R1_MATCHUPS.map(([a, b], i) => {
                const m = gm("r1", i);
                const s1 = getSeed(a), s2 = getSeed(b);
                return (
                  <div key={i} className="mu-card">
                    <MatchupCard
                      matchup={m} isLive={live(m)}
                      matchNum={matchNums[`r1-${i}`]}
                    currentGw={currentGw}
                    />
                  </div>
                );
              })}
            </RoundCol>

            <div className="w-10 flex-shrink-0" />

            {/* ── ROUND OF 32 ── */}
            <RoundCol title="Round of 32" gw={32} id="col-r32">
              {R32_SLOTS.map((slot, i) => {
                const m = gm("r32", i);
                // seed2 is null = waiting for a R1 winner → show "Winner of M#"
                const r1MatchIdx = [0, 15, 8, 7].indexOf(i); // which R1 match feeds this slot
                const r1MatchNum = r1MatchIdx >= 0 ? matchNums[`r1-${r1MatchIdx}`] : null;
                const label2 = slot.r1Label && r1MatchNum
                  ? `Winner of M${r1MatchNum}`
                  : (!m?.seed2 ? wLabel("r32", i) : undefined);
                return (
                  <div key={i} className="mu-card">
                    <MatchupCard
                      matchup={m} isLive={live(m)}
                      matchNum={matchNums[`r32-${i}`]}
                      label2={label2}
                    currentGw={currentGw}
                    />
                  </div>
                );
              })}
            </RoundCol>

            <div className="w-10 flex-shrink-0" />

            {/* ── ROUND OF 16 ── */}
            <RoundCol title="Round of 16" gw={33} id="col-r16">
              {Array.from({length:8}, (_, i) => {
                const m = gm("r16", i);
                // Each R16 slot is fed by 2 R32 matches
                const [r32a, r32b] = [i*2, i*2+1];
                return (
                  <div key={i} className="mu-card">
                    <MatchupCard
                      matchup={m} isLive={live(m)}
                      matchNum={matchNums[`r16-${i}`]}
                      label1={!m?.seed1 ? wLabel("r32", r32a) : undefined}
                      label2={!m?.seed2 ? wLabel("r32", r32b) : undefined}
                    currentGw={currentGw}
                    />
                  </div>
                );
              })}
            </RoundCol>

            <div className="w-10 flex-shrink-0" />

            {/* ── QUARTERFINALS ── */}
            <RoundCol title="Quarterfinals" gw={34} id="col-qf">
              {Array.from({length:4}, (_, i) => {
                const m = gm("qf", i);
                const [r16a, r16b] = [i*2, i*2+1];
                return (
                  <div key={i} className="mu-card">
                    <MatchupCard
                      matchup={m} isLive={live(m)}
                      matchNum={matchNums[`qf-${i}`]}
                      label1={!m?.seed1 ? wLabel("r16", r16a) : undefined}
                      label2={!m?.seed2 ? wLabel("r16", r16b) : undefined}
                    currentGw={currentGw}
                    />
                  </div>
                );
              })}
            </RoundCol>

            <div className="w-10 flex-shrink-0" />

            {/* ── SEMIFINALS ── */}
            <RoundCol title="Semifinals" gw={35} id="col-sf">
              {Array.from({length:2}, (_, i) => {
                const m = gm("sf", i);
                const [qfa, qfb] = [i*2, i*2+1];
                return (
                  <div key={i} className="mu-card">
                    <MatchupCard
                      matchup={m} isLive={live(m)}
                      matchNum={matchNums[`sf-${i}`]}
                      label1={!m?.seed1 ? wLabel("qf", qfa) : undefined}
                      label2={!m?.seed2 ? wLabel("qf", qfb) : undefined}
                    currentGw={currentGw}
                    />
                  </div>
                );
              })}
            </RoundCol>

            <div className="w-10 flex-shrink-0" />

            {/* ── FINALS WEEK ── */}
            <div className="flex flex-col flex-shrink-0 w-[182px]">
              <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200">
                Finals Week
                <span className="block text-[9.5px] font-normal text-purple-300 mt-0.5">GW 36</span>
              </div>
              <div className="pt-2.5">
                <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-600 text-center pb-1">🥇 Final</p>
                <div id="card-final">
                  {(() => {
                    const m = gm("final", 0);
                    return (
                      <MatchupCard
                        matchup={m} isLive={live(m)}
                        matchNum={matchNums["final-0"]}
                        extraCls="gold"
                        label1={!m?.seed1 ? wLabel("sf", 0) : undefined}
                        label2={!m?.seed2 ? wLabel("sf", 1) : undefined}
                      currentGw={currentGw}
                    />
                    );
                  })()}
                </div>
                <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 text-center pb-1 pt-3">🥉 3rd Place</p>
                <div id="card-3rd">
                  {(() => {
                    const m = gm("3rd", 0);
                    return (
                      <MatchupCard
                        matchup={m} isLive={live(m)}
                        matchNum={matchNums["3rd-0"]}
                        extraCls="bronze"
                        label1={!m?.seed1 ? lLabel("sf", 0) : undefined}
                        label2={!m?.seed2 ? lLabel("sf", 1) : undefined}
                      currentGw={currentGw}
                    />
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="w-10 flex-shrink-0" />

            {/* ── PODIUM ── */}
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

          </div>
        </div>
      </div>
    </div>
  );
}
