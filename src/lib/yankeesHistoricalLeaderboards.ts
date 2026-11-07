import {
  getYankeesHistoricalPlayers,
  type HistoricalPlayer,
} from "./yankeesHistoricalLeaders";

export type HistoricalLeader = {
  id: number;
  name: string;
  value: string;
};

export type HistoricalLeaderCategory = {
  key: string;
  label: string;
  leaders: HistoricalLeader[];
};

export type HistoricalSeasonLeaderboards = {
  season: number;
  hitting: HistoricalLeaderCategory[];
  pitching: HistoricalLeaderCategory[];
};

function numericStat(
  player: HistoricalPlayer,
  key: string
): number | null {
  const raw = player.stats[key];

  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
}

function getLeaders(
  players: HistoricalPlayer[],
  key: string,
  options: {
    minimum?: (player: HistoricalPlayer) => boolean;
    lowerIsBetter?: boolean;
    decimals?: number;
  } = {}
): HistoricalLeader[] {
  const eligible = players
    .filter((player) => options.minimum?.(player) ?? true)
    .map((player) => ({
      player,
      value: numericStat(player, key),
    }))
    .filter(
      (entry): entry is {
        player: HistoricalPlayer;
        value: number;
      } => entry.value !== null
    );

  if (eligible.length === 0) return [];

  const sorted = eligible.sort((a, b) =>
    options.lowerIsBetter
      ? a.value - b.value
      : b.value - a.value
  );

  const bestValue = sorted[0].value;

  return sorted
    .filter((entry) => entry.value === bestValue)
    .sort((a, b) => a.player.name.localeCompare(b.player.name))
    .map(({ player, value }) => ({
      id: player.id,
      name: player.name,
      value:
        options.decimals !== undefined
          ? value.toFixed(options.decimals)
          : value.toLocaleString("en-US"),
    }));
}

export async function getYankeesHistoricalLeaderboards(
  season: number
): Promise<HistoricalSeasonLeaderboards> {
  const [hitters, pitchers] = await Promise.all([
    getYankeesHistoricalPlayers(season, "hitting"),
    getYankeesHistoricalPlayers(season, "pitching"),
  ]);

  const teamGames = Math.max(
    0,
    ...hitters.map((player) => player.gamesPlayed)
  );

  // Standard batting title qualification: 3.1 PA per team game.
  const minimumPA = Math.ceil(teamGames * 3.1);

  // ERA qualification: one inning pitched per team game.
  const minimumIP = teamGames;

  return {
    season,
    hitting: [
      {
        key: "homeRuns",
        label: "Home Runs",
        leaders: getLeaders(hitters, "homeRuns"),
      },
      {
        key: "hits",
        label: "Hits",
        leaders: getLeaders(hitters, "hits"),
      },
      {
        key: "rbi",
        label: "RBI",
        leaders: getLeaders(hitters, "rbi"),
      },
      {
        key: "avg",
        label: "Batting Average",
        leaders: getLeaders(hitters, "avg", {
          minimum: (player) =>
            (numericStat(player, "plateAppearances") ?? 0) >=
            minimumPA,
          decimals: 3,
        }),
      },
    ],
    pitching: [
      {
        key: "wins",
        label: "Wins",
        leaders: getLeaders(pitchers, "wins"),
      },
      {
        key: "strikeOuts",
        label: "Strikeouts",
        leaders: getLeaders(pitchers, "strikeOuts"),
      },
      {
        key: "era",
        label: "ERA",
        leaders: getLeaders(pitchers, "era", {
          minimum: (player) =>
            (numericStat(player, "inningsPitched") ?? 0) >=
            minimumIP,
          lowerIsBetter: true,
          decimals: 2,
        }),
      },
      {
        key: "saves",
        label: "Saves",
        leaders: getLeaders(pitchers, "saves"),
      },
    ],
  };
}
