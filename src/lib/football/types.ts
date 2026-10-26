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
  // `season` is the start year (2026 = 2026-27); undefined means the current one.
  standings(competitionId: string, season?: number): Promise<StandingRow[]>;
  seasonFixtures(competitionId: string, season?: number): Promise<Match[]>;
}

export type ProviderName = "apiFootball" | "footballData";

// Where a competition's data comes from: the provider and its own id for it.
export type Source = { provider: ProviderName; id: string };

export class MissingApiKeyError extends Error {}
