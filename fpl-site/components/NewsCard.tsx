import Link from "next/link";
import type { NewsItem } from "@/public/hooks/useNews";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function NewsCard({ a }: { a: NewsItem }) {
  return (
    <article
      className="rounded-lg border border-gray-300 bg-purple-100 backdrop-blur shadow-sm hover:shadow-md transition"
      aria-labelledby={`news-title-${a.id}`}
    >
      <Link
        href={`/news/${a.id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#32FF6A] rounded-lg"
      >
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          <div className="flex-shrink-0">
            <img src={a.image_url} alt="" className="w-full sm:w-56 h-40 sm:h-32 object-cover rounded-md" />
          </div>
          <div className="flex-1">
            <h2 id={`news-title-${a.id}`} className="text-xl font-bold text-[#37003c]">{a.title}</h2>
            <time dateTime={a.date} className="text-sm text-gray-600">{formatDate(a.date)}</time>
            <p className="mt-2 text-sm sm:text-base text-[#37003c]/90">{a.excerpt}</p>
            {a.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {a.tags.map(t => (
                  <span key={t} className="px-2 py-1 text-xs rounded bg-[#37003c] text-[#32FF6A] border border-gray-300">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
