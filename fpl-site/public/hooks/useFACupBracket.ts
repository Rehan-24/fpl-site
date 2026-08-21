// public/hooks/useFACupBracket.ts
// Fetches the FA Cup bracket state and live GW scores from the backend,
// merges them, and polls on the same schedule as useStandings.
//
// Returned data shape:
//   bracket: BracketMatchup[]  — full bracket from DB, scores filled in
//   scores:  GwScoreMap        — entry_id → { points, goals } for current GW
//   currentGw: number | null
//   loading, error, lastUpdated

import { useCallback, useEffect, useRef, useState } from "react";

const BACKEND = (
  process.env.NEXT_PUBLIC_BACKEND_BASE || "https://tfpl.onrender.com"
).replace(/\/$/, "");

// How often to re-fetch during an active gameweek (ms)
const POLL_MS_LIVE   = 3 * 60 * 1000;   // 3 min — same as standings near deadline
const POLL_MS_NORMAL = 10 * 60 * 1000;  // 10 min — outside gameweek

export interface BracketMatchup {
  round:                 string;
  matchup_idx:           number;
  gw:                    number;
  seed1:                 number | null;
  seed2:                 number | null;
  entry_id1:             number | null;
  entry_id2:             number | null;
  score1:                number | null;
  score2:                number | null;
  goals1:                number | null;
  goals2:                number | null;
  winner_seed:           number | null;
  winner_entry:          number | null;
  updated_at:            string | null;
  // Set on a Round-2 row when one side is still waiting on a Round 1
  // result -- the matchup_idx (within round "r1") of the match whose
  // winner fills that side. Whichever of seed1/seed2 is null is the
  // side this refers to.
  feeds_r1_matchup_idx?: number | null;
}

export interface GwScore {
  entry_id:     number;
  display_name: string;
  gw_points:    number | null;
  gw_goals:     number | null;
  fetched_at:   string | null;
}

export type GwScoreMap = Record<number, GwScore>; // keyed by entry_id

export interface FACupData {
  bracket:     BracketMatchup[];
  scores:      GwScoreMap;
  currentGw:   number | null;
  loading:     boolean;
  error:       string | null;
  lastUpdated: number | null;
  refresh:     () => void;
}

// ── Module-level cache so tab switches don't re-fetch ─────────────────────────
let _bracketCache: BracketMatchup[] | null = null;
let _scoresCache:  GwScoreMap | null = null;
let _cacheTs = 0;
const STALE_MS = 60_000;

// No hardcoded season default here on purpose -- omitting the query
// param lets the backend fall back to whichever season facup_db.SEASON
// currently points at, so this hook doesn't need updating every year.
export function useFACupBracket(season?: string): FACupData {
  const [bracket,     setBracket]     = useState<BracketMatchup[]>(_bracketCache ?? []);
  const [scores,      setScores]      = useState<GwScoreMap>(_scoresCache ?? {});
  const [currentGw,   setCurrentGw]   = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Determine active GW from bracket (the lowest GW with no winner yet) ──
  function deriveCurrentGw(b: BracketMatchup[]): number | null {
    const active = b
      .filter(m => m.winner_seed == null && m.seed1 != null)
      .map(m => m.gw);
    return active.length ? Math.min(...active) : null;
  }

  const fetchAll = useCallback(async () => {
    // Serve from cache if fresh
    const fresh = _bracketCache && Date.now() - _cacheTs < STALE_MS;
    if (fresh) {
      setBracket(_bracketCache!);
      setScores(_scoresCache ?? {});
      setCurrentGw(deriveCurrentGw(_bracketCache!));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch bracket
      const seasonQS = season ? `?season=${encodeURIComponent(season)}` : "";
      const bRes = await fetch(`${BACKEND}/api/facup/bracket${seasonQS}`);
      if (!bRes.ok) throw new Error(`Bracket fetch failed: ${bRes.status}`);
      const bData = await bRes.json();
      const newBracket: BracketMatchup[] = bData.bracket ?? [];

      // Derive active GW, then fetch scores for it
      const gw = deriveCurrentGw(newBracket);
      let newScores: GwScoreMap = {};

      if (gw) {
        const sRes = await fetch(`${BACKEND}/api/facup/scores?gw=${gw}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          const scoreRows: GwScore[] = sData.scores ?? [];

          // Build the score map and also fill scores into bracket matchups for this GW
          newScores = scoreRows.reduce<GwScoreMap>((acc, s) => {
            acc[s.entry_id] = s;
            return acc;
          }, {});

          // Merge live scores into bracket rows for the current GW
          // (The DB scores may lag by a few minutes; the /scores endpoint has fresher data)
          newBracket.forEach(m => {
            if (m.gw !== gw) return;
            if (m.entry_id1 && newScores[m.entry_id1]) {
              m.score1 = newScores[m.entry_id1].gw_points;
              m.goals1 = newScores[m.entry_id1].gw_goals;
            }
            if (m.entry_id2 && newScores[m.entry_id2]) {
              m.score2 = newScores[m.entry_id2].gw_points;
              m.goals2 = newScores[m.entry_id2].gw_goals;
            }
          });
        }
      }

      // Update module cache
      _bracketCache = newBracket;
      _scoresCache  = newScores;
      _cacheTs = Date.now();

      setBracket(newBracket);
      setScores(newScores);
      setCurrentGw(gw);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load FA Cup data");
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    fetchAll();

    // Adaptive polling — faster when a GW is actively in progress
    const pollMs = currentGw ? POLL_MS_LIVE : POLL_MS_NORMAL;
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, pollMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll]);

  return { bracket, scores, currentGw, loading, error, lastUpdated, refresh: fetchAll };
}
