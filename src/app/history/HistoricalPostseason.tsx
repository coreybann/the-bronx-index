"use client";

import { useEffect, useState } from "react";

type PostseasonSeries = {
  round: string;
  opponent: string;
  opponentId: number;
  wins: number;
  losses: number;
  result: "Won" | "Lost" | "Incomplete";
};

type PostseasonData = {
  season: number;
  appeared: boolean;
  worldSeriesChampion: boolean;
  series: PostseasonSeries[];
};

export default function HistoricalPostseason({
  season,
}: {
  season: number;
}) {
  const [data, setData] = useState<PostseasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPostseason() {
      setLoading(true);
      setError(false);
      setData(null);

      try {
        const response = await fetch(
          `/api/historical-postseason?season=${season}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load postseason results.");
        }

        const result: PostseasonData = await response.json();

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPostseason();

    return () => controller.abort();
  }, [season]);

  return (
    <section className="mt-8 rounded-2xl border border-slate-700 bg-[#0d1d30] p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white">
          Historical Postseason Results
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Playoff opponents, series records, and postseason outcomes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">
          Loading postseason results...
        </p>
      ) : error || !data ? (
        <p className="text-sm text-red-400">
          Postseason results are currently unavailable.
        </p>
      ) : !data.appeared ? (
        <div className="rounded-xl border border-slate-700 bg-[#081321] p-5">
          <p className="text-sm text-slate-300">
            The Yankees did not appear in the postseason in {season}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.worldSeriesChampion && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                World Series Champions
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                {season} New York Yankees
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {data.series.map((series) => (
              <div
                key={`${series.round}-${series.opponentId}`}
                className="rounded-xl border border-slate-700 bg-[#081321] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                    {series.round}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      series.result === "Won"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : series.result === "Lost"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {series.result}
                  </span>
                </div>

                <p className="mt-4 text-base font-semibold text-white">
                  vs. {series.opponent}
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">
                    {series.wins}–{series.losses}
                  </span>
                  <span className="pb-1 text-xs text-slate-400">
                    Series Record
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Results are calculated from completed postseason games
            recorded by MLB.
          </p>
        </div>
      )}
    </section>
  );
}
