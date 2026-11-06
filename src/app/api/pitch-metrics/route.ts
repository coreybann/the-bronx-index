type PitchMetrics = {
  pitchType: string;
  pitches: number;
  averageVelocity: number | null;
  averageSpinRate: number | null;
  horizontalMovement: number | null;
  verticalMovement: number | null;
};

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  cells.push(value);
  return cells;
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVRow(line);

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] ?? "",
      ])
    );
  });
}

function calculatePitchMetrics(
  rows: Record<string, string>[]
): PitchMetrics[] {
  const groups = new Map<string, Record<string, string>[]>();

  for (const row of rows) {
    const pitchType = row.pitch_type?.trim();

    if (!pitchType) continue;

    const existing = groups.get(pitchType) ?? [];
    existing.push(row);
    groups.set(pitchType, existing);
  }

  function average(
    rows: Record<string, string>[],
    column: string
  ): number | null {
    const values = rows
      .map((row) => row[column]?.trim())
      .filter(
        (value): value is string =>
          Boolean(value) &&
          value !== "null" &&
          value !== "NA"
      )
      .map(Number)
      .filter(Number.isFinite);

    if (values.length === 0) return null;

    return values.reduce((sum, value) => sum + value, 0) /
      values.length;
  }

  return [...groups.entries()].map(([pitchType, pitches]) => {
    const velocity = average(pitches, "release_speed");
    const spin = average(pitches, "release_spin_rate");
    const horizontal = average(pitches, "pfx_x");
    const vertical = average(pitches, "pfx_z");

    return {
      pitchType,
      pitches: pitches.length,
      averageVelocity: velocity,
      averageSpinRate: spin,
      horizontalMovement: horizontal === null ? null : horizontal * 12,
      verticalMovement: vertical === null ? null : vertical * 12,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const playerId = searchParams.get("playerId");
  const season = searchParams.get("season");

  if (!playerId || !/^\d+$/.test(playerId)) {
    return Response.json(
      { error: "A valid MLB player ID is required." },
      { status: 400 }
    );
  }

  if (
    !season ||
    !/^\d{4}$/.test(season) ||
    Number(season) < 2015 ||
    Number(season) > new Date().getFullYear()
  ) {
    return Response.json(
      { error: "A valid season is required." },
      { status: 400 }
    );
  }

  try {
    const ranges = getSeasonDateRanges(season);
    const allRows: Record<string, string>[] = [];

    for (const range of ranges) {
      const params = new URLSearchParams({
        all: "true",
        type: "pitches",
        player_type: "pitcher",
        game_date_gt: range.start,
        game_date_lt: range.end,
        hfSea: `${season}|`,
        hfGT: "R|",
      });

      params.append("pitchers_lookup[]", playerId);

      const response = await fetch(
        `https://baseballsavant.mlb.com/statcast_search/csv?${params.toString()}`,
        { next: { revalidate: 86400 } }
      );

      if (!response.ok) {
        throw new Error(
          `Baseball Savant returned ${response.status} for ${range.start}`
        );
      }

      const csv = await response.text();

      if (!csv.replace(/^\\uFEFF/, "").startsWith('"pitch_type"')) {
        throw new Error(`Invalid CSV response for ${range.start}`);
      }

      const rows = parseCSV(csv).filter(
        (row) =>
          row.pitcher === playerId &&
          row.game_type === "R" &&
          row.game_year === season
      );

      allRows.push(...rows);
    }

    return Response.json({
      playerId: Number(playerId),
      season,
      sampleOnly: false,
      source: "Baseball Savant",
      totalPitches: allRows.length,
      pitchMetrics: calculatePitchMetrics(allRows),
    });
  } catch (error) {
    console.error("Pitch metrics API error:", error);

    return Response.json(
      { error: "Unable to retrieve pitch metrics." },
      { status: 502 }
    );
  }
}

function getSeasonDateRanges(season: string) {
  const year = Number(season);
  const today = new Date();

  const months = [3, 4, 5, 6, 7, 8, 9, 10];

  return months
    .filter((month) => {
      if (year < today.getUTCFullYear()) return true;
      return month <= today.getUTCMonth() + 1;
    })
    .map((month) => {
      const monthString = String(month).padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();

      return {
        start: `${season}-${monthString}-01`,
        end: `${season}-${monthString}-${String(lastDay).padStart(2, "0")}`,
      };
    });
}
