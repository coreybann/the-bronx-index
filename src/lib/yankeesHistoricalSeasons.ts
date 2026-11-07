const YANKEES_TEAM_ID = 147;

export type YankeesHistoricalSeason = {
  season: number;
  wins: number | null;
  losses: number | null;
  winningPercentage: string | null;
  leagueRank: string | null;
  divisionRank: string | null;
};

type MLBStanding = {
  team?: { id?: number };
  wins?: number;
  losses?: number;
  winningPercentage?: string;
  leagueRank?: string;
  divisionRank?: string;
};

type MLBStandingsResponse = {
  records?: {
    teamRecords?: MLBStanding[];
  }[];
};

export async function getYankeesHistoricalSeason(
  season: number
): Promise<YankeesHistoricalSeason | null> {
  if (
    !Number.isInteger(season) ||
    season < 1903 ||
    season > 2026
  ) {
    return null;
  }

  const url =
    "https://statsapi.mlb.com/api/v1/standings" +
    `?leagueId=103&season=${season}` +
    "&standingsTypes=regularSeason";

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data: MLBStandingsResponse = await response.json();

    const standings =
      data.records?.flatMap(
        (record) => record.teamRecords ?? []
      ) ?? [];

    const yankees = standings.find(
      (record) => record.team?.id === YANKEES_TEAM_ID
    );

    if (!yankees) return null;

    return {
      season,
      wins: yankees.wins ?? null,
      losses: yankees.losses ?? null,
      winningPercentage: yankees.winningPercentage ?? null,
      leagueRank: yankees.leagueRank ?? null,
      divisionRank:
        season >= 1969
          ? yankees.divisionRank ?? null
          : null,
    };
  } catch {
    return null;
  }
}
