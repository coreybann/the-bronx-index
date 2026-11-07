const TEAM_ID = 147;

export type HistoricalStatGroup = "hitting" | "pitching";

export type HistoricalTeamStats = {
  season: number;
  group: HistoricalStatGroup;
  stats: Record<string, string | number | null>;
};

type MLBTeamStatsResponse = {
  stats?: {
    splits?: {
      stat?: Record<string, string | number | null>;
    }[];
  }[];
};

const FIELDS = {
  hitting: [
    "gamesPlayed",
    "runs",
    "hits",
    "homeRuns",
    "avg",
    "obp",
    "slg",
    "ops",
    "baseOnBalls",
    "strikeOuts",
    "stolenBases",
  ],
  pitching: [
    "wins",
    "losses",
    "era",
    "whip",
    "strikeOuts",
    "baseOnBalls",
    "homeRuns",
    "saves",
    "inningsPitched",
  ],
} as const;

export async function getYankeesHistoricalTeamStats(
  season: number,
  group: HistoricalStatGroup
): Promise<HistoricalTeamStats | null> {
  if (
    !Number.isInteger(season) ||
    season < 1903 ||
    season > 2026 ||
    (group !== "hitting" && group !== "pitching")
  ) {
    return null;
  }

  const params = new URLSearchParams({
    stats: "season",
    group,
    season: String(season),
  });

  const url =
    `https://statsapi.mlb.com/api/v1/teams/${TEAM_ID}/stats?` +
    params.toString();

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data: MLBTeamStatsResponse = await response.json();

    const rawStats = data.stats
      ?.flatMap((block) => block.splits ?? [])
      .find((split) => split.stat)?.stat;

    if (!rawStats) return null;

    const stats: Record<string, string | number | null> = {};

    for (const field of FIELDS[group]) {
      const value = rawStats[field];

      stats[field] =
        value === undefined || value === null || value === ""
          ? null
          : value;
    }

    // An ERA of 0.00 with runs allowed is suspicious for a
    // historical full season. Avoid presenting it as valid.
    if (group === "pitching" && Number(stats.era) === 0) {
      stats.era = null;
    }

    return { season, group, stats };
  } catch {
    return null;
  }
}
