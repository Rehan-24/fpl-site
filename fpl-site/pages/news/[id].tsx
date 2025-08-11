import Head from "next/head";
import { useRouter } from "next/router";
import { useNewsDetail } from "@/public/hooks/useNews";
import NavBar from "@/components/NavBar";
import GWInfoBar from "@/components/GWInfoBar";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function NewsDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { data, loading, error } = useNewsDetail(id);

  return (
    <>
      <Head>
        <title>{data?.title ? `${data.title} | tFPL` : "News | tFPL"}</title>
        <meta property="og:title" content={data?.title ?? "tFPL News"} />
        <meta property="og:description" content={data?.excerpt ?? "League updates and announcements."} />
        <meta property="og:image" content={data?.image_url ?? "https://fantasy.premierleague.com/static/media/share.58c0c2b0.png"} />
        <meta property="og:url" content={`https://tfpl.vercel.app/news/${id ?? ""}`} />
        <meta property="og:type" content="article" />
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

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && <p className="text-[#37003c]/80 mt-4">Loading…</p>}
          {error && <p className="text-red-600 mt-4">Could not load article.</p>}

          {data && (
            <article className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#37003c]">{data.title}</h1>
              <time dateTime={data.date} className="block text-sm text-gray-600 mt-1">{formatDate(data.date)}</time>
              {data.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.tags.map(t => (
                    <span key={t} className="px-2 py-1 text-xs rounded bg-[#efe2fd] text-[#37003c] border border-gray-300">{t}</span>
                  ))}
                </div>
              )}
              {data.image_url && (
                <img src={data.image_url} alt="" className="mt-4 w-full max-h-[420px] object-cover rounded-lg border border-gray-300" />
              )}
              <div
                className="prose prose-sm sm:prose max-w-none mt-6 prose-headings:text-[#37003c] prose-p:text-[#37003c] prose-a:text-[#37003c] prose-strong:text-[#37003c]"
                dangerouslySetInnerHTML={{ __html: (data as any).content }}
              />
            </article>
          )}
        </section>
      </main>
    </>
  );
}
