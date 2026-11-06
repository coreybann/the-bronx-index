type Stats = Record<string, string | number>;

function number(stats: Stats, key: string): number {
  const value = Number(stats[key]);
  return Number.isFinite(value) ? value : 0;
}

function rate(
  numerator: number,
  denominator: number
): string {
  if (denominator <= 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function decimal(value: number, digits = 3): string {
  return value.toFixed(digits);
}

export function getAdvancedHitting(stats: Stats) {
  const pa = number(stats, "plateAppearances");
  const avg = number(stats, "avg");
  const slg = number(stats, "slg");
  const sb = number(stats, "stolenBases");
  const cs = number(stats, "caughtStealing");

  return {
    ISO:
      stats.avg !== undefined && stats.slg !== undefined
        ? decimal(slg - avg)
        : "—",
    "BB%": rate(number(stats, "baseOnBalls"), pa),
    "K%": rate(number(stats, "strikeOuts"), pa),
    "HR%": rate(number(stats, "homeRuns"), pa),
    BABIP: stats.babip ?? "—",
    "SB%": rate(sb, sb + cs),
  };
}

export function getAdvancedPitching(stats: Stats) {
  const bf = number(stats, "battersFaced");

  return {
    "K/9": stats.strikeoutsPer9Inn ?? "—",
    "BB/9": stats.walksPer9Inn ?? "—",
    "HR/9": stats.homeRunsPer9 ?? "—",
    "K/BB": stats.strikeoutWalkRatio ?? "—",
    "K%": rate(number(stats, "strikeOuts"), bf),
    "BB%": rate(number(stats, "baseOnBalls"), bf),
  };
}
