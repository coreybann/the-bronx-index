import { NextRequest, NextResponse } from "next/server";
import {
  getYankeesHistoricalTeamStats,
  type HistoricalStatGroup,
} from "@/lib/yankeesHistoricalTeamStats";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const seasonParam = searchParams.get("season");
  const group = searchParams.get("group") ?? "hitting";

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

  if (group !== "hitting" && group !== "pitching") {
    return NextResponse.json(
      { error: "Invalid statistical group." },
      { status: 400 }
    );
  }

  const data = await getYankeesHistoricalTeamStats(
    season,
    group as HistoricalStatGroup
  );

  if (!data) {
    return NextResponse.json(
      { error: "Historical team statistics are unavailable." },
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
