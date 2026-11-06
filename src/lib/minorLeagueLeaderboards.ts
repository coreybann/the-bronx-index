import type { MinorLeagueStatLine } from "@/lib/minorLeagueStats";

export function getMinorLeagueSeasonTotal(
  lines: MinorLeagueStatLine[],
  season: number
): MinorLeagueStatLine | null {
  const seasonLines = lines.filter(
    (line) => Number(line.season) === season
  );

  const combined = seasonLines.find(
    (line) => line.isCombined
  );

  if (combined) {
    return combined;
  }

  if (seasonLines.length === 1) {
    return seasonLines[0];
  }

  // Multiple affiliate rows without an official combined total
  // require separate handling to avoid inaccurate statistics.
  return null;
}

export type AffiliateStatLine = {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  level: string;
  season: number;
  stats: Record<string, string | number>;
};

type AffiliateAPISplit = {
  player?: { id?: number; fullName?: string };
  team?: { id?: number; name?: string };
  sport?: { abbreviation?: string };
  season?: string | number;
  stat?: Record<string, string | number>;
};

export async function getAffiliateSeasonStats(
  teamId: number,
  sportId: number,
  season: number,
  group: "hitting" | "pitching"
): Promise<AffiliateStatLine[]> {
  const url =
    "https://statsapi.mlb.com/api/v1/stats" +
    `?stats=season&group=${group}` +
    `&sportIds=${sportId}&teamId=${teamId}` +
    `&season=${season}&playerPool=ALL&limit=500`;

  const response = await fetch(url, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load affiliate statistics: ${response.status}`
    );
  }

  const data: {
    stats?: { splits?: AffiliateAPISplit[] }[];
  } = await response.json();

  const splits = data.stats?.[0]?.splits ?? [];

  return splits
    .filter(
      (split) =>
        split.player?.id &&
        split.team?.id === teamId &&
        split.stat
    )
    .map((split) => ({
      playerId: split.player!.id!,
      playerName: split.player!.fullName ?? "Unknown Player",
      teamId,
      teamName: split.team?.name ?? "Unknown Team",
      level: split.sport?.abbreviation ?? "Unknown",
      season: Number(split.season ?? season),
      stats: split.stat!,
    }));
}

import { YANKEES_AFFILIATES, getYankeesProspects } from "@/lib/yankeesProspects";

const AFFILIATE_SPORT_IDS: Record<number, number> = {
  531: 11,  // Triple-A
  1956: 12, // Double-A
  537: 13,  // High-A
  587: 14,  // Single-A
  475: 16,  // Florida Complex League
  635: 16,  // Dominican Summer League
  634: 16,  // Dominican Summer League
};

export async function getYankeesAffiliateStats(
  season: number,
  group: "hitting" | "pitching"
): Promise<AffiliateStatLine[]> {
  const results = await Promise.all(
    YANKEES_AFFILIATES.map((affiliate) => {
      const sportId = AFFILIATE_SPORT_IDS[affiliate.id];

      if (!sportId) {
        throw new Error(
          `Missing sport ID for affiliate ${affiliate.name}`
        );
      }

      return getAffiliateSeasonStats(
        affiliate.id,
        sportId,
        season,
        group
      );
    })
  );

  return results.flat();
}

export function filterProspectLeaderboardStats(
  statLines: AffiliateStatLine[],
  eligiblePlayerIds: Set<number>
): AffiliateStatLine[] {
  return statLines.filter((line) =>
    eligiblePlayerIds.has(line.playerId)
  );
}

export async function getYankeesProspectLeaderboardStats(
  season: number,
  group: "hitting" | "pitching"
): Promise<AffiliateStatLine[]> {
  const [players, statLines] = await Promise.all([
    getYankeesProspects(season),
    getYankeesAffiliateStats(season, group),
  ]);

  const eligiblePlayerIds = new Set(
    players.map((player) => player.id)
  );

  return filterProspectLeaderboardStats(
    statLines,
    eligiblePlayerIds
  );
}

export type ProspectLeaderboardPlayer = {
  playerId: number;
  playerName: string;
  affiliateStats: AffiliateStatLine[];
  hasMultipleAffiliates: boolean;
};

export function groupProspectLeaderboardStats(
  statLines: AffiliateStatLine[]
): ProspectLeaderboardPlayer[] {
  const players = new Map<number, ProspectLeaderboardPlayer>();

  for (const line of statLines) {
    const existing = players.get(line.playerId);

    if (existing) {
      existing.affiliateStats.push(line);
      existing.hasMultipleAffiliates =
        new Set(
          existing.affiliateStats.map((stat) => stat.teamId)
        ).size > 1;
    } else {
      players.set(line.playerId, {
        playerId: line.playerId,
        playerName: line.playerName,
        affiliateStats: [line],
        hasMultipleAffiliates: false,
      });
    }
  }

  return Array.from(players.values()).sort((a, b) =>
    a.playerName.localeCompare(b.playerName)
  );
}

export function getPlayersRequiringCombinedStats(
  players: ProspectLeaderboardPlayer[]
): ProspectLeaderboardPlayer[] {
  return players.filter(
    (player) => player.hasMultipleAffiliates
  );
}

import { getMinorLeagueStats } from "@/lib/minorLeagueStats";

export async function getCombinedProspectStats(
  players: ProspectLeaderboardPlayer[],
  season: number,
  group: "hitting" | "pitching"
): Promise<Map<number, MinorLeagueStatLine>> {
  const combinedStats = new Map<number, MinorLeagueStatLine>();

  const batchSize = 5;

  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (player) => {
        const lines = await getMinorLeagueStats(
          player.playerId,
          group
        );

        const combined = lines.find(
          (line) =>
            Number(line.season) === season &&
            line.isCombined
        );

        return {
          playerId: player.playerId,
          combined,
        };
      })
    );

    for (const result of results) {
      if (result.combined) {
        combinedStats.set(
          result.playerId,
          result.combined
        );
      }
    }
  }

  return combinedStats;
}

export type ProspectSeasonLeaderboardEntry = {
  playerId: number;
  playerName: string;
  affiliates: string[];
  stats: Record<string, string | number>;
};

export function getProspectAdvancedStats(
  stats: Record<string, string | number>,
  group: "hitting" | "pitching"
): Record<string, string | number> {
  const result = { ...stats };
  const value = (key: string) => Number(stats[key] ?? 0);

  const percentage = (numerator: number, denominator: number) =>
    denominator > 0
      ? (numerator / denominator * 100).toFixed(1)
      : "—";

  if (group === "hitting") {
    const pa = value("plateAppearances");
    const ab = value("atBats");
    const hits = value("hits");
    const hr = value("homeRuns");
    const so = value("strikeOuts");
    const bb = value("baseOnBalls");
    const sf = value("sacFlies");
    const avg = Number(stats.avg);
    const slg = Number(stats.slg);

    result.iso = Number.isFinite(avg) && Number.isFinite(slg)
      ? (slg - avg).toFixed(3)
      : "—";
    result.walkRate = percentage(bb, pa);
    result.strikeoutRate = percentage(so, pa);

    const babipDenominator = ab - so - hr + sf;
    result.babip = babipDenominator > 0
      ? ((hits - hr) / babipDenominator).toFixed(3)
      : "—";
  } else {
    const bf = value("battersFaced");
    const so = value("strikeOuts");
    const bb = value("baseOnBalls");

    result.walkRate = percentage(bb, bf);
    result.strikeoutRate = percentage(so, bf);
    result.strikeoutMinusWalkRate = percentage(so - bb, bf);
    result.strikeoutWalkRatio = bb > 0
      ? (so / bb).toFixed(2)
      : "—";
  }

  return result;
}

export async function getYankeesProspectSeasonLeaderboard(
  season: number,
  group: "hitting" | "pitching"
): Promise<ProspectSeasonLeaderboardEntry[]> {
  const statLines = await getYankeesProspectLeaderboardStats(
    season,
    group
  );

  const players = groupProspectLeaderboardStats(statLines);

  return players.flatMap((player) => {
    const stats = player.hasMultipleAffiliates
      ? combineYankeesAffiliateStats(player, group)
      : player.affiliateStats[0]?.stats;

    if (!stats) {
      return [];
    }

    if (group === "hitting") {
      if (Number(stats.plateAppearances ?? 0) <= 0) {
        return [];
      }
    } else {
      const [whole, remainder = "0"] = String(
        stats.inningsPitched ?? "0"
      ).split(".");

      const outs = Number(whole) * 3 + Number(remainder);

      if (!Number.isFinite(outs) || outs <= 0) {
        return [];
      }
    }

    return [{
      playerId: player.playerId,
      playerName: player.playerName,
      affiliates: [
        ...new Set(
          player.affiliateStats.map((line) => line.teamName)
        ),
      ],
      stats: getProspectAdvancedStats(stats, group),
    }];
  });
}

export function isVerifiedYankeesCombinedTotal(
  player: ProspectLeaderboardPlayer,
  combined: MinorLeagueStatLine
): boolean {
  const combinedGames = Number(combined.stats.gamesPlayed);

  const affiliateGames = player.affiliateStats.reduce(
    (total, line) => total + Number(line.stats.gamesPlayed),
    0
  );

  if (
    !Number.isFinite(combinedGames) ||
    !Number.isFinite(affiliateGames) ||
    combinedGames <= 0 ||
    combinedGames !== affiliateGames
  ) {
    return false;
  }

  const countingStats = [
    "hits",
    "atBats",
    "homeRuns",
    "strikeOuts",
    "baseOnBalls",
    "runs",
    "totalBases",
    "outs",
  ];

  for (const key of countingStats) {
    const combinedValue = combined.stats[key];

    if (combinedValue === undefined) {
      continue;
    }

    const affiliateValues = player.affiliateStats.map(
      (line) => line.stats[key]
    );

    if (affiliateValues.some((value) => value === undefined)) {
      continue;
    }

    const affiliateTotal = affiliateValues.reduce<number>(
      (total, value) => total + Number(value),
      0
    );

    if (
      !Number.isFinite(Number(combinedValue)) ||
      !Number.isFinite(affiliateTotal) ||
      Number(combinedValue) !== affiliateTotal
    ) {
      return false;
    }
  }

  return true;
}

export function combineYankeesAffiliateStats(
  player: ProspectLeaderboardPlayer,
  group: "hitting" | "pitching"
): Record<string, string | number> {
  const keys = group === "hitting"
    ? [
        "gamesPlayed", "groundOuts", "airOuts", "runs",
        "doubles", "triples", "homeRuns", "strikeOuts",
        "baseOnBalls", "intentionalWalks", "hits",
        "hitByPitch", "atBats", "caughtStealing",
        "stolenBases", "plateAppearances", "rbi",
        "sacBunts", "sacFlies", "totalBases",
        "leftOnBase", "groundIntoDoublePlay",
      ]
    : [
        "gamesPlayed", "gamesStarted", "wins", "losses",
        "saves", "saveOpportunities", "holds", "blownSaves",
        "completeGames", "shutouts", "outs", "earnedRuns",
        "runs", "hits", "doubles", "triples", "homeRuns",
        "baseOnBalls", "intentionalWalks", "strikeOuts",
        "hitBatsmen", "hitByPitch", "wildPitches", "balks",
        "battersFaced", "numberOfPitches", "strikes",
        "inheritedRunners", "inheritedRunnersScored",
      ];

  const combined: Record<string, string | number> = {};

  for (const key of keys) {
    combined[key] = player.affiliateStats.reduce(
      (total, line) => total + Number(line.stats[key] ?? 0),
      0
    );
  }

  const value = (key: string) => Number(combined[key] ?? 0);

  const format = (n: number) => n.toFixed(3);

  if (group === "hitting") {
    const ab = value("atBats");
    const hits = value("hits");
    const walks = value("baseOnBalls");
    const hbp = value("hitByPitch");
    const sf = value("sacFlies");
    const hr = value("homeRuns");
    const so = value("strikeOuts");
    const sb = value("stolenBases");
    const cs = value("caughtStealing");
    const tb = value("totalBases");
    const pa = value("plateAppearances") ||
      ab + walks + hbp + sf;

    const avg = ab > 0 ? hits / ab : 0;
    const obpDenominator = ab + walks + hbp + sf;
    const obp = obpDenominator > 0
      ? (hits + walks + hbp) / obpDenominator
      : 0;
    const slg = ab > 0 ? tb / ab : 0;

    combined.avg = ab > 0 ? format(avg) : "—";
    combined.obp = obpDenominator > 0 ? format(obp) : "—";
    combined.slg = ab > 0 ? format(slg) : "—";
    combined.ops = obpDenominator > 0 && ab > 0
      ? format(obp + slg)
      : "—";
    combined.babip = ab - so - hr + sf > 0
      ? format((hits - hr) / (ab - so - hr + sf))
      : "—";
    combined.stolenBasePercentage = sb + cs > 0
      ? format(sb / (sb + cs))
      : "—";
    combined.plateAppearances = pa;
  } else {
    const outs = value("outs");
    const innings = outs / 3;
    const so = value("strikeOuts");
    const bb = value("baseOnBalls");
    const hr = value("homeRuns");
    const hits = value("hits");
    const er = value("earnedRuns");
    const bf = value("battersFaced");

    combined.inningsPitched =
      `${Math.floor(outs / 3)}.${outs % 3}`;

    combined.era = innings > 0
      ? (er * 9 / innings).toFixed(2)
      : "—";
    combined.whip = innings > 0
      ? ((hits + bb) / innings).toFixed(2)
      : "—";
    combined.strikeoutsPer9Inn = innings > 0
      ? (so * 9 / innings).toFixed(2)
      : "—";
    combined.walksPer9Inn = innings > 0
      ? (bb * 9 / innings).toFixed(2)
      : "—";
    combined.homeRunsPer9 = innings > 0
      ? (hr * 9 / innings).toFixed(2)
      : "—";
    combined.strikeoutWalkRatio = bb > 0
      ? (so / bb).toFixed(2)
      : "—";
    combined.strikePercentage = bf > 0
      ? (so / bf * 100).toFixed(1) + "%"
      : "—";
  }

  return combined;
}
