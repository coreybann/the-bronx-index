import { YANKEES_AFFILIATES } from "./yankeesProspects";

type MLBStanding = {
  team?: { id: number };
  wins?: number;
  losses?: number;
  winningPercentage?: string;
  divisionRank?: string;
  leagueRank?: string;
};

type MLBStandingsResponse = {
  records?: {
    teamRecords?: MLBStanding[];
  }[];
};

export type YankeesAffiliateStanding = {
  id: number;
  name: string;
  level: string;
  wins: number | null;
  losses: number | null;
  winningPercentage: string | null;
  divisionRank: string | null;
  leagueRank: string | null;
};

const LEAGUE_IDS: Record<number, number> = {
  531: 117,
  1956: 113,
  537: 116,
  587: 123,
  475: 124,
  635: 130,
  634: 130,
};

export async function getYankeesAffiliateStandings(
  season = 2026
): Promise<YankeesAffiliateStanding[]> {
  const leagues = [...new Set(Object.values(LEAGUE_IDS))];

  const responses = await Promise.all(
    leagues.map(async (leagueId) => {
      const url =
        "https://statsapi.mlb.com/api/v1/standings" +
        `?leagueId=${leagueId}` +
        `&season=${season}` +
        "&standingsTypes=regularSeason";

      try {
        const response = await fetch(url, {
          next: { revalidate: 86400 },
        });

        if (!response.ok) return [];

        const data: MLBStandingsResponse = await response.json();

        return (data.records ?? []).flatMap(
          (group) => group.teamRecords ?? []
        );
      } catch {
        return [];
      }
    })
  );

  const standings = responses.flat();

  return YANKEES_AFFILIATES.map((affiliate) => {
    const record = standings.find(
      (standing) => standing.team?.id === affiliate.id
    );

    return {
      id: affiliate.id,
      name: affiliate.name,
      level: affiliate.level,
      wins: record?.wins ?? null,
      losses: record?.losses ?? null,
      winningPercentage: record?.winningPercentage ?? null,
      divisionRank: record?.divisionRank ?? null,
      leagueRank: record?.leagueRank ?? null,
    };
  });
}
