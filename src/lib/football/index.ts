import "server-only";
import { cacheLife } from "next/cache";
import { apiFootball } from "./api-football";
import { footballData } from "./football-data";
import { liveScore } from "./live-score";
import { stored } from "./store";
import type { FootballProvider, Match, ProviderName, Source } from "./types";

export * from "./types";

const providers: Record<ProviderName, { api: FootballProvider; keyVars: string[] }> = {
  apiFootball: { api: apiFootball, keyVars: ["API_FOOTBALL_KEY"] },
  footballData: { api: footballData, keyVars: ["FOOTBALL_DATA_KEY"] },
  liveScore: { api: liveScore, keyVars: ["LIVESCORE_API_KEY", "LIVESCORE_API_SECRET"] },
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

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// How long a stored answer stays fresh (see store.ts). Live-score charges each
// page of results against a small daily quota, so its copies are kept longer.
const standingsAge: Record<ProviderName, number> = { apiFootball: HOUR, footballData: 30 * MINUTE, liveScore: 2 * HOUR };
const fixturesAge: Record<ProviderName, { busy: number; quiet: number }> = {
  apiFootball: { busy: 5 * MINUTE, quiet: HOUR },
  footballData: { busy: 5 * MINUTE, quiet: 30 * MINUTE },
  liveScore: { busy: 10 * MINUTE, quiet: 3 * HOUR },
};

// A competition is busy while one of its matches is being played, or about to
// start, so that scores follow; otherwise fixtures rarely change.
function isBusy(matches: Match[]) {
  const now = Date.now();
  return matches.some((m) => {
    if (m.status === "live") return true;
    const kickoff = Date.parse(m.kickoff);
    return m.status !== "finished" && kickoff - 10 * MINUTE < now && now < kickoff + 3 * HOUR;
  });
}

// Pages call the provider through these cached wrappers so visitor traffic
// does not consume the API quota.
async function cachedStandings(provider: ProviderName, id: string) {
  "use cache";
  return attempt(
    () => stored(`${provider}:${id}:${season ?? ""}:standings`, () => standingsAge[provider], () => providers[provider].api.standings(id, season)),
    () => cacheLife("hours"),
  );
}

async function cachedSeasonFixtures(provider: ProviderName, id: string) {
  "use cache";
  return attempt(
    () =>
      stored(
        `${provider}:${id}:${season ?? ""}:fixtures`,
        (matches) => (isBusy(matches) ? fixturesAge[provider].busy : fixturesAge[provider].quiet),
        () => providers[provider].api.seasonFixtures(id, season),
      ),
    () => cacheLife("minutes"),
  );
}

// The key is checked outside the cached scope so that adding it takes effect
// without waiting for a cached failure to expire.
const hasKey = (source: Source) => providers[source.provider].keyVars.every((name) => process.env[name]?.trim());
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

// Matches on a given day ("YYYY-MM-DD" in `timeZone`), plus any still in
// progress, so a match that runs past midnight stays on the list.
export async function getMatchesOfDay(source: Source, day: string, timeZone: string): Promise<Loaded<Match[]>> {
  if (!hasKey(source)) return noKey;
  const result = await cachedSeasonFixtures(source.provider, source.id);
  if (!result.ok) return result;
  const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone });
  const matches = result.data.filter((m) => m.status === "live" || (m.kickoff && dayOf.format(new Date(m.kickoff)) === day));
  return { ok: true, data: matches.sort(byKickoff) };
}
