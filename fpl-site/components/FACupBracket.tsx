// components/FACupBracket.tsx — live data wired via useFACupBracket hook
// (full file — replaces the static mockup version)

import { useEffect, useRef } from "react";
import { SEEDS, R1_MATCHUPS, R32_MATCHUPS, BYE_SEEDS, Seed } from "@/lib/facupSeedings";
import { useFACupBracket, BracketMatchup } from "@/public/hooks/useFACupBracket";

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

function TbdDot() {
  return <span className="inline-block w-[5px] h-[5px] rounded-full bg-purple-200 flex-shrink-0 mt-px" />;
}

// ── PlayerRow ─────────────────────────────────────────────────────────────────

interface PlayerRowProps {
  seed:     Seed | null;
  score:    number | null;
  goals:    number | null;
  showGoals: boolean;
  isWinner: boolean;
  isLive:   boolean;
  isBye?:   boolean;
  label?:   string;
}

function PlayerRow({ seed, score, goals, showGoals, isWinner, isLive, isBye, label }: PlayerRowProps) {
  let bg = "";
  if (isBye)        bg = " bg-gray-50 opacity-60";
  else if (!seed)   bg = " bg-purple-50";
  else if (isWinner) bg = " bg-green-50";
  else if (isLive)  bg = " bg-purple-50";

  const nameEl = seed ? (
    seed.fplUrl ? (
      <a
        href={seed.fplUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${seed.team} on FPL`}
        className={`flex-1 truncate font-medium hover:underline hover:text-[#5b329e] ${isWinner ? "font-bold" : ""} text-[#37003c]`}
      >
        {seed.team}
      </a>
    ) : (
      <span className={`flex-1 truncate font-medium ${isWinner ? "font-bold" : ""} text-[#37003c]`}>
        {seed.team}
      </span>
    )
  ) : (
    <span className="flex-1 truncate italic text-purple-300">{label ?? "TBD"}</span>
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
      {seed ? <LeagueDot league={seed.league} /> : <TbdDot />}
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
      {isBye ? (
        <span className="text-[10px] text-gray-300 min-w-[20px] text-right">bye</span>
      ) : score !== null ? (
        <span className="text-[12px] font-bold min-w-[20px] text-right text-[#37003c]">{score}</span>
      ) : (
        <span className="text-[10px] text-purple-200 min-w-[20px] text-right">—</span>
      )}
    </div>
  );
}

// ── MatchupCard ───────────────────────────────────────────────────────────────

function MatchupCard({
  matchup, isLive, isByeCard, extraCls = "",
}: {
  matchup: BracketMatchup | null; isLive: boolean; isByeCard: boolean; extraCls?: string;
}) {
  const s1   = getSeed(matchup?.seed1);
  const s2   = getSeed(matchup?.seed2);
  const win1 = !!matchup?.winner_seed && matchup?.winner_seed === matchup?.seed1;
  const win2 = !!matchup?.winner_seed && matchup?.winner_seed === matchup?.seed2;
  const tied = matchup?.score1 != null && matchup?.score2 != null
    && matchup?.score1 === matchup?.score2;

  let border = "border-[#ddd6fe]";
  if (isLive)                          border = "border-[#32FF6A] shadow-[0_0_0_2px_rgba(50,255,106,0.2)]";
  else if (isByeCard)                  border = "border-purple-300";
  else if (extraCls.includes("gold"))  border = "border-yellow-400 shadow-[0_0_0_2px_rgba(234,179,8,0.15)]";
  else if (extraCls.includes("bronze"))border = "border-gray-400 shadow-[0_0_0_2px_rgba(156,163,175,0.15)]";

  return (
    <div className={`w-[172px] bg-white border-[1.5px] ${border} rounded-md overflow-hidden flex-shrink-0 mb-2 hover:border-purple-400 transition-colors`}>
      <PlayerRow
        seed={s1} score={matchup?.score1 ?? null} goals={matchup?.goals1 ?? null}
        showGoals={!!tied} isWinner={win1} isLive={isLive} isBye={isByeCard && !!s1}
      />
      <div className="border-t border-purple-100" />
      <PlayerRow
        seed={s2} score={matchup?.score2 ?? null} goals={matchup?.goals2 ?? null}
        showGoals={!!tied} isWinner={win2} isLive={isLive && !isByeCard}
        label={isByeCard ? "R1 Winner" : undefined}
      />
    </div>
  );
}

// ── Round / Connector columns ─────────────────────────────────────────────────

function RoundCol({ title, gw, id, children }: { title: string; gw: number; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-shrink-0 w-[178px]" id={id}>
      <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200 whitespace-nowrap">
        {title}
        <span className="block text-[9.5px] font-normal text-purple-300 mt-0.5">GW {gw}</span>
      </div>
      <div className="pt-2.5">{children}</div>
    </div>
  );
}

function ConnCol({ id }: { id: string }) {
  return <div id={id} className="flex-shrink-0 self-stretch mt-[37px]" style={{ width: 24, position: "relative" }} />;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FACupBracket() {
  const { bracket, currentGw, loading, error, lastUpdated, refresh } = useFACupBracket();

  const idx: Record<string, BracketMatchup> = {};
  bracket.forEach(m => { idx[`${m.round}-${m.matchup_idx}`] = m; });
  const gm = (round: string, i: number) => idx[`${round}-${i}`] ?? null;
  const live = (m: BracketMatchup | null) =>
    !!m && !!currentGw && m.gw === currentGw && !m.winner_seed && !!m.seed1;

  // Podium names
  const finalM  = gm("final", 0);
  const thirdM  = gm("3rd", 0);
  const champ    = finalM?.winner_seed ? getSeed(finalM.winner_seed)?.team  ?? "TBD" : "TBD";
  const runner   = finalM?.winner_seed
    ? getSeed(finalM.winner_seed === finalM.seed1 ? finalM.seed2 : finalM.seed1)?.team ?? "TBD"
    : "TBD";
  const third    = thirdM?.winner_seed ? getSeed(thirdM.winner_seed)?.team  ?? "TBD" : "TBD";

  // SVG connectors
  useEffect(() => {
    const t = setTimeout(draw, 300);
    window.addEventListener("resize", draw);
    return () => { clearTimeout(t); window.removeEventListener("resize", draw); };
  }, [bracket]);

  function mid(el: Element, ref: Element) {
    const r = el.getBoundingClientRect(), c = ref.getBoundingClientRect();
    return (r.top + r.bottom) / 2 - c.top;
  }

  function line(x1: number, y1: number, x2: number, y2: number, stroke: string, dash = "") {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  }

  function svgWrap(h: number, content: string) {
    return `<svg width="24" height="${h}" viewBox="0 0 24 ${h}" style="position:absolute;top:0;left:0;overflow:visible">${content}</svg>`;
  }

  function setConn(id: string, content: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.position = "relative";
    el.innerHTML = content;
  }

  function draw() {
    // R1 → R32 (1-to-1, purple)
    (() => {
      const from = document.getElementById("col-r1");
      const to   = document.getElementById("col-r32");
      const conn = document.getElementById("cn-r1-r32");
      if (!from || !to || !conn) return;
      const fCards = Array.from(from.querySelectorAll(".mu-card"));
      const tCards = Array.from(to.querySelectorAll(".mu-card"));
      const h = conn.offsetHeight || 1200;
      let c = "";
      for (let i = 0; i < Math.min(fCards.length, 4); i++) {
        const fy = mid(fCards[i], conn), ty = mid(tCards[i], conn);
        c += line(0, fy, 12, fy, "#a78bfa") + line(12, fy, 12, ty, "#a78bfa") + line(12, ty, 24, ty, "#a78bfa");
      }
      setConn("cn-r1-r32", svgWrap(h, c));
    })();

    // Standard 2-to-1 rounds
    [["col-r32","col-r16","cn-r32-r16"],["col-r16","col-qf","cn-r16-qf"],["col-qf","col-sf","cn-qf-sf"]].forEach(([fId,tId,cId]) => {
      const from = document.getElementById(fId), to = document.getElementById(tId), conn = document.getElementById(cId);
      if (!from || !to || !conn) return;
      const fC = Array.from(from.querySelectorAll(".mu-card")), tC = Array.from(to.querySelectorAll(".mu-card"));
      const h = conn.offsetHeight || 1200;
      let c = "";
      for (let i = 0; i < tC.length; i++) {
        const fc1 = fC[i*2], fc2 = fC[i*2+1], tc = tC[i];
        if (!fc1 || !tc) continue;
        const y1 = mid(fc1, conn), y2 = fc2 ? mid(fc2, conn) : y1, yt = mid(tc, conn), ym = (y1+y2)/2;
        c += line(0,y1,12,y1,"#ddd6fe") + line(12,y1,12,ym,"#ddd6fe");
        if (fc2) c += line(0,y2,12,y2,"#ddd6fe") + line(12,y2,12,ym,"#ddd6fe");
        c += line(12,ym,24,yt,"#ddd6fe");
      }
      setConn(cId, svgWrap(h, c));
    });

    // SF → Final (winners solid, losers dashed to 3rd)
    (() => {
      const sfCol = document.getElementById("col-sf"), conn = document.getElementById("cn-sf-final");
      const finalEl = document.getElementById("card-final"), thirdEl = document.getElementById("card-3rd");
      if (!sfCol || !conn || !finalEl || !thirdEl) return;
      const sfc = Array.from(sfCol.querySelectorAll(".mu-card"));
      const h = conn.offsetHeight || 800;
      if (sfc.length < 2) return;
      const y1=mid(sfc[0],conn), y2=mid(sfc[1],conn), yF=mid(finalEl,conn), ym=(y1+y2)/2, y3=mid(thirdEl,conn);
      const c =
        line(0,y1,12,y1,"#ddd6fe")+line(12,y1,12,ym,"#ddd6fe")+
        line(0,y2,12,y2,"#ddd6fe")+line(12,y2,12,ym,"#ddd6fe")+
        line(12,ym,24,yF,"#ddd6fe")+
        line(0,y1,8,y1,"#9ca3af","3,2")+line(0,y2,8,y2,"#9ca3af","3,2")+
        line(8,y1,8,y3,"#9ca3af","3,2")+line(8,y3,24,y3,"#9ca3af","3,2");
      setConn("cn-sf-final", svgWrap(h, c));
    })();

    // Final → Podium
    (() => {
      const conn=document.getElementById("cn-final-podium");
      const fEl=document.getElementById("card-final"), t3El=document.getElementById("card-3rd");
      const p1=document.getElementById("podium-1"), p2=document.getElementById("podium-2"), p3=document.getElementById("podium-3");
      if (!conn||!fEl||!p1||!p2||!p3) return;
      const h=conn.offsetHeight||600;
      const yF=mid(fEl,conn), yP1=mid(p1,conn), yP2=mid(p2,conn), yP3=mid(p3,conn);
      const y3=t3El?mid(t3El,conn):0;
      const c =
        line(0,yF,12,yF,"#eab308","4,3")+
        line(12,yP1,12,yP2,"#eab308","4,3")+
        line(12,yP1,24,yP1,"#eab308","4,3")+
        line(12,yP2,24,yP2,"#eab308","4,3")+
        (t3El ? line(0,y3,12,y3,"#d97706","3,2")+line(12,y3,12,yP3,"#d97706","3,2")+line(12,yP3,24,yP3,"#d97706","3,2") : "");
      setConn("cn-final-podium", svgWrap(h, c));
    })();
  }

  if (loading && bracket.length === 0) {
    return <div className="px-5 py-10 text-center text-purple-400 text-sm">Loading bracket…</div>;
  }

  return (
    <div className="pb-8 pt-3">
      {/* Legend row */}
      <div className="flex flex-wrap gap-3 px-5 mb-2 text-[11px] text-purple-600 items-center">
        {[["#32FF6A","Live"],["#22c55e","Winner"],["#5b329e","Premier"],["#3b82f6","Championship"]].map(([c,l])=>(
          <span key={l} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{background:c}}/>
            {l}
          </span>
        ))}
        <span className="text-purple-300">⚽ goals shown when tied</span>
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
        <div className="flex items-start gap-0 w-max">

          <RoundCol title="Round 1" gw={31} id="col-r1">
            {R1_MATCHUPS.map(([,], i) => {
              const m = gm("r1", i);
              return <div key={i} className="mu-card"><MatchupCard matchup={m} isLive={live(m)} isByeCard={false} /></div>;
            })}
          </RoundCol>
          <ConnCol id="cn-r1-r32" />

          <RoundCol title="Round of 32" gw={32} id="col-r32">
            {BYE_SEEDS.map((_, i) => {
              const m = gm("r32", i);
              return <div key={i} className="mu-card"><MatchupCard matchup={m} isLive={live(m)} isByeCard /></div>;
            })}
            {R32_MATCHUPS.map(([,], i) => {
              const m = gm("r32", i + 4);
              return <div key={i} className="mu-card"><MatchupCard matchup={m} isLive={live(m)} isByeCard={false} /></div>;
            })}
          </RoundCol>
          <ConnCol id="cn-r32-r16" />

          <RoundCol title="Round of 16" gw={33} id="col-r16">
            {Array.from({length:8},(_,i)=>{const m=gm("r16",i);return <div key={i} className="mu-card"><MatchupCard matchup={m} isLive={live(m)} isByeCard={false}/></div>;})}
          </RoundCol>
          <ConnCol id="cn-r16-qf" />

          <RoundCol title="Quarterfinals" gw={34} id="col-qf">
            {Array.from({length:4},(_,i)=>{const m=gm("qf",i);return <div key={i} className="mu-card"><MatchupCard matchup={m} isLive={live(m)} isByeCard={false}/></div>;})}
          </RoundCol>
          <ConnCol id="cn-qf-sf" />

          <RoundCol title="Semifinals" gw={35} id="col-sf">
            {Array.from({length:2},(_,i)=>{const m=gm("sf",i);return <div key={i} className="mu-card"><MatchupCard matchup={m} isLive={live(m)} isByeCard={false}/></div>;})}
          </RoundCol>
          <ConnCol id="cn-sf-final" />

          {/* Finals Week */}
          <div className="flex flex-col flex-shrink-0 w-[178px]">
            <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200">
              Finals Week<span className="block text-[9.5px] font-normal text-purple-300 mt-0.5">GW 36</span>
            </div>
            <div className="pt-2.5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-yellow-600 text-center pb-1">🥇 Final</p>
              <div id="card-final">{(()=>{const m=gm("final",0);return <MatchupCard matchup={m} isLive={live(m)} isByeCard={false} extraCls="gold"/>;})()}</div>
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 text-center pb-1 pt-3">🥉 3rd Place</p>
              <div id="card-3rd">{(()=>{const m=gm("3rd",0);return <MatchupCard matchup={m} isLive={live(m)} isByeCard={false} extraCls="bronze"/>;})()}</div>
            </div>
          </div>
          <ConnCol id="cn-final-podium" />

          {/* Podium */}
          <div className="flex flex-col flex-shrink-0 w-[130px]">
            <div className="text-[10.5px] font-bold tracking-wide uppercase text-purple-600 text-center pb-2.5 pt-1.5 border-b-2 border-purple-200">Podium</div>
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
  );
}
