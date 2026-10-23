// Provider-neutral shapes used by the pages. Each data provider maps its own
// responses to these, so swapping providers does not touch the UI.
export type Team = { id: number; name: string; logo: string };

export type StandingRow = {
  rank: number;
  team: Team;
  played: number;
  goalDiff: number;
  points: number;
};

export type MatchStatus = "scheduled" | "live" | "finished" | "other";

export type Match = {
  id: number;
  kickoff: string;
  status: MatchStatus;
  minute: number | null;
  home: Team;
  away: Team;
  homeGoals: number | null;
  awayGoals: number | null;
};

export interface FootballProvider {
  standings(leagueId: number, season: number): Promise<StandingRow[]>;
  nextFixtures(leagueId: number, season: number, count: number): Promise<Match[]>;
  lastResults(leagueId: number, season: number, count: number): Promise<Match[]>;
  liveMatches(leagueIds: number[]): Promise<Match[]>;
}

export class MissingApiKeyError extends Error {}
