"use client";

import { useEffect, useState } from "react";

type StatGroup = "hitting" | "pitching";

type TeamStatsResponse = {
  season: number;
  group: StatGroup;
  stats: Record<string, string | number | null>;
};

const STAT_FIELDS = {
  hitting: [
    ["runs", "Runs Scored"],
    ["hits", "Hits"],
    ["homeRuns", "Home Runs"],
    ["avg", "Batting Average"],
    ["obp", "On-Base Percentage"],
    ["slg", "Slugging Percentage"],
    ["ops", "OPS"],
    ["baseOnBalls", "Walks"],
    ["strikeOuts", "Strikeouts"],
    ["stolenBases", "Stolen Bases"],
  ],
  pitching: [
    ["era", "Team ERA"],
    ["whip", "WHIP"],
    ["strikeOuts", "Strikeouts"],
    ["baseOnBalls", "Walks Allowed"],
    ["homeRuns", "Home Runs Allowed"],
    ["saves", "Saves"],
    ["inningsPitched", "Innings Pitched"],
  ],
} as const;

function StatSection({
  season,
  group,
}: {
  season: number;
  group: StatGroup;
}) {
  const [data, setData] = useState<TeamStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      try {
        const response = await fetch(
          `/api/historical-team-stats?season=${season}&group=${group}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Statistics unavailable for this season.");
        }

        const result: TeamStatsResponse = await response.json();

        if (!controller.signal.aborted) {
          setData(result);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load statistics."
        );
        setLoading(false);
      }
    }

    loadStats();

    return () => controller.abort();
  }, [season, group]);

  const title = group === "hitting" ? "Team Batting" : "Team Pitching";

  return (
    <section className="rounded-xl border border-white/10 bg-[#0b1d36] p-6">
      <h3 className="text-xl font-bold text-white">{title}</h3>

      <p className="mt-2 text-sm text-slate-400">
        {season} New York Yankees
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">
          Loading statistics...
        </p>
      ) : error ? (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {error}
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_FIELDS[group].map(([key, label]) => {
            const value = data?.stats[key];

            return (
              <div
                key={key}
                className="rounded-lg border border-white/10 bg-[#07152b] p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-black text-[#d5b66a]">
                  {value === null || value === undefined
                    ? "—"
                    : typeof value === "number"
                      ? value.toLocaleString("en-US")
                      : value}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function HistoricalTeamStats({
  season,
}: {
  season: number;
}) {
  return (
    <div className="mt-10 grid gap-6">
      <StatSection key={`${season}-hitting`} season={season} group="hitting" />
      <StatSection key={`${season}-pitching`} season={season} group="pitching" />
    </div>
  );
}
