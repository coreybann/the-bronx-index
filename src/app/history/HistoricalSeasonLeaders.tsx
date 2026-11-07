"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Leader = {
  id: number;
  name: string;
  value: string;
};

type Category = {
  key: string;
  label: string;
  leaders: Leader[];
};

type Leaderboards = {
  season: number;
  hitting: Category[];
  pitching: Category[];
};

function formatValue(key: string, value: string) {
  if (key === "avg") {
    return value.replace(/^0(?=\.)/, "");
  }

  return value;
}

export default function HistoricalSeasonLeaders({
  season,
}: {
  season: number;
}) {
  const [data, setData] = useState<Leaderboards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLeaders() {
      try {
        const response = await fetch(
          `/api/historical-leaders?season=${season}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Historical season leaders are unavailable.");
        }

        const result: Leaderboards = await response.json();

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
            : "Unable to load season leaders."
        );
        setLoading(false);
      }
    }

    loadLeaders();

    return () => controller.abort();
  }, [season]);

  function renderCategories(categories: Category[]) {
    return (
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <div
            key={category.key}
            className="rounded-lg border border-white/10 bg-[#07152b] p-5"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {category.label}
            </p>

            {category.leaders.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Unavailable
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {category.leaders.map((leader) => (
                  <div
                    key={leader.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <Link
                      href={`/player/${leader.id}?from=history`}
                      className="text-sm font-semibold text-white transition hover:text-[#d5b66a]"
                    >
                      {leader.name}
                    </Link>

                    <span className="text-xl font-black text-[#d5b66a]">
                      {formatValue(category.key, leader.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="mt-10 rounded-xl border border-white/10 bg-[#0b1d36] p-6">
      <h3 className="text-xl font-bold text-white">
        Historical Season Leaders
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Yankees statistical leaders for the {season} season.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">
          Loading season leaders...
        </p>
      ) : error ? (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {error}
        </p>
      ) : data ? (
        <div className="mt-8 space-y-10">
          <div>
            <h4 className="text-lg font-bold text-white">
              Batting Leaders
            </h4>
            {renderCategories(data.hitting)}
          </div>

          <div>
            <h4 className="text-lg font-bold text-white">
              Pitching Leaders
            </h4>
            {renderCategories(data.pitching)}
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        Batting average and ERA leaders use minimum playing-time
        qualifications. Tied leaders are displayed together.
        Source: MLB Stats API.
      </p>
    </section>
  );
}
