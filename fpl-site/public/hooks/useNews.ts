import { useCachedFetch } from './useCachedFetch';

export type NewsItem = {
  id: string;
  title: string;
  date: string;
  image_url: string;
  excerpt: string;
  tags: string[];
};

export type NewsDetail = NewsItem & {
  content: string; // HTML string
};

export function useNewsList() {
  const url = `https://tfpl.onrender.com/api/news`;
  const key = `news:list`;
  return useCachedFetch<NewsItem[]>(url, key, 4000);
}

export function useNewsDetail(id: string | null | undefined) {
  const enabled = Boolean(id);
  const url = enabled ? `https://tfpl.onrender.com/api/news/${encodeURIComponent(id!)}` : '';
  const key = enabled ? `news:detail:${id}` : 'noop';
  if (!enabled) {
    return { data: null as NewsDetail | null, usingCache: false, loading: false, error: null, refresh: () => {} };
  }
  return useCachedFetch<NewsDetail>(url, key, 4000);
}
