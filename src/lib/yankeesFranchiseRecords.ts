import recordsData from "@/data/yankees-franchise-season-records.json";
import careerData from "@/data/yankees-franchise-career-records.json";

export type FranchiseStatGroup = "hitting" | "pitching";

export type FranchiseRecordCategory =
  | "homeRuns"
  | "hits"
  | "rbi"
  | "stolenBases"
  | "wins"
  | "strikeouts"
  | "saves";

export type FranchiseRecord = {
  rank: number;
  playerId: number;
  player: string;
  season: number;
  value: number;
};

export const FRANCHISE_RECORD_CATEGORIES = {
  hitting: [
    { id: "homeRuns", label: "Home Runs" },
    { id: "hits", label: "Hits" },
    { id: "rbi", label: "RBIs" },
    { id: "stolenBases", label: "Stolen Bases" },
  ],
  pitching: [
    { id: "wins", label: "Wins" },
    { id: "strikeouts", label: "Strikeouts" },
    { id: "saves", label: "Saves" },
  ],
} as const;

type RawRecord = {
  playerId: number;
  player: string;
  season: number;
  value: string | number;
};

const records = recordsData.categories as Record<
  string,
  RawRecord[]
>;

export function getYankeesSingleSeasonLeaders(
  group: FranchiseStatGroup,
  category: FranchiseRecordCategory,
  limit = 25
): FranchiseRecord[] {
  const key = `${group}.${category}`;
  const entries = records[key] ?? [];

  const sorted = entries
    .map((record) => ({
      playerId: record.playerId,
      player: record.player,
      season: record.season,
      value: Number(record.value),
    }))
    .filter((record) => Number.isFinite(record.value))
    .sort(
      (a, b) =>
        b.value - a.value ||
        a.season - b.season ||
        a.player.localeCompare(b.player)
    );

  let previousValue: number | null = null;
  let previousRank = 0;

  const ranked = sorted.map((record, index) => {
    const rank =
      previousValue === record.value
        ? previousRank
        : index + 1;

    previousValue = record.value;
    previousRank = rank;

    return { ...record, rank };
  });

  if (limit <= 0) return [];

  const cutoff = ranked[Math.min(limit, ranked.length) - 1]?.value;

  return ranked.filter(
    (record, index) =>
      index < limit || record.value === cutoff
  );
}


export type FranchiseCareerRecord = {
  rank: number;
  playerId: number;
  player: string;
  value: number;
};

const careerRecords = careerData.categories as Record<
  string,
  {
    playerId: number;
    player: string;
    value: string | number;
  }[]
>;

export function getYankeesCareerLeaders(
  group: FranchiseStatGroup,
  category: FranchiseRecordCategory,
  limit = 25
): FranchiseCareerRecord[] {
  const key = `${group}.${category}`;
  const entries = careerRecords[key] ?? [];

  const sorted = entries
    .map((record) => ({
      playerId: record.playerId,
      player: record.player,
      value: Number(record.value),
    }))
    .filter((record) => Number.isFinite(record.value))
    .sort(
      (a, b) =>
        b.value - a.value ||
        a.player.localeCompare(b.player)
    );

  let previousValue: number | null = null;
  let previousRank = 0;

  const ranked = sorted.map((record, index) => {
    const rank =
      previousValue === record.value
        ? previousRank
        : index + 1;

    previousValue = record.value;
    previousRank = rank;

    return { ...record, rank };
  });

  if (limit <= 0) return [];

  const cutoff = ranked[Math.min(limit, ranked.length) - 1]?.value;

  return ranked.filter(
    (record, index) =>
      index < limit || record.value === cutoff
  );
}
