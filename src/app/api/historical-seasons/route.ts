import { NextRequest, NextResponse } from "next/server";
import { getYankeesHistoricalSeason } from "@/lib/yankeesHistoricalSeasons";

export async function GET(request: NextRequest) {
  const seasonParam = request.nextUrl.searchParams.get("season");

  if (
    !seasonParam ||
    !/^\d{4}$/.test(seasonParam)
  ) {
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

  const data = await getYankeesHistoricalSeason(season);

  if (!data) {
    return NextResponse.json(
      {
        error: "Historical standings are unavailable for this season.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    team: "New York Yankees",
    teamId: 147,
    ...data,
    source: "MLB Stats API",
  });
}
