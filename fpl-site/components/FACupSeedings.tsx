// components/FACupSeedings.tsx
// Seedings table for the FA Cup seedings tab

import { SEEDS } from "@/lib/facupSeedings";

export default function FACupSeedings() {
  return (
    <div className="px-5 py-4 pb-10">
      <h2 className="text-[15px] font-bold text-[#37003c] mb-3 flex items-center gap-2">
        2025/26 FA Cup — Full Seedings
        <span className="flex-1 h-px bg-purple-200 block" />
      </h2>
      <div className="overflow-x-auto rounded-md shadow-sm">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {["#", "Team", "Manager", "League", "Reason", "Score"].map((h, i) => (
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
            {SEEDS.map((p, i) => {
              const isR1 = p.seed >= 33;
              const bg = i % 2 === 0 ? "bg-white" : "bg-purple-50";
              return (
                <tr key={p.seed} className={`${bg} hover:bg-purple-100 transition-colors`}>
                  <td className="px-3 py-1.5 font-bold text-[#37003c]">{p.seed}</td>
                  <td className="px-3 py-1.5">
                    {p.fplUrl ? (
                      <a
                        href={p.fplUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#37003c] hover:underline hover:text-purple-700 transition-colors"
                      >
                        {p.team}
                      </a>
                    ) : (
                      <span className="font-semibold text-[#37003c]">{p.team}</span>
                    )}
                    {isR1 && (
                      <span className="ml-1.5 inline-block text-[9px] font-bold bg-yellow-100 text-amber-800 px-1.5 py-0.5 rounded">
                        R1
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-purple-700">{p.owner}</td>
                  <td className="px-3 py-1.5">
                    {p.league === "prem" ? (
                      <span className="inline-block text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded tracking-wide">
                        Premier
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded tracking-wide">
                        Champ
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-gray-400 text-[10px]">{p.reason}</td>
                  <td className="px-3 py-1.5 text-right font-bold font-mono text-[#37003c]">
                    {p.score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
