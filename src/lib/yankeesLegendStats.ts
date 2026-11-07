export type LegendStat = {
  season: string;
  team?: {
    id?: number;
    name?: string;
  };
  stat: Record<string, string | number>;
};

export type LegendStatGroup = "hitting" | "pitching";

type MLBStatsResponse = {
  stats?: {
    splits?: LegendStat[];
  }[];
};

export async function getYankeesLegendStats(
  playerId: number,
  group: LegendStatGroup
): Promise<LegendStat[]> {
  try {
    const url =
      `https://statsapi.mlb.com/api/v1/people/${playerId}/stats` +
      `?stats=yearByYear&group=${group}&leagueListId=mlb_hist`;

    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return [];
    }

    const data: MLBStatsResponse = await response.json();

    const splits = data.stats?.flatMap(
      (block) => block.splits ?? []
    ) ?? [];

    return splits
      .filter((split) => split.team?.id === 147)
      .sort(
        (a, b) => Number(a.season) - Number(b.season)
      );
  } catch {
    return [];
  }
}
