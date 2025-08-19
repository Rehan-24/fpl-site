import { useCachedFetch } from "./useCachedFetch";

export type NewsItem = {
  id: string;
  title: string;
  date?: string | null;
  image_url?: string | null;
  excerpt?: string | null;
  tags?: string[];
  author?: string | null;
};

export type NewsDetail = NewsItem & {
  content?: string | null;       // HTML (older path)
  content_html?: string | null;  // HTML (new DB path)
};

const BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_BASE ||
  "https://tfpl.onrender.com"
).replace(/\/$/, "");

export function useNewsList() {
  const url = `${BASE}/api/news`;
  const key = `news:list`;
  return useCachedFetch<NewsItem[]>(url, key, 4000);
}

export function useNewsDetail(id: string | null | undefined) {
  const enabled = Boolean(id);
  const url = enabled ? `${BASE}/api/news/${encodeURIComponent(id!)}` : "";
  const key = enabled ? `news:detail:${id}` : "noop";

  if (!enabled) {
    return {
      data: null as NewsDetail | null,
      usingCache: false,
      loading: false,
      error: null,
      // @ts-ignore
      refresh: () => {},
    };
  }
  return useCachedFetch<NewsDetail>(url, key, 4000);
}
