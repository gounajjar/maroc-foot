import "server-only";
import { cacheLife } from "next/cache";
import { apiFootball } from "./api-football";

export * from "./types";

const provider = apiFootball;

// Season start year (2026 = season 2026-27). Set FOOTBALL_SEASON when a new season begins.
export const currentSeason = Number(process.env.FOOTBALL_SEASON ?? 2026);

// Until the sync worker and database exist, pages call the provider through
// these cached wrappers so visitor traffic does not consume the API quota.
export async function getStandings(leagueId: number) {
  "use cache";
  cacheLife("hours");
  return provider.standings(leagueId, currentSeason);
}

export async function getNextFixtures(leagueId: number) {
  "use cache";
  cacheLife("hours");
  return provider.nextFixtures(leagueId, currentSeason, 10);
}

export async function getLastResults(leagueId: number) {
  "use cache";
  cacheLife("minutes");
  return provider.lastResults(leagueId, currentSeason, 10);
}

export type Loaded<T> = { ok: true; data: T } | { ok: false; reason: "noKey" | "noData" };

// The key is checked here, outside the cached scope: errors thrown inside a
// "use cache" function lose their class when they cross the cache boundary.
export async function load<T>(fetcher: () => Promise<T>): Promise<Loaded<T>> {
  if (!process.env.API_FOOTBALL_KEY) return { ok: false, reason: "noKey" };
  try {
    return { ok: true, data: await fetcher() };
  } catch (err) {
    console.error(err);
    return { ok: false, reason: "noData" };
  }
}
