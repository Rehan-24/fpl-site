// pages/facup.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import NavBar from "../components/NavBar";
import GWInfoBar from "../components/GWInfoBar";
import FACupBracket from "../components/FACupBracket";
import FACupProjectedSeeding from "../components/FACupProjectedSeeding";
import { ArchivePastFACupsButton } from "../components/FACupArchiveShared";

type Tab = "bracket" | "seedings" | "rules";

const TAB_LABELS: Record<Tab, string> = {
  bracket: "Bracket",
  seedings: "Seedings",
  rules: "Rules",
};

const VALID_TABS: Tab[] = ["bracket", "seedings", "rules"];

export default function FACup() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("bracket");

  useEffect(() => {
    const q = router.query.tab;
    if (typeof q === "string" && (VALID_TABS as string[]).includes(q)) {
      setActiveTab(q as Tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.tab]);

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
          <h1 className="text-4xl font-bold text-[#37003c]">Fantasy FA Cup (v3)</h1>
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
      <div className="flex border-b-2 border-purple-200 mt-3 px-5 flex-wrap">
        {(["bracket", "seedings", "rules"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[13px] font-semibold px-4 py-2.5 border-b-[3px] transition-colors ${
              activeTab === tab
                ? "border-[#37003c] text-[#37003c]"
                : "border-transparent text-purple-600 hover:text-[#37003c]"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "bracket"  && <FACupBracket />}
      {activeTab === "seedings" && <FACupProjectedSeeding />}
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
          The Fantasy FA Cup is a single-elimination tournament featuring every
          manager across both the Premier and Championship leagues.
        </p>

        <p className="text-xs bg-purple-50 border-l-4 border-purple-300 px-2 py-1.5 text-purple-700">
          Seeding for this season isn't final yet — check the Seedings tab for a
          live projection based on current standings, updated as the season plays out.
        </p>

        <div>
          <p className="font-bold mb-1">Format</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>GW1–22</strong> are Qualifying Weeks — cumulative season score determines seeding</li>
            <li>Seeds <strong>1–3</strong> are locked to last season's trophy winners (FA Cup, Premier League, Championship); seed <strong>4</strong> onward is the highest remaining scorer, alternating leagues</li>
            <li>The top <strong>16</strong> seeds auto-qualify straight to the <strong>Round of 32</strong> — no game needed</li>
            <li>The bottom <strong>24</strong> seeds play a single-elimination <strong>Qualification Round</strong> (GW22), paired best-vs-worst within that group (seed 17 vs seed 40, seed 18 vs seed 39, and so on) for the remaining Round of 32 spots</li>
            <li>Round of 32 (GW23) is seeded to protect the top seeds — 1 and 2 can only meet in the Final; if a round ever has an odd number of teams remaining, the strongest surviving seed gets a bye to the next round</li>
            <li>Bracket proceeds: Round of 32 (GW23) → R16 (GW24) → Quarterfinals (GW25) → Semifinals (GW26)</li>
            <li>
              <strong>Finals Week (GW27):</strong> SF winners play the <strong>Final</strong>;
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
