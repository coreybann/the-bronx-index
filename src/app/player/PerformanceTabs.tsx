
"use client";

import { useEffect, useState } from "react";

type StatSplit = {
  season?: string;
  team?: { name?: string };
  stat?: Record<string, string | number>;
};

type Props = {
  stats: StatSplit[];
  isPitcher: boolean;
  playerId: number;
};
type PitchMetric = {
  pitchType: string;
  pitches: number;
  averageVelocity: number | null;
  averageSpinRate: number | null;
  horizontalMovement: number | null;
  verticalMovement: number | null;
};

type PitchMetricsResponse = {
  playerId: number;
  season: string;
  sampleOnly: boolean;
  totalPitches: number;
  pitchMetrics: PitchMetric[];
};

type StatcastData = {
  season: string;
  pitchArsenal?: {
  pitchType: string;
  runValuePer100: number | null;
  runValue: number | null;
  pitches: number | null;
  usagePercentage: number | null;
  plateAppearances: number | null;
  battingAverage: number | null;
  slugging: number | null;
  wOBA: number | null;
  whiffPercentage: number | null;
  strikeoutPercentage: number | null;
  putAwayPercentage: number | null;
  expectedBA: number | null;
  expectedSLG: number | null;
  expectedwOBA: number | null;
  hardHitPercentage: number | null;
}[];
  percentileRankings?: Record<string, number | null>;
  statistics: {
    // Hitter metrics
    expectedBattingAverage?: number | null;
    expectedSlugging?: number | null;
    wOBA?: number | null;
    expectedwOBA?: number | null;

    // Shared contact metrics
    barrelPercentage?: number | null;
    averageExitVelocity?: number | null;
    maximumExitVelocity?: number | null;
    launchAngle?: number | null;
    sweetSpotPercentage?: number | null;
    hardHitPercentage?: number | null;
    strikeoutPercentage?: number | null;
    walkPercentage?: number | null;

    // Pitcher metrics
    expectedBattingAverageAgainst?: number | null;
    expectedSluggingAgainst?: number | null;
    wOBAAgainst?: number | null;
    expectedwOBAAgainst?: number | null;
    expectedwOBAcon?: number | null;
    era?: number | null;
    expectedERA?: number | null;
  };
};
function getAdvancedValue(
  stat: Record<string, string | number> | undefined,
  key: string
): string {
  if (!stat) return "—";

  const number = (field: string) =>
    Number(stat[field] ?? 0);

  switch (key) {
    case "k9":
  return String(stat.strikeoutsPer9Inn ?? "—");

case "bb9":
  return String(stat.walksPer9Inn ?? "—");

case "hr9":
  return String(stat.homeRunsPer9 ?? "—");

case "kbb":
  return String(stat.strikeoutWalkRatio ?? "—");

case "h9":
  return String(stat.hitsPer9Inn ?? "—");
    case "babip":
      return String(stat.babip ?? "—");

    case "iso":
      return (number("slg") - number("avg")).toFixed(3).replace(/^0/, "");

    case "bbRate":
      return number("plateAppearances") > 0
        ? `${((number("baseOnBalls") / number("plateAppearances")) * 100).toFixed(1)}%`
        : "—";

    case "kRate":
      return number("plateAppearances") > 0
        ? `${((number("strikeOuts") / number("plateAppearances")) * 100).toFixed(1)}%`
        : "—";

    case "abPerHr":
      return number("homeRuns") > 0
        ? number("atBatsPerHomeRun").toFixed(1)
        : "—";

    case "goAo":
      return String(stat.groundOutsToAirouts ?? "—");

    default:
      return "—";
  }
}
export default function PerformanceTabs({
  stats,
  isPitcher,
  playerId,
}: Props) {
  const [activeTab, setActiveTab] = useState<
  "traditional" | "advanced" | "statcast"
>("traditional");
const [statcastSubTab, setStatcastSubTab] = useState<
  "overview" | "arsenal" | "percentiles"
>("overview");
const [statcast, setStatcast] = useState<StatcastData | null>(null);
const [statcastLoading, setStatcastLoading] = useState(false);
const [pitchMetrics, setPitchMetrics] =
  useState<PitchMetricsResponse | null>(null);
const [pitchMetricsLoading, setPitchMetricsLoading] = useState(false);


const latestSeason = stats.length
  ? stats[stats.length - 1].season
  : undefined;

useEffect(() => {
  if (!latestSeason) {
    setStatcast(null);
    return;
  }

  const controller = new AbortController();

  async function fetchStatcast() {
    setStatcastLoading(true);

    try {
      const response = await fetch(
        `/api/statcast?playerId=${playerId}&season=${latestSeason}&group=${isPitcher ? "pitching" : "hitting"}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        setStatcast(null);
        return;
      }

      const data: StatcastData = await response.json();
      setStatcast(data);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setStatcast(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setStatcastLoading(false);
      }
    }
  }

  fetchStatcast();

  return () => controller.abort();
}, [playerId, isPitcher, latestSeason]);

useEffect(() => {
  if (!isPitcher || !latestSeason) {
    return;
  }

  const controller = new AbortController();

  async function fetchPitchMetrics() {
    setPitchMetrics(null);
    setPitchMetricsLoading(true);

    try {
      const response = await fetch(
        `/api/pitch-metrics?playerId=${playerId}&season=${latestSeason}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        setPitchMetrics(null);
        return;
      }

      const data: PitchMetricsResponse = await response.json();

      if (!data.sampleOnly && Array.isArray(data.pitchMetrics)) {
        setPitchMetrics(data);
      } else {
        setPitchMetrics(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setPitchMetrics(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setPitchMetricsLoading(false);
      }
    }
  }

  fetchPitchMetrics();

  return () => controller.abort();
}, [playerId, isPitcher, latestSeason]);


  const traditionalColumns = isPitcher
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
      ];

  const advancedColumns = isPitcher
  ? [
      { label: "K/9", key: "k9" },
      { label: "BB/9", key: "bb9" },
      { label: "HR/9", key: "hr9" },
      { label: "K/BB", key: "kbb" },
      { label: "H/9", key: "h9" },
      { label: "GO/AO", key: "goAo" },
    ]
  : [
      { label: "BABIP", key: "babip" },
      { label: "ISO", key: "iso" },
      { label: "BB%", key: "bbRate" },
      { label: "K%", key: "kRate" },
      { label: "AB/HR", key: "abPerHr" },
      { label: "GO/AO", key: "goAo" },
    ];

  const columns =
    activeTab === "traditional"
      ? traditionalColumns
      : advancedColumns;

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("traditional")}
          className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === "traditional"
              ? "border-[#d5b66a] text-[#d5b66a]"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Traditional
        </button>

        <button
          onClick={() => setActiveTab("advanced")}
          className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === "advanced"
              ? "border-[#d5b66a] text-[#d5b66a]"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Advanced
        </button>
        <button
  onClick={() => setActiveTab("statcast")}
  className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
    activeTab === "statcast"
      ? "border-[#d5b66a] text-[#d5b66a]"
      : "border-transparent text-slate-400 hover:text-white"
  }`}
>
  Statcast
</button>
      </div>

      {activeTab !== "statcast" && (stats.length === 0 ? (
        <div className="border border-white/10 bg-[#0c1c33] p-8 text-sm text-slate-400">
          No MLB season statistics are currently available.
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10 bg-[#0c1c33]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-5 py-4">Season</th>
                <th className="px-5 py-4">Team</th>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-4">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {stats.map((split, index) => (
                <tr
                  key={`${split.season}-${index}`}
                  className="border-b border-white/5 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4 font-bold text-[#d5b66a]">
                    {split.season ?? "—"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">
                    {split.team?.name ?? "—"}
                  </td>

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-4 text-xs text-slate-300"
                    >
                      {activeTab === "advanced"
  ? getAdvancedValue(split.stat, column.key)
  : split.stat?.[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {activeTab === "statcast" && (
  <div className="mt-10 space-y-8">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
        Baseball Savant
      </p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Expected Statistics & Quality of Contact
      </h3>
      <p className="mt-2 text-xs text-slate-500">
        Statcast measurements for the {latestSeason} season.
      </p>
    </div>
<div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
  {[
    { id: "overview", label: "Overview" },
    ...(isPitcher
      ? [{ id: "arsenal", label: "Pitch Arsenal" }]
      : []),
    { id: "percentiles", label: "Percentiles" },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() =>
        setStatcastSubTab(
          tab.id as "overview" | "arsenal" | "percentiles"
        )
      }
      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
        statcastSubTab === tab.id
          ? "border-b-2 border-[#d5b66a] text-[#d5b66a]"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
    {statcastLoading ? (
      <p className="text-sm text-slate-400">
        Loading Statcast statistics...
      </p>
    ) : statcast ? (
  isPitcher ? (
    <div className="space-y-8">
      {statcastSubTab === "overview" && (
  <>
      <div>
        <h4 className="mb-4 text-sm font-bold text-white">
          Expected Performance
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["ERA", statcast.statistics.era, 2],
            ["xERA", statcast.statistics.expectedERA, 2],
            ["xBA Against", statcast.statistics.expectedBattingAverageAgainst, 3],
            ["xSLG Against", statcast.statistics.expectedSluggingAgainst, 3],
            ["wOBA Against", statcast.statistics.wOBAAgainst, 3],
            ["xwOBA Against", statcast.statistics.expectedwOBAAgainst, 3],
          ].map(([label, value, decimals]) => (
            <div key={String(label)} className="border border-white/10 bg-[#0c1c33] p-4">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-xl font-bold text-white">
                {value == null
                  ? "—"
                  : Number(value).toFixed(Number(decimals))}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-bold text-white">
          Quality of Contact Allowed
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Barrel%", statcast.statistics.barrelPercentage, "%"],
            ["Hard-Hit%", statcast.statistics.hardHitPercentage, "%"],
            ["Average EV", statcast.statistics.averageExitVelocity, " mph"],
            ["Maximum EV", statcast.statistics.maximumExitVelocity, " mph"],
          ].map(([label, value, unit]) => (
            <div key={String(label)} className="border border-white/10 bg-[#0c1c33] p-4">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-xl font-bold text-white">
                {value == null ? "—" : `${value}${unit}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-bold text-white">
          Pitching Discipline
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Strikeout%", statcast.statistics.strikeoutPercentage],
            ["Walk%", statcast.statistics.walkPercentage],
          ].map(([label, value]) => (
            <div key={String(label)} className="border border-white/10 bg-[#0c1c33] p-4">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-xl font-bold text-white">
                {value == null ? "—" : `${value}%`}
              </p>
            </div>
          ))}
        </div>
      </div>
        </>
)}
{statcastSubTab === "arsenal" && (
  <>
            <div className="mb-5">
  <h4 className="text-sm font-bold text-white">
    Pitch Arsenal Breakdown
  </h4>
  <p className="mt-2 text-xs text-slate-500">
    Pitch usage and performance by pitch type for the {latestSeason} season.
  </p>
</div>

{statcast.pitchArsenal && statcast.pitchArsenal.length > 0 ? (
  <div className="space-y-4">
    {statcast.pitchArsenal
      .slice()
      .sort(
        (a, b) =>
          (b.usagePercentage ?? 0) -
          (a.usagePercentage ?? 0)
      )
      .map((pitch) => {
        const metrics = pitchMetrics?.pitchMetrics.find(
          (item) =>
            item.pitchType === pitch.pitchType ||
            item.pitchType === ({
              "4-Seam Fastball": "FF",
              "Sinker": "SI",
              "Cutter": "FC",
              "Slider": "SL",
              "Sweeper": "ST",
              "Curveball": "CU",
              "Changeup": "CH",
              "Split-Finger": "FS",
              "Knuckle Curve": "KC",
            } as Record<string, string>)[pitch.pitchType]
        );

        return (
        <div
          key={pitch.pitchType}
          className="border border-white/10 bg-[#0c1c33] p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h5 className="text-base font-bold text-white">
              {pitch.pitchType}
            </h5>
            <span className="text-sm font-bold text-[#d5b66a]">
              {pitch.usagePercentage ?? "—"}% Usage
            </span>
          </div>

          <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-blue-400"
              style={{
                width: `${Math.min(100, Math.max(0, pitch.usagePercentage ?? 0))}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["Pitches", pitch.pitches, 0],
              ["Run Value", pitch.runValue, 0],
              ["RV/100", pitch.runValuePer100, 1],
              ["Whiff%", pitch.whiffPercentage, 1],
              ["K%", pitch.strikeoutPercentage, 1],
              ["BA Allowed", pitch.battingAverage, 3],
              ["xwOBA", pitch.expectedwOBA, 3],
            ].map(([label, value, decimals]) => (
              <div key={String(label)}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {value == null
                    ? "—"
                    : Number(value)
                        .toFixed(Number(decimals))
                        .replace(/^0\./, ".")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs font-bold text-[#d5b66a]">
              Pitch Characteristics
            </p>

            {pitchMetricsLoading ? (
              <p className="text-xs text-slate-400">
                Loading pitch measurements...
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["Velocity", metrics?.averageVelocity, " mph", 1],
                  ["Spin Rate", metrics?.averageSpinRate, " rpm", 0],
                  ["Horizontal Break", metrics?.horizontalMovement, " in", 1],
                  ["Vertical Break", metrics?.verticalMovement, " in", 1],
                ].map(([label, value, unit, decimals]) => (
                  <div key={String(label)}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {value == null
                        ? "—"
                        : `${Number(value).toFixed(Number(decimals))}${unit}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        );
      })}
  </div>
) : (
  <p className="text-sm text-slate-400">
    Pitch arsenal data is unavailable for this season.
  </p>
)}
  </>
)}
{statcastSubTab === "percentiles" && (
  <div>
  <div className="mb-5">
    <h4 className="text-sm font-bold text-white">
      Baseball Savant Percentile Rankings
    </h4>
    <p className="mt-2 text-xs text-slate-500">
      How this pitcher compares with other MLB pitchers.
      Higher percentiles indicate better performance.
    </p>
  </div>

        {[
          {
            title: "Overall & Pitch Arsenal",
            metrics: [
              ["Pitching Run Value", "pitching"],
              ["Fastball Run Value", "fastball"],
              ["Breaking Ball Run Value", "breaking"],
              ["Offspeed Run Value", "offSpeed"],
            ],
          },
          {
            title: "Pitch Characteristics",
            metrics: [
              ["Fastball Velocity", "fastballMPH"],
              ["Fastball Spin", "fastballSpin"],
              ["Curveball Spin", "curveSpin"],
              ["Extension", "extension"],
            ],
          },
          {
            title: "Pitching Performance",
            metrics: [
              ["xERA", "xERA"],
              ["Average Exit Velocity", "averageExitVelocity"],
              ["Ground Ball%", "groundBall"],
            ],
          },
          {
            title: "Plate Discipline",
            metrics: [
              ["Chase%", "chase"],
              ["Whiff%", "whiff"],
              ["Strikeout%", "strikeout"],
              ["Walk%", "walk"],
            ],
          },
          {
            title: "Contact Management",
            metrics: [
              ["Barrel%", "barrel"],
              ["Hard-Hit%", "hardHit"],
            ],
          },
        ].map((group) => (
          <div key={group.title} className="mb-7">
            <h5 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {group.title}
            </h5>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.metrics.map(([label, key]) => {
                const value =
                  statcast.percentileRankings?.[key] ?? null;

                const barColor =
                  value === null
                    ? "bg-slate-600"
                    : value >= 75
                    ? "bg-emerald-500"
                    : value >= 50
                    ? "bg-blue-400"
                    : value >= 25
                    ? "bg-amber-400"
                    : "bg-red-400";

                return (
                  <div
                    key={key}
                    className="border border-white/10 bg-[#0c1c33] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        {label}
                      </span>

                      <span className="text-sm font-bold text-white">
                        {value === null ? "—" : `${value}th`}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{
                          width: `${value ?? 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    )}
          </div>
  ) : (
    <>
        <div>
          <h4 className="mb-4 text-sm font-bold text-white">
            Expected Statistics
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["xBA", statcast.statistics.expectedBattingAverage],
              ["xSLG", statcast.statistics.expectedSlugging],
              ["wOBA", statcast.statistics.wOBA],
              ["xwOBA", statcast.statistics.expectedwOBA],
            ].map(([label, value]) => (
              <div key={String(label)} className="border border-white/10 bg-[#0c1c33] p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  {value == null ? "—" : Number(value).toFixed(3).replace(/^0/, "")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold text-white">
            Quality of Contact
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Barrel%", statcast.statistics.barrelPercentage, "%"],
              ["Hard-Hit%", statcast.statistics.hardHitPercentage, "%"],
              ["Average EV", statcast.statistics.averageExitVelocity, " mph"],
              ["Maximum EV", statcast.statistics.maximumExitVelocity, " mph"],
              ["Launch Angle", statcast.statistics.launchAngle, "°"],
              ["Sweet-Spot%", statcast.statistics.sweetSpotPercentage, "%"],
            ].map(([label, value, unit]) => (
              <div key={String(label)} className="border border-white/10 bg-[#0c1c33] p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  {value == null ? "—" : `${value}${unit}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold text-white">
            Plate Discipline
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Strikeout%", statcast.statistics.strikeoutPercentage],
              ["Walk%", statcast.statistics.walkPercentage],
            ].map(([label, value]) => (
              <div key={String(label)} className="border border-white/10 bg-[#0c1c33] p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  {value == null ? "—" : `${value}%`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </> 
        )) : (
        <p className="border border-white/10 bg-[#0c1c33] p-5 text-sm text-slate-400">
        Statcast statistics are unavailable for this player and season.
      </p>
    )}
  </div>
)}
    </div>
  );
}
