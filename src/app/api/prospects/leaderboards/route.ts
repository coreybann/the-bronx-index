import { getYankeesProspectSeasonLeaderboard } from "@/lib/minorLeagueLeaderboards";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const season = searchParams.get("season") ?? "2026";
  const group = searchParams.get("group") ?? "hitting";

  if (
    !/^\d{4}$/.test(season) ||
    Number(season) < 2000 ||
    Number(season) > new Date().getFullYear()
  ) {
    return Response.json(
      { error: "A valid season is required." },
      { status: 400 }
    );
  }

  if (group !== "hitting" && group !== "pitching") {
    return Response.json(
      { error: "Group must be hitting or pitching." },
      { status: 400 }
    );
  }

  try {
    const players = await getYankeesProspectSeasonLeaderboard(
      Number(season),
      group
    );

    return Response.json({
      season: Number(season),
      group,
      count: players.length,
      players,
    });
  } catch (error) {
    console.error("Yankees leaderboard API error:", error);

    return Response.json(
      { error: "Unable to retrieve Yankees minor league leaderboards." },
      { status: 502 }
    );
  }
}
