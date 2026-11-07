import { NextResponse } from "next/server";

type MLBPlayer = {
  person?: {
    id?: number;
    fullName?: string;
  };
  position?: {
    abbreviation?: string;
    type?: string;
  };
  status?: {
    code?: string;
    description?: string;
  };
};

type MLBFieldingResponse = {
  people?: {
    id: number;
    stats?: {
      splits?: {
        position?: {
          abbreviation?: string;
        };
        stat?: {
          gamesPlayed?: number;
        };
      }[];
    }[];
  }[];
};

type MLBPitchingResponse = {
  people?: {
    id: number;
    stats?: {
      splits?: {
        stat?: {
          gamesPitched?: number;
          gamesStarted?: number;
        };
      }[];
    }[];
  }[];
};

type MLBRosterResponse = {
  roster?: MLBPlayer[];
};

export async function GET() {
  try {
    const response = await fetch(
      "https://statsapi.mlb.com/api/v1/teams/147/roster?rosterType=40Man&hydrate=person",
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`);
    }

    const data = (await response.json()) as MLBRosterResponse;

    const players = (data.roster ?? [])
      .filter(
        (player) =>
          typeof player.person?.id === "number" &&
          Boolean(player.person.fullName)
      )
      .map((player) => ({
        id: player.person!.id!,
        name: player.person!.fullName!,
        position: player.position?.abbreviation ?? "N/A",
        positionType: player.position?.type ?? "Unknown",
        status: player.status?.description ?? "Unknown",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const playerIds = players.map((player) => player.id);

    const params = new URLSearchParams({
      personIds: playerIds.join(","),
      hydrate: "stats(group=[fielding],type=[season],season=2026)",
    });

    const fieldingResponse = await fetch(
      `https://statsapi.mlb.com/api/v1/people?${params.toString()}`,
      {
        next: { revalidate: 3600 },
      }
    );

    const fieldingData: MLBFieldingResponse = fieldingResponse.ok
      ? ((await fieldingResponse.json()) as MLBFieldingResponse)
      : {};

    const fieldingByPlayer = new Map(
      (fieldingData.people ?? []).map((player) => [
        player.id,
        (player.stats ?? []).flatMap((stat) =>
          (stat.splits ?? [])
            .map((split) => ({
              position: split.position?.abbreviation ?? "N/A",
              games: split.stat?.gamesPlayed ?? 0,
            }))
            .filter(
              (entry) =>
                entry.position !== "N/A" && entry.games > 0
            )
        ),
      ])
    );

    const pitcherIds = players
      .filter((player) => player.positionType === "Pitcher")
      .map((player) => player.id);

    const pitchingParams = new URLSearchParams({
      personIds: pitcherIds.join(","),
      hydrate: "stats(group=[pitching],type=[season],season=2026)",
    });

    const pitchingResponse = await fetch(
      `https://statsapi.mlb.com/api/v1/people?${pitchingParams.toString()}`,
      {
        next: { revalidate: 3600 },
      }
    );

    const pitchingData: MLBPitchingResponse = pitchingResponse.ok
      ? ((await pitchingResponse.json()) as MLBPitchingResponse)
      : {};

    const pitchingByPlayer = new Map(
      (pitchingData.people ?? []).map((player) => {
        const stats = player.stats?.flatMap(
          (group) => group.splits ?? []
        ) ?? [];

        const gamesPitched = stats.reduce(
          (total, split) =>
            total + (split.stat?.gamesPitched ?? 0),
          0
        );

        const gamesStarted = stats.reduce(
          (total, split) =>
            total + (split.stat?.gamesStarted ?? 0),
          0
        );

        return [
          player.id,
          { gamesPitched, gamesStarted },
        ] as const;
      })
    );

    const playersWithPositions = players.map((player) => ({
      ...player,
      fieldingPositions: fieldingByPlayer.get(player.id) ?? [],
      pitchingStats: pitchingByPlayer.get(player.id) ?? null,
    }));

    return NextResponse.json({
      team: "New York Yankees",
      rosterType: "40Man",
      count: playersWithPositions.length,
      players: playersWithPositions,
    });
  } catch (error) {
    console.error("Yankees roster API error:", error);

    return NextResponse.json(
      { error: "Unable to load Yankees roster." },
      { status: 502 }
    );
  }
}
