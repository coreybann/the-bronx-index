"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RosterPlayer = {
  id: number;
  name: string;
  position: string;
  jerseyNumber: string | null;
};

type RosterGroup = {
  name: string;
  players: RosterPlayer[];
};

type RosterResponse = {
  season: number;
  totalPlayers: number;
  groups: RosterGroup[];
};

export default function HistoricalRosters({
  season,
}: {
  season: number;
}) {
  const [data, setData] = useState<RosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoster() {
      try {
        const response = await fetch(
          `/api/historical-rosters?season=${season}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Historical roster unavailable for this season.");
        }

        const result: RosterResponse = await response.json();

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
            : "Unable to load historical roster."
        );
        setLoading(false);
      }
    }

    loadRoster();

    return () => controller.abort();
  }, [season]);

  return (
    <section className="mt-10 rounded-xl border border-white/10 bg-[#0b1d36] p-6">
      <h3 className="text-xl font-bold text-white">
        Historical Yankees Roster
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Players listed on the Yankees roster during the {season} season.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">
          Loading historical roster...
        </p>
      ) : error ? (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {error}
        </p>
      ) : data ? (
        <>
          <p className="mt-5 text-sm font-semibold text-[#d5b66a]">
            {data.totalPlayers} Players
          </p>

          <div className="mt-6 space-y-4">
            {data.groups
              .filter((group) => group.players.length > 0)
              .map((group) => (
                <details
                  key={group.name}
                  className="group rounded-lg border border-white/10 bg-[#07152b]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-white [&::-webkit-details-marker]:hidden">
                    <span className="font-bold">
                      {group.name}
                      <span className="ml-2 text-sm font-normal text-slate-400">
                        ({group.players.length})
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-[#d5b66a] transition-transform group-open:rotate-180"
                    >
                      ▼
                    </span>
                  </summary>

                  <div className="border-t border-white/10 px-5 py-3">
                    {group.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/player/${player.id}?from=history`}
                            className="text-sm font-semibold text-white transition hover:text-[#d5b66a]"
                          >
                            {player.name}
                          </Link>

                          <p className="mt-1 text-xs text-slate-500">
                            {player.position}
                          </p>
                        </div>

                        {player.jerseyNumber && (
                          <span className="shrink-0 text-sm font-bold text-[#d5b66a]">
                            #{player.jerseyNumber}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        </>
      ) : null}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        Full-season roster data provided by MLB Stats API.
        Historical jersey numbers and position classifications
        may be incomplete.
      </p>
    </section>
  );
}
