export type MinorLeagueStatLine = {
  season: string;
  team: string | null;
  level: string;
  isCombined: boolean;
  stats: Record<string, string | number>;
};

type APISplit = {
  season?: string;
  team?: { name?: string };
  sport?: { id?: number; abbreviation?: string };
  stat?: Record<string, string | number>;
};

export async function getMinorLeagueStats(
  playerId: number,
  group: "hitting" | "pitching"
): Promise<MinorLeagueStatLine[]> {
  const url =
    `https://statsapi.mlb.com/api/v1/people/${playerId}/stats` +
    `?stats=yearByYear&group=${group}&leagueListId=milb_all`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return [];

    const data: { stats?: { splits?: APISplit[] }[] } =
      await response.json();

    const splits = data.stats?.[0]?.splits ?? [];

    return splits
      .filter((split) => split.season && split.stat)
      .map((split) => {
        const isCombined = split.sport?.id === 21;

        return {
          season: split.season!,
          team: split.team?.name ?? null,
          level: isCombined
            ? "All Minors"
            : split.sport?.abbreviation ?? "Unknown",
          isCombined,
          stats: split.stat!,
        };
      })
      .sort(
        (a, b) =>
          Number(a.season) - Number(b.season) ||
          Number(a.isCombined) - Number(b.isCombined)
      );
  } catch {
    return [];
  }
}

export async function getMinorLeagueCareerStats(
  playerId: number,
  group: "hitting" | "pitching"
): Promise<Record<string, string | number> | null> {
  const url =
    `https://statsapi.mlb.com/api/v1/people/${playerId}/stats` +
    `?stats=career&group=${group}&leagueListId=milb_all`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data: { stats?: { splits?: APISplit[] }[] } =
      await response.json();

    const splits = data.stats?.[0]?.splits ?? [];

    const careerTotal = splits.find(
      (split) => split.sport?.id === 21
    );

    return careerTotal?.stat ?? null;
  } catch {
    return null;
  }
}
