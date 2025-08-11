import Head from "next/head";
import { useMemo, useState } from "react";
import NewsCard from "@/components/NewsCard";
import { useNewsList, type NewsItem } from "@/public/hooks/useNews";
import NavBar from "@/components/NavBar";
import GWInfoBar from "@/components/GWInfoBar";

export default function NewsPage() {
  const { data, loading: listLoading, error: listError, usingCache, refresh } = useNewsList();
  const [active, setActive] = useState<string>("all");

  const tags = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach(a => (a.tags ?? []).forEach(t => s.add(t)));
    return ["all", ...Array.from(s).sort((a,b)=>a.localeCompare(b))];
  }, [data]);

  const filtered: NewsItem[] = useMemo(() => {
    if (!data) return [];
    if (active === "all") return data;
    return data.filter(a => (a.tags ?? []).includes(active));
  }, [data, active]);

  return (
    <>
      <Head>
        <title>tFPL News & Announcements</title>
        <meta property="og:title" content="tFPL News & Announcements" />
        <meta property="og:description" content="League updates, new manager welcomes, rules tweaks, and Cup info." />
        <meta property="og:image" content="https://fantasy.premierleague.com/static/media/share.58c0c2b0.png" />
        <meta property="og:url" content="https://tfpl.vercel.app/news" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-blue-200 via-white to-purple-100 text-[#37003c]">
        <header className="relative bg-gradient-to-r from-blue-300 via-blue-400 bg-[#5b329e] text-[#37003c] p-6 shadow-lg overflow-hidden">
          <div className="navbar-ripple pointer-events-none select-none absolute inset-0"></div>
          <h1 className="text-center sm:text-left relative z-10 text-4xl font-bold text-[#37003c]">News</h1>
          <div className="navbar-buttons relative z-20">
            <NavBar />
          </div>
        </header>

        <GWInfoBar />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tag filter */}
          <div className="mt-2 flex flex-wrap gap-2" role="toolbar" aria-label="Filter news by tag">
            {tags.map(t => {
              const selected = active === t;
              return (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className={`px-3 py-1 rounded shadow border ${selected ? "bg-[#32FF6A] text-[#37003c] border-[#32FF6A]" : "bg-white text-[#37003c] border-gray-300 hover:bg-[#efe2fd]"}`}
                  aria-pressed={selected}
                >
                  {t === "all" ? "All" : t}
                </button>
              );
            })}
            <button
              onClick={refresh}
              className="ml-auto px-3 py-1 rounded shadow border bg-white text-[#37003c] border-gray-300 hover:bg-[#efe2fd]"
            >
              Refresh
            </button>
          </div>

          {/* List */}
          <div className="mt-4">
            {listLoading && <p className="text-[#37003c]/80">Loading…</p>}
            {listError && <p className="text-red-600">Error loading news.</p>}
            {!listLoading && filtered.length === 0 && (
              <p className="text-[#37003c]/80">
                No articles{active!=="all" ? ` for tag “${active}”` : ""}.
              </p>
            )}
            <div className="flex flex-col gap-4">
              {filtered.map(a => (<NewsCard key={a.id} a={a} />))}
            </div>
          </div>

          {usingCache && <p className="mt-4 text-xs text-gray-500">Loaded from cache.</p>}
        </section>
      </main>
    </>
  );
}
