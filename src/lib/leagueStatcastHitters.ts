import "server-only";

import type { HitterRecord } from "./hitterPercentiles";

const CACHE_SECONDS = 86400;

export async function getLeagueStatcastHitters(
  season: number
): Promise<HitterRecord[]> {
  if (
    !Number.isInteger(season) ||
    season < 2015 ||
    season > new Date().getFullYear()
  ) {
    throw new Error("Invalid Statcast season.");
  }

  const url = new URL(
    "https://baseballsavant.mlb.com/leaderboard/custom"
  );

  url.searchParams.set("type", "batter");
  url.searchParams.set("year", String(season));
  url.searchParams.set("team", "");
  url.searchParams.set("min", "0");

  const response = await fetch(url.toString(), {
    next: { revalidate: CACHE_SECONDS },
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Baseball Savant leaderboard returned ${response.status}.`
    );
  }

  const html = await response.text();

  const marker = "var data = ";
  const markerPosition = html.indexOf(marker);

  if (markerPosition === -1) {
    throw new Error("Leaderboard data array not found.");
  }

  const start = markerPosition + marker.length;
  const end = html.indexOf("];", start);

  if (end === -1) {
    throw new Error("Leaderboard data array is incomplete.");
  }

  const parsed: unknown = JSON.parse(
    html.slice(start, end + 1).trim()
  );

  if (!Array.isArray(parsed)) {
    throw new Error("Leaderboard data is not an array.");
  }

  const hitters = parsed.filter(
    (record): record is HitterRecord =>
      typeof record === "object" &&
      record !== null &&
      typeof record.player_id === "number" &&
      typeof record.pa === "number" &&
      record.year === season
  );

  if (hitters.length === 0 || hitters.length !== parsed.length) {
    throw new Error("Leaderboard records failed validation.");
  }

  return hitters;
}
