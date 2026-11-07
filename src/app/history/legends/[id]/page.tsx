import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import legends from "@/data/yankees-legends.json";
import managerialHistory from "@/data/yankees-legend-managerial.json";
import { getYankeesLegendAwards } from "@/lib/yankeesLegendAwards";
import legendChampionships from "@/data/yankees-legend-championships.json";
import {
  getLegendHittingCareer,
  getLegendPitchingCareer,
} from "@/lib/yankeesLegendCareer";
import {
  getYankeesLegendStats,
  type LegendStat,
} from "@/lib/yankeesLegendStats";

type Player = {
  id: number;
  fullName: string;
  birthDate?: string;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  batSide?: { description?: string };
  pitchHand?: { description?: string };
};

async function getPlayer(id: number): Promise<Player | null> {
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.people?.[0] ?? null;
  } catch {
    return null;
  }
}

function display(value: string | number | undefined) {
  return value === undefined || value === ""
    ? "—"
    : String(value);
}

async function LegendProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const legend = legends.find(
    (player) => String(player.id) === id
  );

  if (!legend) notFound();

  const championshipYears =
    legendChampionships[
      String(legend.id) as keyof typeof legendChampionships
    ] ?? [];

  const managerialRecord =
    managerialHistory[
      String(legend.id) as keyof typeof managerialHistory
    ];

  const isManager = legend.profileType === "managerial";
  const isPitcher = legend.profileType === "pitching";
  const group = isPitcher ? "pitching" : "hitting";

  const [player, stats, awards] = await Promise.all([
    getPlayer(legend.id),
    getYankeesLegendStats(legend.id, group),
    getYankeesLegendAwards(legend.id),
  ]);

  const career = isPitcher
    ? getLegendPitchingCareer(stats)
    : getLegendHittingCareer(stats);

  const careerCards: [string, string | number][] = isPitcher
    ? [
        ["Games", career.games],
        ["Wins", "wins" in career ? career.wins : "—"],
        ["Saves", "saves" in career ? career.saves : "—"],
        ["Strikeouts", "strikeouts" in career ? career.strikeouts : "—"],
        ["Innings Pitched", "inningsPitched" in career ? career.inningsPitched : "—"],
        ["ERA", "era" in career ? career.era : "—"],
        ["WHIP", "whip" in career ? career.whip : "—"],
      ]
    : [
        ["Games", career.games],
        ["Hits", "hits" in career ? career.hits : "—"],
        ["Home Runs", "homeRuns" in career ? career.homeRuns : "—"],
        ["RBI", "rbi" in career ? career.rbi : "—"],
        ["Runs", "runs" in career ? career.runs : "—"],
        ["Walks", "walks" in career ? career.walks : "—"],
        ["AVG", "avg" in career ? career.avg.replace(/^0/, "") : "—"],
        ["SLG", "slg" in career ? career.slg.replace(/^0/, "") : "—"],
      ];

  const columns = isPitcher
    ? [
        ["G", "gamesPlayed"],
        ["GS", "gamesStarted"],
        ["IP", "inningsPitched"],
        ["W", "wins"],
        ["L", "losses"],
        ["SV", "saves"],
        ["ERA", "era"],
        ["WHIP", "whip"],
        ["SO", "strikeOuts"],
        ["BB", "baseOnBalls"],
      ]
    : [
        ["G", "gamesPlayed"],
        ["PA", "plateAppearances"],
        ["AB", "atBats"],
        ["H", "hits"],
        ["HR", "homeRuns"],
        ["RBI", "rbi"],
        ["R", "runs"],
        ["BB", "baseOnBalls"],
        ["SO", "strikeOuts"],
        ["AVG", "avg"],
        ["OBP", "obp"],
        ["SLG", "slg"],
        ["OPS", "ops"],
      ];

  const bio = [
    ["Retired Number", `No. ${legend.retiredNumber}`],
    ["Role", legend.role],
    ["Position", legend.position],
    ["Yankees Debut", isManager ? undefined : legend.startYear],
    [isManager ? "Final Managerial Season" : "Final Yankees Season", legend.endYear],
    ["Bats", player?.batSide?.description],
    ["Throws", player?.pitchHand?.description],
    ["Height", player?.height],
    [
      "Weight",
      player?.weight ? `${player.weight} lbs` : undefined,
    ],
    [
      "Born",
      player?.birthDate
        ? new Date(`${player.birthDate}T12:00:00`).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )
        : undefined,
    ],
    [
      "Birthplace",
      [
        player?.birthCity,
        player?.birthStateProvince,
        player?.birthCountry,
      ]
        .filter(Boolean)
        .join(", "),
    ],
  ];

  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <header className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <Link
            href="/history"
            className="text-xs font-semibold uppercase tracking-widest text-[#d5b66a] hover:text-white"
          >
            ← Back to Yankees History
          </Link>

          <p className="mt-10 text-xs font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
            The Bronx Index · Yankees Legends
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            {player?.fullName ?? legend.name}
          </h1>

          <p className="mt-4 text-sm text-slate-400">
            {legend.position} · New York Yankees ·{" "}
            {legend.startYear}–{legend.endYear}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-12 lg:px-10">
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
            Player Information
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {isManager ? "Historical Bio" : "Historical Player Bio"}
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-4">
            {bio.map(([label, value]) => (
              <div
                key={label}
                className={`bg-[#0c1c33] p-5 ${
                  label === "Birthplace"
                    ? "col-span-2 sm:col-span-1 lg:col-span-4"
                    : ""
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {label}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {display(value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {!isManager && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
            Career Overview
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Yankees Career Statistics
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Regular-season totals with the New York Yankees only.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {careerCards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-[#0c1c33] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-black text-[#d5b66a]">
                  {typeof value === "number"
                    ? value.toLocaleString("en-US")
                    : value}
                </p>
              </div>
            ))}
          </div>
        </section>
        )}

        {managerialRecord && (
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
              Yankees Managerial Career
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Managerial History
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Managerial service and World Series titles with the New York Yankees.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0c1c33] p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  World Series Titles as Manager
                </p>
                <p className="mt-3 text-3xl font-black text-[#d5b66a]">
                  {managerialRecord.worldSeriesTitles.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0c1c33] p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Managerial Stints
                </p>
                <p className="mt-3 text-3xl font-black text-[#d5b66a]">
                  {managerialRecord.managerialStints.length}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-[#0c1c33] p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#d5b66a]">
                Yankees Managerial Tenure
              </h3>

              <div className="mt-4 flex flex-wrap gap-3">
                {managerialRecord.managerialStints.map((stint, index) => (
                  <span
                    key={`${stint[0]}-${stint[1]}-${index}`}
                    className="border border-white/10 bg-[#07152b] px-4 py-3 text-sm font-semibold"
                  >
                    {stint[0] === stint[1]
                      ? stint[0]
                      : `${stint[0]}–${stint[1]}`}
                  </span>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-[#d5b66a]">
                World Series Titles as Manager
              </h3>

              <div className="mt-4 flex flex-wrap gap-3">
                {managerialRecord.worldSeriesTitles.map((year) => (
                  <span
                    key={year}
                    className="border border-[#d5b66a]/30 bg-[#12243a] px-4 py-3 text-sm font-bold text-[#d5b66a]"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {!isManager && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
            Championship Legacy
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            World Series Championships
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            World Series titles won as a participating Yankees player.
          </p>

          <div className="mt-6 rounded-xl border border-[#d5b66a]/30 bg-[#0c1c33] p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-5xl font-black text-[#d5b66a]">
                  {championshipYears.length}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  World Series Titles
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {championshipYears.map((year) => (
                  <Link
                    key={year}
                    href="/history"
                    className="rounded-lg border border-[#d5b66a]/30 bg-[#12243a] px-4 py-3 text-sm font-bold text-[#d5b66a] transition hover:border-[#d5b66a] hover:bg-[#1b304a]"
                  >
                    {year}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        )}

        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
            Individual Recognition
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Awards & Achievements
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Individual honors and recognition recorded by MLB.
          </p>

          <div className="mt-6 space-y-8">
            {(
              [
                "Major Awards",
                "All-Star Selections",
                "Postseason Honors",
                "Hall of Fame",
                "Yankees Honors",
                "Other Recognition",
              ] as const
            ).map((category) => {
              const categoryAwards = awards.filter(
                (award) => award.category === category
              );

              if (categoryAwards.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#d5b66a]">
                    {category}
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryAwards.map((award, index) => (
                      <div
                        key={`${award.name}-${award.season}-${award.date}-${index}`}
                        className="border border-white/10 bg-[#0c1c33] p-5"
                      >
                        <p className="font-bold text-white">
                          {award.name}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {award.season ?? "Year unavailable"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {awards.length === 0 && (
            <p className="mt-6 border border-white/10 bg-[#0c1c33] p-6 text-sm text-slate-400">
              Historical award records are currently unavailable.
            </p>
          )}
        </section>

        {!isManager && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
            Yankees Career Performance
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Season-by-Season Statistics
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Regular-season statistics with the New York Yankees only.
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-[#12243a] text-xs uppercase text-[#d5b66a]">
                <tr>
                  <th className="px-4 py-4">Season</th>
                  {columns.map(([label]) => (
                    <th key={label} className="px-4 py-4">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {stats.map((season: LegendStat) => (
                  <tr
                    key={season.season}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-4 font-semibold text-[#d5b66a]">
                      {season.season}
                    </td>

                    {columns.map(([label, key]) => (
                      <td key={label} className="px-4 py-4">
                        {display(season.stat[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {stats.length === 0 && (
              <p className="p-6 text-sm text-slate-400">
                Historical season statistics are currently unavailable.
              </p>
            )}
          </div>
        </section>
        )}

        <p className="border-t border-white/10 pt-6 text-xs text-slate-500">
          Historical player information and regular-season statistics
          provided by MLB Stats API. Statistics are filtered to
          New York Yankees seasons.
        </p>
      </div>
    </main>
  );
}


export default function LegendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#07152b] p-10 text-white">
          Loading Yankees legend profile...
        </main>
      }
    >
      <LegendProfile params={params} />
    </Suspense>
  );
}
