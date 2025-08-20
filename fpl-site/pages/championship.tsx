import { useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import NavBar from "../components/NavBar";
import { useStandings } from "../public/hooks/useStandings";
import { useManagers } from "../public/hooks/useManagers";
import useGWDeadline from "@/public/hooks/useGWDeadline";

type Row = Record<string, any>;

interface Manager {
  name: string;
  team: string;
  fpl_team_url?: string;
}

const BACKEND_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com").replace(
    /\/$/,
    ""
  );
// Optional admin key — if present we’ll try the admin endpoint first.
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "";

export default function Championship() {
  
  const { gwInfo, loading, error } = useGWDeadline();
  const nearDeadline = !!gwInfo; // tighten polling near the deadline if you want
  const pollMs = nearDeadline ? 2 * 60 * 1000 : 10 * 60 * 1000;

  const {
    data,
    updatedAt,
    refresh: refreshStandings,
    loading: loadingStandings,
    usingCache,
  } = useStandings("championship", { pollMs });

  const { data: managersData, loading: loadingManagers, usingCache: usingCacheManagers } =
    useManagers();


  // Normalize data
  const rows: Row[] = useMemo(() => {
    const base = Array.isArray((data as any)?.rows) ? (data as any).rows
                : Array.isArray(data) ? data : [];
    // add Position if missing
    return base.map((r: any, i: number) =>
      r?.Position == null ? { Position: i + 1, ...r } : r
    );
  }, [data]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "Position",
    direction: "asc",
  });

  const positionLabels: Record<string, string> = {
    "1": "Champion $55",
    "2": "Promotion $45",
    "3": "Promotion $40",
    "4": "Promotion $30",
    "5": "Upper Mid $20",
    "6": "Upper Mid $20",
    "7": "Upper Mid $15",
    "8": "Battle of The Mid",
    "9": "Battle of The Mid",
    "10": "Battle of The Mid",
    "11": "Battle of The Mid",
    "12": "Battle of The Mid",
    "13": "Battle of The Mid",
    "14": "Battle of The Mid",
    "15": "Battle of The Mid",
    "16": "Battle of The Mid",
    "17": "Shame Battle",
    "18": "Shame Battle",
    "19": "Shame Battle",
    "20": "Shame",
  };

  // Fast map: team -> manager record
  //const managersByTeam = useMemo(() => {
  //  const m = new Map<string, Manager>();
  //  (managersData || []).forEach((mgr: Manager) => {
  //    if (mgr?.team) m.set(mgr.team, mgr);
  //  });
  //  return m;
  //}, [managersData]);

  // build the map
  const managersByTeam = useMemo(() => {
    const m = new Map<string, Manager>();
    (managersData || []).forEach((mgr: Manager) => {
      const key = String(mgr?.team || "").trim().toLowerCase();
      if (key) m.set(key, mgr);
    });
    return m;
  }, [managersData]);

  const normalizeNumber = (v: any) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/[^\d.\-]/g, "");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const handleSort = (key: string) => {
    if (key === "Team") return; // keep Team unsortable
    setSortConfig((prev) => {
      let direction: "asc" | "desc" = "asc";
      if (prev.key === key && prev.direction === "asc") direction = "desc";
      return { key, direction };
    });
  };

  const getSortIndicator = (key: string) => {
    if (key !== "Team") {
      if (sortConfig.key === key) return sortConfig.direction === "asc" ? "▲" : "▼";
      return "↕";
    }
    return "";
  };

  const numericKeys = new Set([
    "Position",
    "Points",
    "Wins",
    "Draws",
    "Losses",
    "Score",
    "Score Against",
    "Plus/Minus",
    "GW Points on Bench",
    "Season Points on Bench",
    "GW Transfers",
    "GW Transfer Hit",
    "Total Transfers Made",
    "Total Transfer Hit",
    "Highest Point Total Possible",
    "Current Team Value",
  ]);

  const sortedData = useMemo(() => {
    const arr = [...rows];
    const { key, direction } = sortConfig;
    const isNumeric = numericKeys.has(key);

    arr.sort((a, b) => {
      const aValue = a?.[key];
      const bValue = b?.[key];
      if (isNumeric) {
        const numA = normalizeNumber(aValue);
        const numB = normalizeNumber(bValue);
        return direction === "asc" ? numA - numB : numB - numA;
      }
      const strA = String(aValue ?? "").toLowerCase();
      const strB = String(bValue ?? "").toLowerCase();
      return direction === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return arr;
  }, [rows, sortConfig]);

  // Cell highlight rules (aligned to Premier)
  const getCellStyle = (key: string, val: any, row: Row) => {
    const num = normalizeNumber(val);

    // Chip usage
    if (
      key === "Chips Used" ||
      key === "Free Hit" ||
      key === "Wildcard 1" ||
      key === "Wildcard 2" ||
      key === "Triple Captain" ||
      key === "Bench Boost" ||
      key === "AssMan"
    ) {
      const s = String(val || "");
      if (s.includes("GW")) return "bg-red-200";
      if (s.includes("Expired")) return "bg-orange-200";
      if (s.includes("Available")) return "bg-green-200";
    }

    // Score / PlusMinus / Team Value => medals for top 3, red for bottom 3
    if (key === "Score" || key === "Plus/Minus" || key === "Current Team Value") {
      const values = rows.map((r: Row) => normalizeNumber(r[key])).filter((n) => !isNaN(n));
      if (values.length >= 1) {
        const desc = [...values].sort((a, b) => b - a);
        if (num === desc[0]) return "bg-yellow-200";
        if (desc[1] !== undefined && num === desc[1]) return "bg-gray-300";
        if (desc[2] !== undefined && num === desc[2]) return "bg-orange-200";
        const asc = [...values].sort((a, b) => a - b);
        if (num === asc[0] || num === asc[1] || num === asc[2]) return "bg-red-200";
      }
    }

    // Score Against => red for top 3 highest; medals for lowest 3
    if (key === "Score Against") {
      const values = rows.map((r: Row) => normalizeNumber(r[key])).filter((n) => !isNaN(n));
      if (values.length >= 1) {
        const desc = [...values].sort((a, b) => b - a);
        if (num === desc[0] || num === desc[1] || num === desc[2]) return "bg-red-200";
        const asc = [...values].sort((a, b) => a - b);
        if (num === asc[0]) return "bg-yellow-200";
        if (asc[1] !== undefined && num === asc[1]) return "bg-gray-300";
        if (asc[2] !== undefined && num === asc[2]) return "bg-orange-200";
      }
    }

    // Light purple for top 3 of these
    const lightPurpleTop3 = new Set([
      "GW Points on Bench",
      "Season Points on Bench",
      "GW Transfers",
      "Total Transfers Made",
    ]);
    if (lightPurpleTop3.has(key)) {
      const values = rows.map((r: Row) => normalizeNumber(r[key])).filter((n) => !isNaN(n));
      if (values.length >= 1) {
        const desc = [...values].sort((a, b) => b - a);
        if (num === desc[0] || num === desc[1] || num === desc[2]) return "bg-purple-200";
      }
    }

    // Red for top-3 transfer hits (if > 0)
    const redHit = new Set(["GW Transfer Hit", "Total Transfer Hit"]);
    if (redHit.has(key)) {
      const values = rows.map((r: Row) => normalizeNumber(r[key])).filter((n) => n > 0);
      if (values.length === 0) return "";
      const desc = [...values].sort((a, b) => b - a);
      if (num > 0 && (num === desc[0] || num === desc[1] || num === desc[2])) return "bg-red-200";
    }

    return "";
  };

    // --- Rebuild button: current GW, public-friendly ---
    const [rebuilding, setRebuilding] = useState(false);
    const handleGenerate = async () => {
      if (rebuilding) return;
      setRebuilding(true);
      try {
        // 1) Try admin endpoint (accepts gw=current and updates the exact sheet)
        if (ADMIN_KEY) {
          const adminUrl = `${BACKEND_BASE}/api/admin/rebuild?league=championship&gw=current`;
          const r = await fetch(adminUrl, {
            method: "POST",
            headers: { "X-Api-Key": ADMIN_KEY },
          });
          if (r.ok) {
            const j = await r.json();
            alert(`Update started for GW${j?.gw ?? "?"}`);
            await refreshStandings();
            return;
          }
          // fall through on 403/500
        }
  
        // 2) Public fallback (no key). This expects your backend to expose a public route
        // that resolves current GW internally, e.g. POST /api/rebuild?league=premier
        const publicUrl = `${BACKEND_BASE}/api/rebuild?league=championship`;
        const r2 = await fetch(publicUrl, { method: "POST" });
        const body = await r2.json().catch(() => ({}));
        if (!r2.ok) throw new Error(body?.detail || `HTTP ${r2.status}`);
        alert(body?.status ? "Update Triggered" : "Update Started");
        await refreshStandings();
  
      } catch (e: any) {
        alert(e?.message || "Request failed");
      } finally {
        setRebuilding(false);
      }
    };

  const first = rows[0] || {};
  const preferredOrder = [
    "Points", "Wins", "Draws", "Losses", "GP", "Games Left",
    "Score", "Score Against", "Plus/Minus",
    "GW Transfers", "GW Transfer Hit",
    "Total Transfers Made", "Total Transfer Hit",
    "GW Points on Bench", "Season Points on Bench",
    "Highest Point Total Possible", "Current Team Value",
    "Free Hit", "Wildcard 1", "Wildcard 2",
    "Triple Captain", "Bench Boost", "AssMan",
  ];

  const allKeys = Object.keys(first || {}).filter(
    (k) => !["Owner", "Title Reward", "Position", "Team"].includes(k)
  );

  // ordered keys: preferred first (if present), then any extras
  const displayKeys = [
    ...preferredOrder.filter(k => allKeys.includes(k)),
    ...allKeys.filter(k => !preferredOrder.includes(k)),
  ];

  return (
    <main className="bg-gradient-to-b from-blue-200 via-white to-purple-100 min-h-screen text-[#37003c]">
      <Head>
        <title>The Fantasy Championship League Table</title>
        <meta property="og:title" content="Championship League Table" />
        <meta property="og:description" content="Championship League Table" />
        <meta
          property="og:image"
          content="https://4.bp.blogspot.com/-ilHxPtWB8FA/VkS9BiuUpAI/AAAAAAAAxAM/QNQtiFimLyE/s1600/English-Football-League%2B%25281%2529.jpg"
        />
        <meta property="og:url" content="https://tfpl.vercel.app/championship" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>

      <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 to-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
        <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
        <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">
          Fantasy Championship League (v3)
        </h1>
        <div className="navbar-buttons relative z-20">
          <NavBar />
        </div>
      </header>

      {/* Gameweek bar */}
      {gwInfo && !loading && !error && (
        <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
          <p>
            GW{gwInfo.gwNumber} Deadline: {gwInfo.deadline} PST
          </p>
        </div>
      )}
      {loading && (
        <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
          <p>Loading Gameweek Info...</p>
        </div>
      )}
      {error && (
        <div className="bg-[#37003c] text-[#32FF6A] font-bold p-2 text-center">
          <p>{error}</p>
        </div>
      )}

      <section className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-3xl">Championship League Table</h2>
        </div>
        <button
            onClick={handleGenerate}
            disabled={rebuilding}
            className={` mb-4 px-4 py-2 rounded text-[#37003c] ${
              rebuilding ? "bg-gray-300 cursor-not-allowed" : "bg-[#32FF6A]"
            }`}
            title="Rebuild standings from the latest gameweek"
          >
            {rebuilding ? "Updating…" : "Generate/Update Table"}
        </button>
        {updatedAt && (
          <span className=" mb-4 px-4 py-2 text-xs text-gray-600">
            Last updated: {new Date(updatedAt).toLocaleString()}
          </span>
        )}
        {usingCache && (
          <span className="inline-block text-[11px] bg-yellow-200 text-[#37003c] px-2 py-0.5 rounded">
            Viewing cache
          </span>
        )}

        {rows.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">No standings available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bg-purple-100 border-separate border-spacing-x-[1px] rounded-md shadow-md text-sm w-full">
              <thead>
                <tr>
                  <th className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold">
                    <button onClick={() => handleSort("Position")}>
                      Position {getSortIndicator("Position")}
                    </button>
                  </th>
                  <th className="sticky-header-team bg-[#37003c] text-white px-3 py-2 text-xs font-semibold">
                    <button onClick={() => handleSort("Team")}>
                      Team {getSortIndicator("Team")}
                    </button>
                  </th>
                  {displayKeys.map((key) => (
                    <th key={key} className="bg-[#37003c] text-white px-3 py-2 text-xs font-semibold">
                      <button onClick={() => handleSort(key)}>
                        {key} {getSortIndicator(key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedData.map((row, i) => {
                    const teamKey = String(row.Team || "").trim().toLowerCase();
                    const mgr = managersByTeam.get(teamKey);
                  return (
                    <tr key={i}>
                      {/* Position (sticky) */}
                      <td
                        className={`px-3 py-2 border-b border-gray-400 text-center ${getCellStyle(
                          "Position",
                          row.Position,
                          row
                        )}`}
                      >
                        <div className="font-bold text-lg">{row.Position}</div>
                        <div className="italic text-xs text-purple-700">
                          {positionLabels[String(row.Position)]}
                        </div>
                      </td>

                      {/* Team (sticky) */}
                      <td
                        className={`sticky-team px-3 py-2 border-b border-gray-400 ${getCellStyle(
                          "Team",
                          row.Team,
                          row
                        )}`}
                      >
                        <div className="font-medium text-left">
                          {mgr?.fpl_team_url ? (
                            <a href={mgr.fpl_team_url} target="_blank" rel="noreferrer" className="hover:underline">
                              {row.Team}
                            </a>
                          ) : (
                            row.Team
                          )}
                        </div>
                        <div className="text-xs text-gray-600 text-left">
                          <Link href={`/managers/${encodeURIComponent(row.Owner)}`} className="hover:underline">
                            {row.Owner}
                          </Link>
                        </div>
                      </td>

                      {/* Other cells */}
                      {displayKeys.map((key) => (
                        <td
                          key={`${i}-${key}`}
                          className={`px-3 py-2 border-b border-gray-400 text-center ${getCellStyle(
                            key,
                            row[key],
                            row
                          )}`}
                        >
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
