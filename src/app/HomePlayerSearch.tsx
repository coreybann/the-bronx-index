"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Player = {
  id: number;
  name: string;
  position: string;
};

export default function HomePlayerSearch() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlayers() {
      try {
        const response = await fetch("/api/yankees-roster", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load players");
        }

        const data = (await response.json()) as {
          players: Player[];
        };

        if (!controller.signal.aborted) {
          setPlayers(data.players);
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

    void loadPlayers();

    return () => controller.abort();
  }, []);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return players
      .filter((player) =>
        player.name.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [players, search]);

  return (
    <div className="relative mt-8 max-w-lg">
      <label
        htmlFor="home-player-search"
        className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#d5b66a]"
      >
        Find a Yankees Player
      </label>

      <input
        id="home-player-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search Yankees players..."
        disabled={loading || error}
        className="w-full border border-white/20 bg-[#0b1d36] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#c5a253]"
      />

      {loading && (
        <p className="mt-2 text-xs text-slate-400">
          Loading players...
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-rose-400">
          Player search is temporarily unavailable.
        </p>
      )}

      {search.trim() && !loading && !error && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-white/10 bg-[#0d203b] shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              No matching Yankees players.
            </p>
          ) : (
            results.map((player) => (
              <Link
                key={player.id}
                href={`/player/${player.id}`}
                className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 text-sm transition hover:bg-white/5"
              >
                <span className="font-semibold text-white">
                  {player.name}
                </span>
                <span className="text-xs text-[#d5b66a]">
                  {player.position}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
