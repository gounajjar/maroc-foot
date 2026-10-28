import "server-only";
import type { FootballProvider, Match, MatchStatus, StandingRow, Team } from "./types";
import { MissingApiKeyError } from "./types";

// Live-score API (livescore-api.com). Source of the Botola Pro (competition id
// "38") and of the European and African club cups. Auth is a key and a secret
// passed as query parameters. Upcoming, finished and live matches come from
// three separate endpoints, merged here into one season-wide list.
const BASE_URL = "https://livescore-api.com/api-client";
// Cup histories include the qualifying rounds: about 300 matches (10 pages)
// for the Conference League.
const MAX_PAGES = 20;

type Id = number | string;
type LsTeam = { id: Id; name: string; logo?: string | null };
type LsTableRow = {
  rank: number;
  points: number;
  matches: number;
  won: number;
  drawn: number;
  lost: number;
  goals_scored: number;
  goals_conceded: number;
  goal_diff: number;
  team: LsTeam;
};
type LsTable = {
  season: { start: string; end: string };
  stages: { groups: { name: string; standings: LsTableRow[] }[] }[];
};
// Fields shared by fixtures, history and live entries. `time` is the kick-off
// ("18:00:00") in fixtures, but "FT" or the minute played in the other two.
type LsMatch = {
  id: Id;
  fixture_id?: Id;
  date?: string;
  added?: string;
  time?: string;
  scheduled?: string;
  round?: string;
  status?: string;
  home_id: Id;
  away_id: Id;
  home_name: string;
  away_name: string;
  ft_score?: string;
  score?: string;
  scores?: { score?: string; ft_score?: string };
};
type Paged = { next_page?: string | false | null };

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  // Trimmed because a value pasted into a dashboard can carry a stray space.
  const key = process.env.LIVESCORE_API_KEY?.trim();
  const secret = process.env.LIVESCORE_API_SECRET?.trim();
  if (!key || !secret) throw new MissingApiKeyError();
  const url = new URL(`${BASE_URL}/${path}`);
  for (const [name, value] of Object.entries({ ...params, key, secret })) url.searchParams.set(name, value);
  const res = await fetch(url);
  // The URL carries the credentials, so it is never included in errors.
  if (!res.ok) throw new Error(`live-score ${path}: HTTP ${res.status}`);
  const body = (await res.json()) as { success: boolean; data: T; error?: string };
  if (!body.success) throw new Error(`live-score ${path}: ${body.error ?? "request failed"}`);
  return body.data;
}

// Follows `next_page` until the list ends, capped to protect the quota.
async function getAllPages(path: string, params: Record<string, string>, field: "fixtures" | "match") {
  const all: LsMatch[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await get<Paged & Record<typeof field, LsMatch[]>>(path, { ...params, page: String(page) });
    all.push(...(data[field] ?? []));
    if (!data.next_page) break;
  }
  return all;
}

// Until a cup's new group stage starts, the API keeps returning the previous
// season's table. That table is dropped and the season is taken to start the
// day after it ended.
async function getTable(competitionId: string, season?: number) {
  const params: Record<string, string> = { competition_id: competitionId };
  if (season !== undefined) params.season = String(season);
  const data = await get<LsTable>("competitions/table.json", params);
  const groups = data.stages[0]?.groups ?? [];
  const current = season !== undefined || data.season.end >= new Date().toISOString().slice(0, 10);
  if (current) {
    const rows = groups.flatMap((g) => g.standings.map((row) => ({ row, group: groups.length > 1 ? g.name : undefined })));
    return { start: data.season.start, rows };
  }
  const start = new Date(Date.parse(data.season.end) + 86_400_000).toISOString().slice(0, 10);
  return { start, rows: [] };
}

// Scores arrive as text such as "2 - 1"; empty or "?" before kick-off.
function parseScore(score: string | undefined): [number | null, number | null] {
  const found = score?.match(/(\d+)\s*-\s*(\d+)/);
  return found ? [Number(found[1]), Number(found[2])] : [null, null];
}

// Dates and times are UTC, as "YYYY-MM-DD" and "HH:MM[:SS]".
function kickoff(m: LsMatch): string {
  const clock = [m.time, m.scheduled].find((t) => t && /^\d{2}:\d{2}/.test(t));
  return m.date ? `${m.date}T${(clock ?? "00:00").slice(0, 5)}:00Z` : "";
}

function liveStatus(status: string | undefined): MatchStatus {
  const s = (status ?? "").toUpperCase();
  if (s === "FINISHED") return "finished";
  if (s === "NOT STARTED") return "scheduled";
  if (["PLAY", "HALF", "ADDED", "EXTRA", "PENALT"].some((word) => s.includes(word))) return "live";
  return "other";
}

export const liveScore: FootballProvider = {
  async standings(competitionId, season) {
    const { rows } = await getTable(competitionId, season);
    return rows
      .map(({ row: r, group }): StandingRow => ({
        group,
        rank: r.rank,
        team: { id: Number(r.team.id), name: r.team.name, logo: r.team.logo ?? "" },
        played: r.matches,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goalsFor: r.goals_scored,
        goalsAgainst: r.goals_conceded,
        goalDiff: r.goal_diff,
        points: r.points,
      }))
      .sort((a, b) => (a.group ?? "").localeCompare(b.group ?? "") || a.rank - b.rank);
  },

  async seasonFixtures(competitionId, season) {
    const params = { competition_id: competitionId };
    // The table gives the season's start date and its teams with their logos,
    // which match entries do not carry. Its teams are also used below to drop
    // matches from other seasons or from cup qualifying rounds.
    const table = await getTable(competitionId, season);
    const logos = new Map(table.rows.map(({ row }) => [String(row.team.id), row.team.logo ?? ""]));
    const [upcoming, past, live] = await Promise.all([
      getAllPages("fixtures/matches.json", params, "fixtures"),
      getAllPages("scores/history.json", { ...params, from: table.start }, "match"),
      get<{ match: LsMatch[] }>("scores/live.json", params).then((d) => d.match ?? []),
    ]);

    const team = (id: Id, name: string): Team => ({ id: Number(id), name, logo: logos.get(String(id)) ?? "" });
    const toMatch = (m: LsMatch, id: Id, status: MatchStatus, minute: number | null = null): Match => {
      const [homeGoals, awayGoals] = parseScore(m.ft_score || m.scores?.ft_score || m.scores?.score || m.score);
      const scored = status !== "scheduled";
      return {
        id: Number(id),
        kickoff: kickoff(m),
        status,
        minute,
        home: team(m.home_id, m.home_name),
        away: team(m.away_id, m.away_name),
        homeGoals: scored ? homeGoals : null,
        awayGoals: scored ? awayGoals : null,
      };
    };

    // Upcoming matches are keyed by fixture id. The API lists some matches
    // twice, and keeps stale copies of rescheduled ones under other ids; one
    // entry per pairing and round is kept, the earliest.
    const byFixture = new Map<string, Match>();
    const seen = new Set<string>();
    for (const m of [...upcoming].sort((a, b) => kickoff(a).localeCompare(kickoff(b)))) {
      const pairing = `${m.home_id}-${m.away_id}-${m.round}`;
      if (seen.has(pairing)) continue;
      seen.add(pairing);
      byFixture.set(String(m.id), toMatch(m, m.id, "scheduled"));
    }

    // History since the season start also returns the previous season's last
    // matches, and for cups the qualifying rounds, so only matches between
    // teams of the table are kept. Without a table (a cup before its group
    // stage) every match since the season start is kept.
    const results = past
      .filter((m) => logos.size === 0 || (logos.has(String(m.home_id)) && logos.has(String(m.away_id))))
      .map((m) => toMatch(m, m.id, "finished"));

    // A live match replaces its upcoming entry. Its fixture id can point to a
    // duplicate dropped above, so the entry is found by its teams instead.
    // Live entries carry only the kick-off time, so the date comes from the
    // upcoming entry, or else from when the API added the live entry.
    for (const m of live) {
      const status = liveStatus(m.status);
      const minute = status === "live" ? Number.parseInt(m.time ?? "", 10) || null : null;
      const match = toMatch({ ...m, date: m.date ?? m.added?.slice(0, 10) }, m.id, status, minute);
      const known = [...byFixture].find(([, u]) => u.status === "scheduled" && u.home.id === match.home.id && u.away.id === match.away.id);
      if (known) byFixture.delete(known[0]);
      byFixture.set(`live-${m.id}`, { ...match, kickoff: known?.[1].kickoff || match.kickoff });
    }

    // A match just finished can be in both history and live; history wins.
    const resultIds = new Set(results.map((r) => r.id));
    return [...results, ...[...byFixture.values()].filter((m) => !resultIds.has(m.id))];
  },
};
