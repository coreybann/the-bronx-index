import type { LegendStat } from "./yankeesLegendStats";

function number(
  stat: Record<string, string | number>,
  key: string
): number {
  const value = Number(stat[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function rate(
  numerator: number,
  denominator: number,
  digits = 3
): string {
  if (denominator <= 0) return "—";
  return (numerator / denominator).toFixed(digits);
}

function total(
  seasons: LegendStat[],
  key: string
): number {
  return seasons.reduce(
    (sum, season) => sum + number(season.stat, key),
    0
  );
}

function inningsToOuts(value: string | number | undefined): number {
  if (value === undefined) return 0;

  const [innings, remainder = "0"] = String(value).split(".");
  const fullInnings = Number(innings);
  const extraOuts = Number(remainder);

  if (
    !Number.isInteger(fullInnings) ||
    !Number.isInteger(extraOuts) ||
    extraOuts < 0 ||
    extraOuts > 2
  ) {
    return 0;
  }

  return fullInnings * 3 + extraOuts;
}

export function getLegendHittingCareer(seasons: LegendStat[]) {
  const hits = total(seasons, "hits");
  const atBats = total(seasons, "atBats");
  const walks = total(seasons, "baseOnBalls");
  const hitByPitch = total(seasons, "hitByPitch");
  const totalBases = total(seasons, "totalBases");
  const plateAppearances = total(seasons, "plateAppearances");

  // The MLB API does not consistently provide all historical
  // sacrifice-fly data. Prefer official career rate statistics
  // when available rather than estimating historical OBP.
  const avg = rate(hits, atBats);
  const slg = rate(totalBases, atBats);

  return {
    games: total(seasons, "gamesPlayed"),
    hits,
    homeRuns: total(seasons, "homeRuns"),
    rbi: total(seasons, "rbi"),
    runs: total(seasons, "runs"),
    walks,
    plateAppearances,
    avg,
    slg,
    obp: "—",
    ops: "—",
    hitByPitch,
  };
}

export function getLegendPitchingCareer(seasons: LegendStat[]) {
  const outs = seasons.reduce(
    (sum, season) =>
      sum + (
        season.stat.outs !== undefined
          ? number(season.stat, "outs")
          : inningsToOuts(season.stat.inningsPitched)
      ),
    0
  );

  const innings = outs / 3;
  const earnedRuns = total(seasons, "earnedRuns");
  const hits = total(seasons, "hits");
  const walks = total(seasons, "baseOnBalls");

  return {
    games: total(seasons, "gamesPlayed"),
    wins: total(seasons, "wins"),
    losses: total(seasons, "losses"),
    saves: total(seasons, "saves"),
    strikeouts: total(seasons, "strikeOuts"),
    inningsPitched: `${Math.floor(outs / 3)}.${outs % 3}`,
    era: innings > 0
      ? ((earnedRuns * 9) / innings).toFixed(2)
      : "—",
    whip: innings > 0
      ? ((walks + hits) / innings).toFixed(2)
      : "—",
  };
}
