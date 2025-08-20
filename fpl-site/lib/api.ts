// Website/fpl-site/lib/api.ts
const BASE = (process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com")
  .replace(/\/+$/, "");

export type TableRow = Record<string, any>;

export type SnapshotResponse = {
  league: string;
  gw: number | null;
  generated_at: string;
  source: string;
  schema_version: number;
  payload: { rows: TableRow[] };
};

// GET with basic error bubbling
async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    // Try to surface backend message if present
    let detail = `${r.status} ${r.statusText}`;
    try {
      const j = await r.json();
      detail = (j?.detail || j?.error || detail);
    } catch {}
    throw new Error(detail);
  }
  return r.json();
}

/** Try the DB snapshot first. If not found (404), throw so caller can fallback. */
export async function fetchLatestSnapshot(league: string, gw?: number) {
  const q = new URLSearchParams({ league, ...(gw ? { gw: String(gw) } : {}) });
  const url = `${BASE}/api/tables/latest?${q}`;
  return getJSON<SnapshotResponse>(url);
}

/** Your existing live standings endpoint. */
export async function fetchLiveStandings(league: string) {
  const url = `${BASE}/api/standings?league=${encodeURIComponent(league)}`;
  return getJSON<{ rows?: TableRow[]; data?: { rows?: TableRow[] } }>(url);
}
