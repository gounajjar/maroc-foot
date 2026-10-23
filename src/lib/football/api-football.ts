import "server-only";
import type { FootballProvider, Match, MatchStatus, StandingRow, Team } from "./types";
import { MissingApiKeyError } from "./types";

const BASE_URL = "https://v3.football.api-sports.io";

type ApiTeam = { id: number; name: string; logo: string };
type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
};
type ApiStanding = {
  rank: number;
  team: ApiTeam;
  points: number;
  goalsDiff: number;
  all: { played: number };
};

const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);
const SCHEDULED = new Set(["TBD", "NS"]);

function toStatus(short: string): MatchStatus {
  if (LIVE.has(short)) return "live";
  if (FINISHED.has(short)) return "finished";
  if (SCHEDULED.has(short)) return "scheduled";
  return "other";
}

const toTeam = (t: ApiTeam): Team => ({ id: t.id, name: t.name, logo: t.logo });

function toMatch(f: ApiFixture): Match {
  const status = toStatus(f.fixture.status.short);
  return {
    id: f.fixture.id,
    kickoff: f.fixture.date,
    status,
    minute: status === "live" ? f.fixture.status.elapsed : null,
    home: toTeam(f.teams.home),
    away: toTeam(f.teams.away),
    homeGoals: f.goals.home,
    awayGoals: f.goals.away,
  };
}

async function get<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new MissingApiKeyError();
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "x-apisports-key": key } });
  if (!res.ok) throw new Error(`API-Football ${path}: HTTP ${res.status}`);
  const body = (await res.json()) as { response: T[]; errors: unknown };
  const errors = body.errors;
  if (errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length)) {
    throw new Error(`API-Football ${path}: ${JSON.stringify(errors)}`);
  }
  return body.response;
}

export const apiFootball: FootballProvider = {
  async standings(league, season) {
    const res = await get<{ league: { standings: ApiStanding[][] } }>("/standings", { league, season });
    const table = res[0]?.league.standings[0] ?? [];
    return table.map((s): StandingRow => ({
      rank: s.rank,
      team: toTeam(s.team),
      played: s.all.played,
      goalDiff: s.goalsDiff,
      points: s.points,
    }));
  },
  // The free plan refuses the `next` and `last` params, so the whole season is
  // fetched and filtered by the caller. It is one request either way.
  async seasonFixtures(league, season) {
    return (await get<ApiFixture>("/fixtures", { league, season })).map(toMatch);
  },
  async liveMatches(leagueIds) {
    return (await get<ApiFixture>("/fixtures", { live: leagueIds.join("-") })).map(toMatch);
  },
};
