import "server-only";
import { cacheLife } from "next/cache";
import { apiFootball } from "./api-football";
import { footballData } from "./football-data";
import { liveScore } from "./live-score";
import type { FootballProvider, Match, ProviderName, Source } from "./types";

export * from "./types";

const providers: Record<ProviderName, { api: FootballProvider; keyVar: string }> = {
  apiFootball: { api: apiFootball, keyVar: "API_FOOTBALL_KEY" },
  footballData: { api: footballData, keyVar: "FOOTBALL_DATA_KEY" },
  liveScore: { api: liveScore, keyVar: "LIVESCORE_API_KEY" },
};

// Season start year (2026 = season 2026-27). Leave FOOTBALL_SEASON unset to
// follow each provider's current season; set it only to view another season.
const season = process.env.FOOTBALL_SEASON ? Number(process.env.FOOTBALL_SEASON) : undefined;

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
async function cachedStandings(provider: ProviderName, id: string) {
  "use cache";
  return attempt(() => providers[provider].api.standings(id, season), () => cacheLife("hours"));
}

async function cachedSeasonFixtures(provider: ProviderName, id: string) {
  "use cache";
  return attempt(() => providers[provider].api.seasonFixtures(id, season), () => cacheLife("minutes"));
}

// The key is checked outside the cached scope so that adding it takes effect
// without waiting for a cached failure to expire.
const hasKey = (source: Source) => Boolean(process.env[providers[source.provider].keyVar]);
const noKey = { ok: false, reason: "noKey" } as const;

const byKickoff = (a: Match, b: Match) => a.kickoff.localeCompare(b.kickoff);

export async function getStandings(source: Source) {
  return hasKey(source) ? cachedStandings(source.provider, source.id) : noKey;
}

export async function getNextFixtures(source: Source, count = 10): Promise<Loaded<Match[]>> {
  if (!hasKey(source)) return noKey;
  const result = await cachedSeasonFixtures(source.provider, source.id);
  if (!result.ok) return result;
  return { ok: true, data: result.data.filter((m) => m.status === "scheduled").sort(byKickoff).slice(0, count) };
}

export async function getLastResults(source: Source, count = 10): Promise<Loaded<Match[]>> {
  if (!hasKey(source)) return noKey;
  const result = await cachedSeasonFixtures(source.provider, source.id);
  if (!result.ok) return result;
  const finished = result.data.filter((m) => m.status === "finished").sort(byKickoff).reverse();
  return { ok: true, data: finished.slice(0, count) };
}
