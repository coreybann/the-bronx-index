export const MIN_HITTER_PA = 100;

export const HITTER_PERCENTILE_METRICS = {
  xwOBA: { field: "xwoba", higherIsBetter: true },
  xBA: { field: "xba", higherIsBetter: true },
  xSLG: { field: "xslg", higherIsBetter: true },
  exitVelocity: { field: "exit_velocity_avg", higherIsBetter: true },
  barrel: { field: "barrel_batted_rate", higherIsBetter: true },
  hardHit: { field: "hard_hit_percent", higherIsBetter: true },
  sweetSpot: { field: "sweet_spot_percent", higherIsBetter: true },
  batSpeed: { field: "avg_swing_speed", higherIsBetter: true },
  squaredUp: { field: "squared_up_swing", higherIsBetter: true },
  chase: { field: "oz_swing_percent", higherIsBetter: false },
  whiff: { field: "whiff_percent", higherIsBetter: false },
  strikeout: { field: "k_percent", higherIsBetter: false },
  walk: { field: "bb_percent", higherIsBetter: true },
} as const;

export type HitterRecord = {
  player_id: number;
  pa: number;
  year: number;
  [key: string]: unknown;
};

function numericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export function calculateHitterPercentiles(
  player: HitterRecord,
  leagueHitters: HitterRecord[]
): Record<string, number | null> {
  const result: Record<string, number | null> = {};

  const eligible = leagueHitters.filter(
    (hitter) =>
      hitter.year === player.year &&
      hitter.pa >= MIN_HITTER_PA
  );

  const playerIsIncluded = eligible.some(
    (hitter) => hitter.player_id === player.player_id
  );

  function meetsSampleRequirement(
    hitter: HitterRecord,
    metric: string
  ): boolean {
    if (hitter.pa < MIN_HITTER_PA) return false;

    const battedBalls = numericValue(hitter.batted_ball) ?? 0;
    const zoneSwings = numericValue(hitter.in_zone_swing) ?? 0;
    const outZoneSwings = numericValue(hitter.out_zone_swing) ?? 0;
    const outZonePitches = numericValue(hitter.out_zone) ?? 0;

    if (["exitVelocity", "barrel", "hardHit", "sweetSpot"].includes(metric)) {
      return battedBalls >= 50;
    }

    if (["batSpeed", "squaredUp", "whiff"].includes(metric)) {
      return zoneSwings + outZoneSwings >= 100;
    }

    if (metric === "chase") {
      return outZonePitches >= 100;
    }

    return true;
  }

  for (const [key, config] of Object.entries(HITTER_PERCENTILE_METRICS)) {
    const playerValue = numericValue(player[config.field]);

    if (
      !playerIsIncluded ||
      !meetsSampleRequirement(player, key) ||
      playerValue === null
    ) {
      result[key] = null;
      continue;
    }

    const values = eligible
      .filter((hitter) => meetsSampleRequirement(hitter, key))
      .map((hitter) => numericValue(hitter[config.field]))
      .filter((value): value is number => value !== null);

    if (values.length < 2) {
      result[key] = null;
      continue;
    }

    const worse = values.filter((value) =>
      config.higherIsBetter
        ? value < playerValue
        : value > playerValue
    ).length;

    const tied = values.filter(
      (value) => value === playerValue
    ).length;

    const percentile = (100 * (worse + tied / 2)) / values.length;

    result[key] = Math.max(0, Math.min(100, Math.round(percentile)));
  }

  return result;
}
