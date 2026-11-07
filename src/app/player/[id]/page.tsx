import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import PerformanceTabs from "../PerformanceTabs";
type Player = {
  id: number;
  fullName: string;
  active?: boolean;
  primaryNumber?: string;
  currentAge?: number;
  birthDate?: string;
  height?: string;
  weight?: number;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  mlbDebutDate?: string;
  primaryPosition?: {
    name?: string;
    abbreviation?: string;
  };
  batSide?: { description?: string };
  pitchHand?: { description?: string };
  currentTeam?: { name?: string };
};

type StatSplit = {
  season?: string;
  team?: { name?: string };
  stat?: Record<string, string | number>;
};

async function getPlayer(id: string): Promise<Player | null> {
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.people?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getPlayerStats(
  id: string,
  group: "hitting" | "pitching"
): Promise<StatSplit[]> {
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=yearByYear&group=${group}&leagueListId=mlb_hist`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.stats?.[0]?.splits ?? [];
  } catch {
    return [];
  }
}

function display(value: string | number | undefined) {
  return value === undefined || value === "" ? "—" : value;
}

async function PlayerProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromRecords = from === "records";

  if (!/^\d+$/.test(id)) notFound();

  const player = await getPlayer(id);

  if (!player) notFound();

  const isPitcher =
    player.primaryPosition?.abbreviation === "P";

  const group = isPitcher ? "pitching" : "hitting";
  const stats = await getPlayerStats(id, group);

  const columns = isPitcher
    ? [
        { label: "G", key: "gamesPlayed" },
        { label: "GS", key: "gamesStarted" },
        { label: "IP", key: "inningsPitched" },
        { label: "ERA", key: "era" },
        { label: "WHIP", key: "whip" },
        { label: "SO", key: "strikeOuts" },
        { label: "BB", key: "baseOnBalls" },
        { label: "HR", key: "homeRuns" },
      ]
    : [
    { label: "G", key: "gamesPlayed" },
    { label: "PA", key: "plateAppearances" },
    { label: "AB", key: "atBats" },
    { label: "H", key: "hits" },
    { label: "R", key: "runs" },
    { label: "2B", key: "doubles" },
    { label: "3B", key: "triples" },
    { label: "HR", key: "homeRuns" },
    { label: "RBI", key: "rbi" },
    { label: "BB", key: "baseOnBalls" },
    { label: "SO", key: "strikeOuts" },
    { label: "HBP", key: "hitByPitch" },
    { label: "SB", key: "stolenBases" },
    { label: "AVG", key: "avg" },
    { label: "OBP", key: "obp" },
    { label: "SLG", key: "slg" },
    { label: "OPS", key: "ops" },
    { label: "BABIP", key: "babip" },
  ];

  const info = [
    ["Age", player.currentAge],
    [
  "MLB Experience",
  player.mlbDebutDate
    ? `${2026 - Number(player.mlbDebutDate.slice(0, 4)) + 1} MLB seasons`
    : undefined,
],
    ["Position", player.primaryPosition?.name],
    ["Bats", player.batSide?.description],
    ["Throws", player.pitchHand?.description],
    ["Height", player.height],
    ["Weight", player.weight ? `${player.weight} lbs` : undefined],
    [
      "Born",
      player.birthDate
        ? new Date(`${player.birthDate}T12:00:00`).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )
        : undefined,
    ],
    [
      "Birthplace",
      [player.birthCity, player.birthStateProvince, player.birthCountry]
        .filter(Boolean)
        .join(", "),
    ],
    ["MLB Debut", player.mlbDebutDate],
  ];
  const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/w_500,q_90/v1/people/${player.id}/headshot/67/current`;
  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <div className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <Link
            href={fromRecords ? "/history?tab=records" : "/team"}
            className="text-xs font-semibold uppercase tracking-widest text-[#d5b66a] hover:text-white"
          >
            {fromRecords
              ? "← Back to Franchise Records"
              : "← Back to Yankees Roster"}
          </Link>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
                New York Yankees · Player Profile
              </p>

              <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                {player.fullName}
              </h1>

              <p className="mt-3 text-sm text-slate-400">
                {player.primaryPosition?.name ?? "Player"}
                {player.primaryNumber
                  ? ` · #${player.primaryNumber}`
                  : ""}
                {player.currentTeam?.name
                  ? ` · ${player.currentTeam.name}`
                  : ""}
              </p>
            </div>

            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border-2 border-[#d5b66a] bg-[#a09e9e] sm:h-48 sm:w-48">
  <Image
    src={headshotUrl}
    alt={`${player.fullName} headshot`}
    fill
    priority
    sizes="(max-width: 640px) 160px, 192px"
    className="object-contain"
  />
</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-12 lg:px-10">
        <section>
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
              Player Information
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Player Bio
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {info.map(([label, value]) => (
              <div
                key={label}
                className="bg-[#0c1c33] p-5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {display(value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
              Career Performance
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {isPitcher ? "Pitching Statistics" : "Batting Statistics"}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              MLB regular-season statistics by year.
            </p>
          </div>

<PerformanceTabs
  stats={stats}
  isPitcher={isPitcher}
  playerId={player.id}
/>
        </section>

        <p className="border-t border-white/10 pt-6 text-xs text-slate-500">
          Player information and statistics provided by MLB Stats API.
          Data is periodically refreshed.
        </p>
      </div>
    </main>
  );
}
export default function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#07152b] p-10 text-white">
          Loading player profile...
        </main>
      }
    >
      <PlayerProfile params={params} searchParams={searchParams} />
    </Suspense>
  );
}