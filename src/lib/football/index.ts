import "server-only";
import { cacheLife } from "next/cache";
import { apiFootball } from "./api-football";
import type { Match } from "./types";

export * from "./types";

const provider = apiFootball;

// Season start year (2026 = season 2026-27). Set FOOTBALL_SEASON when a new season begins.
// The free API plan only serves seasons 2022-2024, so use FOOTBALL_SEASON=2024 in development.
export const currentSeason = Number(process.env.FOOTBALL_SEASON ?? 2026);

export type Loaded<T> = { ok: true; data: T } | { ok: false; reason: "noKey" | "noData" };

// Runs inside a "use cache" scope. A thrown error would fail the whole build
// during prerendering, so failures are returned as values instead, with a
// short lifetime so they are retried soon.
async function attempt<T>(fetcher: () => Promise<T>, setLife: () => void): Promise<Loaded<T>> {
  try {
    const data = await fetcher();
    setLife();
    return { ok: true, data };
  } catch (err) {
    console.error(err);
    cacheLife("seconds");
    return { ok: false, reason: "noData" };
  }
}

// Until the sync worker and database exist, pages call the provider through
// these cached wrappers so visitor traffic does not consume the API quota.
async function cachedStandings(leagueId: number) {
  "use cache";
  return attempt(() => provider.standings(leagueId, currentSeason), () => cacheLife("hours"));
}

async function cachedSeasonFixtures(leagueId: number) {
  "use cache";
  return attempt(() => provider.seasonFixtures(leagueId, currentSeason), () => cacheLife("minutes"));
}

// The key is checked outside the cached scope so that adding it takes effect
// without waiting for a cached failure to expire.
const hasKey = () => Boolean(process.env.API_FOOTBALL_KEY);
const noKey = { ok: false, reason: "noKey" } as const;

const byKickoff = (a: Match, b: Match) => a.kickoff.localeCompare(b.kickoff);

export async function getStandings(leagueId: number) {
  return hasKey() ? cachedStandings(leagueId) : noKey;
}

export async function getNextFixtures(leagueId: number, count = 10): Promise<Loaded<Match[]>> {
  if (!hasKey()) return noKey;
  const result = await cachedSeasonFixtures(leagueId);
  if (!result.ok) return result;
  return { ok: true, data: result.data.filter((m) => m.status === "scheduled").sort(byKickoff).slice(0, count) };
}

export async function getLastResults(leagueId: number, count = 10): Promise<Loaded<Match[]>> {
  if (!hasKey()) return noKey;
  const result = await cachedSeasonFixtures(leagueId);
  if (!result.ok) return result;
  const finished = result.data.filter((m) => m.status === "finished").sort(byKickoff).reverse();
  return { ok: true, data: finished.slice(0, count) };
}
