const TEAM_ID = 147;

export type HistoricalPlayerGroup = "hitting" | "pitching";

export type HistoricalPlayer = {
  id: number;
  name: string;
  gamesPlayed: number;
  stats: Record<string, string | number | null>;
};

type MLBPlayerSplit = {
  player?: {
    id?: number;
    fullName?: string;
  };
  team?: {
    id?: number;
  };
  stat?: Record<string, string | number | null>;
};

type MLBStatsResponse = {
  stats?: {
    splits?: MLBPlayerSplit[];
  }[];
};

export async function getYankeesHistoricalPlayers(
  season: number,
  group: HistoricalPlayerGroup
): Promise<HistoricalPlayer[]> {
  if (
    !Number.isInteger(season) ||
    season < 1903 ||
    season > 2026 ||
    (group !== "hitting" && group !== "pitching")
  ) {
    return [];
  }

  const params = new URLSearchParams({
    stats: "season",
    group,
    season: String(season),
    teamId: String(TEAM_ID),
    playerPool: "ALL",
    limit: "1000",
  });

  const url =
    "https://statsapi.mlb.com/api/v1/stats?" +
    params.toString();

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return [];

    const data: MLBStatsResponse = await response.json();

    const splits = data.stats
      ?.flatMap((block) => block.splits ?? []) ?? [];

    return splits
      .filter(
        (split) =>
          split.team?.id === TEAM_ID &&
          typeof split.player?.id === "number" &&
          Boolean(split.player.fullName) &&
          Boolean(split.stat)
      )
      .map((split) => ({
        id: split.player!.id!,
        name: split.player!.fullName!,
        gamesPlayed: Number(split.stat?.gamesPlayed ?? 0),
        stats: split.stat ?? {},
      }));
  } catch {
    return [];
  }
}
