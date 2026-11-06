
import { getLeagueStatcastHitters } from "@/lib/leagueStatcastHitters";
import { calculateHitterPercentiles } from "@/lib/hitterPercentiles";

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseValue(value: string): number | null {
  const cleaned = cleanText(value);

  if (!cleaned || cleaned === "--" || cleaned === "—") {
    return null;
  }

  const number = Number(cleaned.replace(/,/g, ""));

  return Number.isFinite(number) ? number : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const playerId = searchParams.get("playerId");
const season = searchParams.get("season") ?? "2025";
const group = searchParams.get("group") ?? "hitting";
if (group !== "hitting" && group !== "pitching") {
  return Response.json(
    { error: "Group must be hitting or pitching." },
    { status: 400 }
  );
}
  if (!playerId || !/^\d+$/.test(playerId)) {
    return Response.json(
      { error: "A valid MLB player ID is required." },
      { status: 400 }
    );
  }

  const seasonNumber = Number(season);

  if (
    !/^\d{4}$/.test(season) ||
    seasonNumber < 2015 ||
    seasonNumber > new Date().getFullYear()
  ) {
    return Response.json(
      { error: "Season must be between 2015 and the current year." },
      { status: 400 }
    );
  }

  try {
    // Retrieve the player's name from MLB.
    const playerResponse = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${playerId}`,
      { next: { revalidate: 86400 } }
    );

    if (!playerResponse.ok) {
      return Response.json(
        { error: "Unable to find MLB player." },
        { status: 404 }
      );
    }

    const playerData = await playerResponse.json();
    const player = playerData.people?.[0];

    if (!player?.fullName) {
      return Response.json(
        { error: "Player information unavailable." },
        { status: 404 }
      );
    }

    const slug = player.fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Retrieve the individual Baseball Savant profile.
    const savantResponse = await fetch(
  `https://baseballsavant.mlb.com/savant-player/${slug}-${playerId}?stats=statcast-r-${group}-mlb`,
  { cache: "no-store" }
);

    if (!savantResponse.ok) {
      return Response.json(
        { error: "Baseball Savant data is unavailable." },
        { status: 502 }
      );
    }

    const html = await savantResponse.text();

    // Locate the specific historical Statcast table.
    const headerPosition = html.indexOf('id="statcast_th-0"');

    if (headerPosition === -1) {
      return Response.json(
        { error: "Statcast hitting table not found." },
        { status: 404 }
      );
    }

    const tableStart = html.lastIndexOf("<table", headerPosition);
    const tableEnd = html.indexOf("</table>", headerPosition);

    if (tableStart === -1 || tableEnd === -1) {
      return Response.json(
        { error: "Unable to locate Statcast table." },
        { status: 404 }
      );
    }

    const tableHTML = html
  .slice(tableStart, tableEnd + 8)
  .replace(/<!--[\s\S]*?-->/g, "");

    const rows = [
      ...tableHTML.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi),
    ];

    let selectedValues: string[] | null = null;

    for (const row of rows) {
      const cells = [
        ...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi),
      ].map((cell) => cleanText(cell[1]));

      if (cells[0] === season) {
        selectedValues = cells;
        break;
      }
    }

    if (!selectedValues || selectedValues.length < 20) {
      return Response.json(
        {
          error: "No Statcast hitting record found for this season.",
          playerId,
          playerName: player.fullName,
          season,
        },
        { status: 404 }
      );
    }

    const values = selectedValues;
    const pitchArsenal: {
  pitchType: string;
  runValuePer100: number | null;
  runValue: number | null;
  pitches: number | null;
  usagePercentage: number | null;
  plateAppearances: number | null;
  battingAverage: number | null;
  slugging: number | null;
  wOBA: number | null;
  whiffPercentage: number | null;
  strikeoutPercentage: number | null;
  putAwayPercentage: number | null;
  expectedBA: number | null;
  expectedSLG: number | null;
  expectedwOBA: number | null;
  hardHitPercentage: number | null;
}[] = [];

if (group === "pitching") {
  const arsenalMatch = html.match(
    /<table\b(?=[^>]*\bid=["']runValues["'])[^>]*>([\s\S]*?)<\/table>/i
  );

  if (arsenalMatch) {
    const arsenalRows = [
      ...arsenalMatch[1].matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      ),
    ];

    for (const row of arsenalRows) {
      const cells = [
        ...row[1].matchAll(
          /<td\b[^>]*>([\s\S]*?)<\/td>/gi
        ),
      ].map((cell) => cleanText(cell[1]));

      if (cells[0] !== season || cells.length < 18) {
        continue;
      }

      pitchArsenal.push({
        pitchType: cells[1],
        runValuePer100: parseValue(cells[3]),
        runValue: parseValue(cells[4]),
        pitches: parseValue(cells[5]),
        usagePercentage: parseValue(cells[6]),
        plateAppearances: parseValue(cells[7]),
        battingAverage: parseValue(cells[8]),
        slugging: parseValue(cells[9]),
        wOBA: parseValue(cells[10]),
        whiffPercentage: parseValue(cells[11]),
        strikeoutPercentage: parseValue(cells[12]),
        putAwayPercentage: parseValue(cells[13]),
        expectedBA: parseValue(cells[14]),
        expectedSLG: parseValue(cells[15]),
        expectedwOBA: parseValue(cells[16]),
        hardHitPercentage: parseValue(cells[17]),
      });
    }
  }
}
    const percentileRankings: Record<string, number | null> = {};

if (group === "pitching") {
  const percentileTableMatch = html.match(
    /<table\b(?=[^>]*\bid=["']percentileRankings["'])[^>]*>([\s\S]*?)<\/table>/i
  );

  if (percentileTableMatch) {
    const percentileRows = [
      ...percentileTableMatch[1].matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      ),
    ];

    const percentileKeys = [
      "pitching",
      "fastball",
      "breaking",
      "offSpeed",
      "xERA",
      "fastballMPH",
      "fastballSpin",
      "curveSpin",
      "averageExitVelocity",
      "chase",
      "whiff",
      "strikeout",
      "walk",
      "barrel",
      "hardHit",
      "groundBall",
      "extension",
    ];

    for (const row of percentileRows) {
      const cells = [
        ...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
      ].map((cell) => cleanText(cell[1]));

      if (cells[0] === season) {
        percentileKeys.forEach((key, index) => {
          percentileRankings[key] = parseValue(cells[index + 1]);
        });

        break;
      }
    }
  }
}
if (group === "hitting") {
  const percentileTableMatch = html.match(
    /<table\b(?=[^>]*\bid=["']percentileRankings["'])[^>]*>([\s\S]*?)<\/table>/i
  );

  if (percentileTableMatch) {
    const percentileRows = [
      ...percentileTableMatch[1].matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      ),
    ];

    const percentileKeys = [
      "batting",
      "baseRunning",
      "fielding",
      "xwOBA",
      "xBA",
      "xSLG",
      "exitVelocity",
      "barrel",
      "hardHit",
      "sweetSpot",
      "batSpeed",
      "squaredUp",
      "chase",
      "whiff",
      "strikeout",
      "walk",
      "rangeOAA",
      "armValue",
      "armStrength",
      "firstBaseReceiving",
      "sprintSpeed",
    ];

    for (const row of percentileRows) {
      const cells = [
        ...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
      ].map((cell) => cleanText(cell[1]));

      if (cells[0] === season) {
        percentileKeys.forEach((key, index) => {
          percentileRankings[key] = parseValue(cells[index + 1]);
        });
        break;
      }
    }
  }
}

if (group === "pitching") {
  if (values.length < 22) {
    return Response.json(
      {
        error: "Incomplete Statcast pitching record.",
        playerId,
        playerName: player.fullName,
        season,
      },
      { status: 404 }
    );
  }

  return Response.json({
    playerId,
    playerName: player.fullName,
    season,
    source: "Baseball Savant",
    group: "pitching",
percentileRankings,
pitchArsenal,
statistics: {
      age: parseValue(values[1]),
      pitches: parseValue(values[3]),
      battedBalls: parseValue(values[4]),
      barrels: parseValue(values[5]),
      barrelPercentage: parseValue(values[6]),
      barrelPerPA: parseValue(values[7]),
      averageExitVelocity: parseValue(values[8]),
      maximumExitVelocity: parseValue(values[9]),
      launchAngle: parseValue(values[10]),
      sweetSpotPercentage: parseValue(values[11]),
      expectedBattingAverageAgainst: parseValue(values[12]),
      expectedSluggingAgainst: parseValue(values[13]),
      wOBAAgainst: parseValue(values[14]),
      expectedwOBAAgainst: parseValue(values[15]),
      expectedwOBAcon: parseValue(values[16]),
      hardHitPercentage: parseValue(values[17]),
      strikeoutPercentage: parseValue(values[18]),
      walkPercentage: parseValue(values[19]),
      era: parseValue(values[20]),
      expectedERA: parseValue(values[21]),
    },
  });
}
    let bronxIndexPercentiles: Record<string, number | null> | null = null;

    try {
      const leagueHitters = await getLeagueStatcastHitters(seasonNumber);
      const leaguePlayer = leagueHitters.find(
        (hitter) => hitter.player_id === Number(playerId)
      );

      if (leaguePlayer) {
        bronxIndexPercentiles = calculateHitterPercentiles(
          leaguePlayer,
          leagueHitters
        );
      }
    } catch (error) {
      console.error("Bronx Index percentile calculation failed:", error);
    }

    return Response.json({
      playerId,
      playerName: player.fullName,
      season,
      source: "Baseball Savant",
      percentileRankings,
      bronxIndexPercentiles,
      statistics: {
        age: parseValue(values[1]),
        pitches: parseValue(values[3]),
        battedBalls: parseValue(values[4]),
        barrels: parseValue(values[5]),
        barrelPercentage: parseValue(values[6]),
        barrelPerPA: parseValue(values[7]),
        averageExitVelocity: parseValue(values[8]),
        maximumExitVelocity: parseValue(values[9]),
        launchAngle: parseValue(values[10]),
        sweetSpotPercentage: parseValue(values[11]),
        expectedBattingAverage: parseValue(values[12]),
        expectedSlugging: parseValue(values[13]),
        wOBA: parseValue(values[14]),
        expectedwOBA: parseValue(values[15]),
        expectedwOBAcon: parseValue(values[16]),
        hardHitPercentage: parseValue(values[17]),
        strikeoutPercentage: parseValue(values[18]),
        walkPercentage: parseValue(values[19]),
      },
    });
  } catch (error) {
    console.error("Statcast API error:", error);

    return Response.json(
      { error: "Unable to retrieve Statcast data." },
      { status: 500 }
    );
  }
}
