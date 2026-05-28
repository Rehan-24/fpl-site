// pages/facup.tsx
import { useState } from "react";
import Head from "next/head";
import NavBar from "../components/NavBar";
import GWInfoBar from "../components/GWInfoBar";
import FACupBracket from "../components/FACupBracket";
import FACupSeedings from "../components/FACupSeedings";
import { ArchivePastFACupsButton } from "../components/FACupArchiveShared";

type Tab = "bracket" | "seedings" | "rules";

export default function FACup() {
  const [activeTab, setActiveTab] = useState<Tab>("bracket");

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
      <Head>
        <title>FA Cup - The Fantasy Premier League</title>
        <meta property="og:title" content="THE Fantasy FA Cup" />
        <meta property="og:description" content="FA Cup Bracket" />
        <meta
          property="og:image"
          content="https://static.vecteezy.com/system/resources/previews/025/409/495/large_2x/emirates-fa-cup-logo-with-name-white-symbol-abstract-design-illustration-with-red-background-free-vector.jpg"
        />
        <meta property="og:url" content="https://tfpl.vercel.app/facup" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>

      {/* Header — matches every other page exactly */}
      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold text-[#37003c]">Fantasy FA Cup (v2)</h1>
          <ArchivePastFACupsButton currentSeason="" />
        </div>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      {/* GW deadline bar */}
      <GWInfoBar />

      {/* Tiebreaker notice */}
      <div className="mx-5 mt-3 px-3 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-[12px] text-yellow-800">
        <span className="font-bold">⚡ Tiebreaker:</span> If scores are level at end of
        gameweek, the manager with more <span className="font-bold">goals scored</span> in
        their active squad advances.
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-purple-200 mt-3 px-5">
        {(["bracket", "seedings", "rules"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[13px] font-semibold px-4 py-2.5 border-b-[3px] transition-colors capitalize ${
              activeTab === tab
                ? "border-[#37003c] text-[#37003c]"
                : "border-transparent text-purple-600 hover:text-[#37003c]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "bracket"  && <FACupBracket />}
      {activeTab === "seedings" && <FACupSeedings />}
      {activeTab === "rules"    && <RulesPanel />}
    </main>
  );
}

function RulesPanel() {
  return (
    <div className="px-5 py-4 pb-10 max-w-2xl">
      <h2 className="text-[15px] font-bold text-[#37003c] mb-3 flex items-center gap-2">
        FA Cup Rules
        <span className="flex-1 h-px bg-purple-200 block" />
      </h2>
      <div className="text-[13px] leading-relaxed space-y-3 text-[#37003c]">
        <p>
          The Fantasy FA Cup is a single-elimination tournament featuring all{" "}
          <strong>40 managers</strong> across both the Premier and Championship leagues.
        </p>

        <div>
          <p className="font-bold mb-1">Format</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Seeds 33–40 compete in <strong>Round 1</strong> (GW31) — 4 matches, 8 players</li>
            <li>The 4 R1 winners face seeds <strong>1–4</strong> in the Round of 32 (GW32) — seeds 1–4 receive first-round byes</li>
            <li>Seeds 5–32 also enter in the Round of 32 — 14 seeded matchups (5v32, 6v31 … 18v19)</li>
            <li>Bracket proceeds: R16 → Quarterfinals → Semifinals</li>
            <li>
              <strong>Finals Week (GW36):</strong> SF winners play the <strong>Final</strong>;
              SF losers play the <strong>3rd Place match</strong> — both the same gameweek
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold mb-1">Scoring</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Each matchup is decided by FPL points scored in that gameweek</li>
            <li>Higher score advances to the next round</li>
          </ul>
        </div>

        <div>
          <p className="font-bold mb-1">Tiebreaker</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              If scores are level, the manager with more <strong>goals scored</strong> in
              their active squad advances
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold mb-1">Payouts</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>🥇 1st Place — Champion</li>
            <li>🥈 2nd Place — Runner-up (Final loser)</li>
            <li>🥉 3rd Place — 3rd Place match winner</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
