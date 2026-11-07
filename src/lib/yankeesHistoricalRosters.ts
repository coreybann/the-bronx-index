const TEAM_ID = 147;

export type HistoricalRosterPlayer = {
  id: number;
  name: string;
  position: string;
  jerseyNumber: string | null;
  group: "Pitchers" | "Catchers" | "Infielders" | "Outfielders" | "Designated Hitters" | "Other";
};

export type HistoricalRoster = {
  season: number;
  players: HistoricalRosterPlayer[];
};

type MLBRosterResponse = {
  roster?: {
    person?: {
      id?: number;
      fullName?: string;
    };
    position?: {
      abbreviation?: string;
      type?: string;
    };
    jerseyNumber?: string;
  }[];
};

function getPositionGroup(
  position: string,
  type: string
): HistoricalRosterPlayer["group"] {
  if (position === "P" || type === "Pitcher") {
    return "Pitchers";
  }

  if (position === "C" || type === "Catcher") {
    return "Catchers";
  }

  if (position === "DH" || type === "Designated Hitter") {
    return "Designated Hitters";
  }

  if (
    ["1B", "2B", "3B", "SS", "IF"].includes(position) ||
    type === "Infielder"
  ) {
    return "Infielders";
  }

  if (
    ["LF", "CF", "RF", "OF"].includes(position) ||
    type === "Outfielder"
  ) {
    return "Outfielders";
  }

  return "Other";
}

export async function getYankeesHistoricalRoster(
  season: number
): Promise<HistoricalRoster | null> {
  if (
    !Number.isInteger(season) ||
    season < 1903 ||
    season > 2026
  ) {
    return null;
  }

  const params = new URLSearchParams({
    rosterType: "fullSeason",
    season: String(season),
  });

  const url =
    `https://statsapi.mlb.com/api/v1/teams/${TEAM_ID}/roster?` +
    params.toString();

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data: MLBRosterResponse = await response.json();

    if (!Array.isArray(data.roster) || data.roster.length === 0) {
      return null;
    }

    const seen = new Set<number>();

    const players: HistoricalRosterPlayer[] = data.roster
      .flatMap((entry) => {
        const id = entry.person?.id;
        const name = entry.person?.fullName;

        if (
          typeof id !== "number" ||
          !name ||
          seen.has(id)
        ) {
          return [];
        }

        seen.add(id);

        const position = entry.position?.abbreviation ?? "N/A";
        const type = entry.position?.type ?? "";

        return [{
          id,
          name,
          position,
          jerseyNumber: entry.jerseyNumber?.trim() || null,
          group: getPositionGroup(position, type),
        }];
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      season,
      players,
    };
  } catch {
    return null;
  }
}
