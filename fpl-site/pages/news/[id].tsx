import Head from "next/head";
import { useRouter } from "next/router";
import { useNewsDetail } from "@/public/hooks/useNews";
import NavBar from "@/components/NavBar";
import GWInfoBar from "@/components/GWInfoBar";

function formatDate(s?: string | null) {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---- NEW: SSR (required for link preview bots) ----
export async function getServerSideProps(ctx: any) {
  const { id } = ctx.params || {};
  const SITE_BASE = (process.env.NEXT_PUBLIC_SITE_BASE || "https://tfpl.vercel.app").replace(/\/+$/, "");
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://tfpl.onrender.com").replace(/\/+$/, "");

  let initial: any = null;
  try {
    const res = await fetch(`${API_BASE}/api/news/${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
    if (res.ok) initial = await res.json();
  } catch { /* ignore */ }

  const canonicalUrl = `${SITE_BASE}/news/${encodeURIComponent(id || "")}`;
  return { props: { initial, canonicalUrl, siteBase: SITE_BASE } };
}

type NewsDetailProps = {
  initial: any | null;
  canonicalUrl: string;
  siteBase: string;
};

export default function NewsDetailPage({ initial, canonicalUrl, siteBase }: NewsDetailProps) {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const { data, loading, error } = useNewsDetail(id);
  const article = data || initial || null;

  // ensure absolute image URL for crawlers
  const defaultImg = "https://fantasy.premierleague.com/static/media/share.58c0c2b0.png";
  const imgRaw = article?.image_url || defaultImg;
  const ogImage = /^https?:\/\//i.test(imgRaw) ? imgRaw : `${siteBase.replace(/\/+$/,"")}${imgRaw.startsWith("/") ? "" : "/"}${imgRaw}`;

  const title = article?.title ? `${article.title} | tFPL` : "News | tFPL";
  const ogTitle = article?.title || "tFPL News";
  const ogDesc = article?.excerpt || "League updates and announcements.";
  const ogDate = article?.date || null;
  const tags: string[] = (article?.tags ?? []) as string[];

  return (
    <>
      <Head>
        {/* Basic */}
        <title>{title}</title>
        <meta name="description" content={ogDesc} />

        {/* Open Graph (used by iMessage) */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="THE Fantasy Premier League" />
        {/* Helpful (optional) OG extras */}
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogTitle} />
        {ogDate && <meta property="article:published_time" content={new Date(ogDate).toISOString()} />}
        {tags.slice(0, 4).map((t) => (
          <meta key={t} property="article:tag" content={t} />
        ))}

        {/* Twitter Card (good cross-platform fallback) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDesc} />
        <meta name="twitter:image" content={ogImage} />

        {/* Canonical */}
        <link rel="canonical" href={canonicalUrl} />
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
          {loading && !article && <p className="text-[#37003c]/80 mt-4">Loading…</p>}
          {error && !article && <p className="text-red-600 mt-4">Could not load article.</p>}

          {article && (
            <article className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#37003c]">{article.title}</h1>
              {!!formatDate(article?.date) && (
                <time dateTime={article!.date!} className="block text-sm text-gray-600 mt-1">
                  {formatDate(article!.date!)}
                </time>
              )}
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 text-xs rounded bg-[#efe2fd] text-[#37003c] border border-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {article.image_url && (
                <img
                  src={ogImage}
                  alt=""
                  className="mt-4 w-full max-h-[420px] object-cover rounded-lg border border-gray-300"
                />
              )}
              <div
                className="prose prose-sm sm:prose max-w-none mt-6 prose-headings:text-[#37003c] prose-p:text-[#37003c] prose-a:text-[#37003c] prose-strong:text-[#37003c]"
                dangerouslySetInnerHTML={{ __html: article?.content ?? (article as any)?.content_html ?? "" }}
              />
            </article>
          )}
        </section>
      </main>
    </>
  );
}