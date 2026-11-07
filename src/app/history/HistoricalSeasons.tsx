"use client";

import { useEffect, useState } from "react";
import HistoricalTeamStats from "./HistoricalTeamStats";
import HistoricalSeasonLeaders from "./HistoricalSeasonLeaders";
import HistoricalRosters from "./HistoricalRosters";
import HistoricalPostseason from "./HistoricalPostseason";

type SeasonData = {
  season: number;
  wins: number | null;
  losses: number | null;
  winningPercentage: string | null;
  leagueRank: string | null;
  divisionRank: string | null;
};

const SEASONS = Array.from(
  { length: 2026 - 1903 + 1 },
  (_, index) => 2026 - index
);

function formatRank(rank: string | null): string {
  if (!rank) return "N/A";

  const number = Number(rank);

  if (!Number.isInteger(number) || number <= 0) return rank;

  const suffix =
    number % 100 >= 11 && number % 100 <= 13
      ? "th"
      : number % 10 === 1
        ? "st"
        : number % 10 === 2
          ? "nd"
          : number % 10 === 3
            ? "rd"
            : "th";

  return `${number}${suffix}`;
}

export default function HistoricalSeasons() {
  const [season, setSeason] = useState(2026);
  const [data, setData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSeason() {
      try {
        const response = await fetch(
          `/api/historical-seasons?season=${season}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Historical standings are unavailable for this season."
              : "Unable to load historical season data."
          );
        }

        const result: SeasonData = await response.json();

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
            : "Unable to load historical season data."
        );
        setLoading(false);
      }
    }

    loadSeason();

    return () => controller.abort();
  }, [season]);

  const stats = data
    ? [
        { label: "Wins", value: data.wins ?? "—" },
        { label: "Losses", value: data.losses ?? "—" },
        {
          label: "Winning Percentage",
          value: data.winningPercentage ?? "—",
        },
        {
          label: "American League Finish",
          value: formatRank(data.leagueRank),
        },
        ...(data.season >= 1969
          ? [
              {
                label: "Division Finish",
                value: formatRank(data.divisionRank),
              },
            ]
          : []),
      ]
    : [];

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
        Yankees History / Season Explorer
      </p>

      <h2 className="mt-4 text-3xl font-black text-white">
        Historical Seasons
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Explore the New York Yankees season by season, from 1903
        through 2026. Discover team records, standings, and
        historical performances.
      </p>

      <div className="mt-8">
        <label
          htmlFor="historical-season"
          className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Select Season
        </label>

        <select
          id="historical-season"
          value={season}
          onChange={(event) => {
            setSeason(Number(event.target.value));
            setData(null);
            setError("");
            setLoading(true);
          }}
          className="w-full max-w-xs rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white focus:border-[#d5b66a] focus:outline-none"
        >
          {SEASONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-10 rounded-xl border border-white/10 bg-[#0b1d36] p-6">
        <h3 className="text-xl font-bold text-white">
          {season} Yankees Season Overview
        </h3>

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">
            Loading historical season...
          </p>
        ) : error ? (
          <p role="alert" className="mt-6 text-sm text-red-400">
            {error}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/10 bg-[#07152b] p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-black text-[#d5b66a]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <HistoricalTeamStats season={season} />
      <HistoricalSeasonLeaders key={`leaders-${season}`} season={season} />
      <HistoricalRosters key={`roster-${season}`} season={season} />
      <HistoricalPostseason key={`postseason-${season}`} season={season} />

      <p className="mt-5 text-xs leading-6 text-slate-500">
        Source: MLB Stats API. Historical standings coverage may
        vary by season.
      </p>
    </section>
  );
}
