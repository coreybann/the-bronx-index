const TEAM_ID = 147;

type MLBGameTeam = {
  team?: {
    id?: number;
    name?: string;
  };
  score?: number;
};

type MLBGame = {
  gamePk?: number;
  gameDate?: string;
  gameType?: string;
  status?: {
    abstractGameState?: string;
    detailedState?: string;
    codedGameState?: string;
  };
  teams?: {
    away?: MLBGameTeam;
    home?: MLBGameTeam;
  };
};

type MLBScheduleResponse = {
  dates?: {
    games?: MLBGame[];
  }[];
};

export type HistoricalPostseasonSeries = {
  round: string;
  opponent: string;
  opponentId: number;
  wins: number;
  losses: number;
  result: "Won" | "Lost" | "Incomplete";
};

export type HistoricalPostseason = {
  season: number;
  appeared: boolean;
  worldSeriesChampion: boolean;
  series: HistoricalPostseasonSeries[];
};

const ROUNDS: Record<string, string> = {
  F: "Wild Card",
  D: "Division Series",
  L: "League Championship Series",
  W: "World Series",
};

const ROUND_ORDER = ["F", "D", "L", "W"];

export async function getYankeesHistoricalPostseason(
  season: number
): Promise<HistoricalPostseason | null> {
  if (
    !Number.isInteger(season) ||
    season < 1903 ||
    season > 2026
  ) {
    return null;
  }

  const params = new URLSearchParams({
    sportId: "1",
    season: String(season),
    gameTypes: "F,D,L,W",
    teamId: String(TEAM_ID),
  });

  const url =
    "https://statsapi.mlb.com/api/v1/schedule?" +
    params.toString();

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data: MLBScheduleResponse = await response.json();

    const games = data.dates
      ?.flatMap((date) => date.games ?? []) ?? [];

    const seriesMap = new Map<
      string,
      {
        round: string;
        roundCode: string;
        opponent: string;
        opponentId: number;
        wins: number;
        losses: number;
      }
    >();

    const seenGames = new Set<number>();

    for (const game of games) {
      const roundCode = game.gameType;

      if (!roundCode || !ROUNDS[roundCode]) continue;

      // Only count games with final results.
      if (game.status?.abstractGameState !== "Final") {
        continue;
      }

      const away = game.teams?.away;
      const home = game.teams?.home;

      if (
        typeof away?.score !== "number" ||
        typeof home?.score !== "number" ||
        away.score === home.score
      ) {
        continue;
      }

      // Only deduplicate games after confirming a valid result.
      // Postponed games may reuse the same gamePk when rescheduled.
      if (
        game.gamePk !== undefined &&
        seenGames.has(game.gamePk)
      ) {
        continue;
      }

      if (game.gamePk !== undefined) {
        seenGames.add(game.gamePk);
      }

      const yankeesHome = home.team?.id === TEAM_ID;
      const yankeesAway = away.team?.id === TEAM_ID;

      if (!yankeesHome && !yankeesAway) continue;

      const opponent = yankeesHome ? away.team : home.team;

      if (
        typeof opponent?.id !== "number" ||
        !opponent.name
      ) {
        continue;
      }

      const key = `${roundCode}-${opponent.id}`;

      if (!seriesMap.has(key)) {
        seriesMap.set(key, {
          round: ROUNDS[roundCode],
          roundCode,
          opponent: opponent.name,
          opponentId: opponent.id,
          wins: 0,
          losses: 0,
        });
      }

      const series = seriesMap.get(key)!;

      const yankeesScore = yankeesHome ? home.score : away.score;
      const opponentScore = yankeesHome ? away.score : home.score;

      if (yankeesScore > opponentScore) {
        series.wins++;
      } else {
        series.losses++;
      }
    }

    const series = [...seriesMap.values()]
      .sort(
        (a, b) =>
          ROUND_ORDER.indexOf(a.roundCode) -
          ROUND_ORDER.indexOf(b.roundCode)
      )
      .map(({ roundCode, ...entry }) => {
        void roundCode;

        const requiredWins =
          entry.round === "Wild Card"
            ? season === 2020 || season >= 2022
              ? 2
              : 1
            : entry.round === "Division Series"
              ? 3
              : entry.round === "League Championship Series"
                ? season >= 1969 && season <= 1984
                  ? 3
                  : 4
                : 4;

        const result: HistoricalPostseasonSeries["result"] =
          entry.wins >= requiredWins
            ? "Won"
            : entry.losses >= requiredWins
              ? "Lost"
              : "Incomplete";

        return {
          ...entry,
          result,
        };
      });

    return {
      season,
      appeared: series.length > 0,
      worldSeriesChampion: series.some(
        (entry) =>
          entry.round === "World Series" &&
          entry.result === "Won"
      ),
      series,
    };
  } catch {
    return null;
  }
}
