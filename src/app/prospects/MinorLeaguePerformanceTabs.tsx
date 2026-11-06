"use client";

import { useState } from "react";
import type { MinorLeagueStatLine } from "@/lib/minorLeagueStats";
import MinorLeagueStatsTable from "./MinorLeagueStatsTable";
import MinorLeagueAdvancedTable from "./MinorLeagueAdvancedTable";

type Props = {
  stats: MinorLeagueStatLine[];
  careerStats: Record<string, string | number> | null;
  isPitcher: boolean;
};

export default function MinorLeaguePerformanceTabs({
  stats,
  careerStats,
  isPitcher,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "traditional" | "advanced"
  >("traditional");

  const [selectedSeason, setSelectedSeason] = useState("all");

  const seasons = Array.from(
    new Set(stats.map((line) => line.season))
  ).sort((a, b) => Number(b) - Number(a));

  const filteredStats =
    selectedSeason === "all"
      ? stats
      : stats.filter((line) => line.season === selectedSeason);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1d36] p-6">
      <h2 className="text-xl font-bold text-white">
        Minor League Performance
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Season-by-season statistics across the minor leagues.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label
          htmlFor="prospect-season"
          className="text-xs font-semibold uppercase tracking-wider text-[#d5b66a]"
        >
          Season
        </label>

        <select
          id="prospect-season"
          value={selectedSeason}
          onChange={(event) => setSelectedSeason(event.target.value)}
          className="rounded-lg border border-white/15 bg-[#142a47] px-4 py-2.5 text-sm text-white"
        >
          <option value="all">All Seasons</option>
          {seasons.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
      </div>

      <div
        role="tablist"
        aria-label="Minor league statistics"
        className="mt-6 flex gap-2 border-b border-white/10 pb-4"
      >
        {(["traditional", "advanced"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-[#d5b66a] text-[#07152b]"
                : "bg-[#142a47] text-slate-300 hover:text-white"
            }`}
          >
            {tab === "traditional" ? "Traditional" : "Advanced"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "traditional" ? (
          <MinorLeagueStatsTable
            stats={filteredStats}
            careerStats={careerStats}
            isPitcher={isPitcher}
          />
        ) : (
          <MinorLeagueAdvancedTable
            stats={filteredStats}
            careerStats={careerStats}
            isPitcher={isPitcher}
          />
        )}
      </div>
    </div>
  );
}
