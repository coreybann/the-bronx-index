import { NextRequest, NextResponse } from "next/server";
import { getYankeesHistoricalRoster } from "@/lib/yankeesHistoricalRosters";

export async function GET(request: NextRequest) {
  const seasonParam = request.nextUrl.searchParams.get("season");

  if (!seasonParam || !/^\d{4}$/.test(seasonParam)) {
    return NextResponse.json(
      { error: "A valid four-digit season is required." },
      { status: 400 }
    );
  }

  const season = Number(seasonParam);

  if (season < 1903 || season > 2026) {
    return NextResponse.json(
      { error: "Season must be between 1903 and 2026." },
      { status: 400 }
    );
  }

  const data = await getYankeesHistoricalRoster(season);

  if (!data) {
    return NextResponse.json(
      { error: "Historical roster unavailable for this season." },
      { status: 404 }
    );
  }

  const groups = [
    "Pitchers",
    "Catchers",
    "Infielders",
    "Outfielders",
    "Designated Hitters",
    "Other",
  ] as const;

  return NextResponse.json({
    team: "New York Yankees",
    teamId: 147,
    season: data.season,
    totalPlayers: data.players.length,
    groups: groups.map((name) => ({
      name,
      players: data.players.filter(
        (player) => player.group === name
      ),
    })),
    source: "MLB Stats API",
  });
}
