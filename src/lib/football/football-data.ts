import "server-only";
import type { FootballProvider, Match, MatchStatus, StandingRow, Team } from "./types";
import { MissingApiKeyError } from "./types";

// football-data.org v4. The free tier covers the top 5 European leagues for the
// current season, with delayed scores. Competition ids are codes such as "PL".
const BASE_URL = "https://api.football-data.org/v4";

type FdTeam = { id: number; name: string; shortName: string | null; crest: string | null };
type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  minute?: number | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
};
type FdTableRow = {
  position: number;
  team: FdTeam;
  playedGames: number;
  goalDifference: number;
  points: number;
};

const LIVE = new Set(["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT", "LIVE"]);
const FINISHED = new Set(["FINISHED", "AWARDED"]);
const SCHEDULED = new Set(["SCHEDULED", "TIMED"]);

function toStatus(status: string): MatchStatus {
  if (LIVE.has(status)) return "live";
  if (FINISHED.has(status)) return "finished";
  if (SCHEDULED.has(status)) return "scheduled";
  return "other";
}

const toTeam = (t: FdTeam): Team => ({ id: t.id, name: t.shortName ?? t.name, logo: t.crest ?? "" });

function toMatch(m: FdMatch): Match {
  const status = toStatus(m.status);
  return {
    id: m.id,
    kickoff: m.utcDate,
    status,
    minute: status === "live" ? (m.minute ?? null) : null,
    home: toTeam(m.homeTeam),
    away: toTeam(m.awayTeam),
    homeGoals: m.score.fullTime.home,
    awayGoals: m.score.fullTime.away,
  };
}

async function get<T>(path: string, season?: number): Promise<T> {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) throw new MissingApiKeyError();
  const url = new URL(BASE_URL + path);
  if (season !== undefined) url.searchParams.set("season", String(season));
  const res = await fetch(url, { headers: { "X-Auth-Token": key } });
  if (!res.ok) throw new Error(`football-data ${path}: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const footballData: FootballProvider = {
  async standings(code, season) {
    const body = await get<{ standings: { type: string; table: FdTableRow[] }[] }>(
      `/competitions/${code}/standings`,
      season,
    );
    const table = body.standings.find((s) => s.type === "TOTAL")?.table ?? [];
    return table.map((r): StandingRow => ({
      rank: r.position,
      team: toTeam(r.team),
      played: r.playedGames,
      goalDiff: r.goalDifference,
      points: r.points,
    }));
  },
  async seasonFixtures(code, season) {
    const body = await get<{ matches: FdMatch[] }>(`/competitions/${code}/matches`, season);
    return body.matches.map(toMatch);
  },
};
