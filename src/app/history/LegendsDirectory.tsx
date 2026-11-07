"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import legends from "@/data/yankees-legends.json";

export default function LegendsDirectory() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All Positions");

  const positions = useMemo(
    () => [
      "All Positions",
      ...Array.from(new Set(legends.map((player) => player.position))).sort(),
    ],
    []
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return legends.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(query);
      const matchesPosition =
        position === "All Positions" || player.position === position;

      return matchesSearch && matchesPosition;
    });
  }, [search, position]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
          Franchise Icons
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Yankees Legends
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          Explore the players who helped define Yankees history.
          Search legendary players and discover their positions
          and years with the franchise.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Yankees legends..."
          aria-label="Search Yankees legends"
          className="w-full border border-white/15 bg-[#0d203b] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#d5b66a]"
        />

        <select
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          aria-label="Filter legends by position"
          className="w-full border border-white/15 bg-[#0d203b] px-4 py-3 text-sm text-white outline-none focus:border-[#d5b66a]"
        >
          {positions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-6 text-xs text-slate-400">
        Showing {filtered.length} of {legends.length} legends
      </p>

      {filtered.length === 0 ? (
        <div className="border border-white/10 bg-[#0d203b] p-10 text-center text-sm text-slate-400">
          No legends match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/history/legends/${player.id}`}
              className="block border border-white/10 bg-[#0d203b] p-6 transition hover:border-[#d5b66a]/60 hover:bg-[#102440]"
            >
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#d5b66a]/30 bg-[#07152b] text-xl font-black text-[#d5b66a]"
                >
                  {player.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">
                    {player.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    Position: {player.position}
                  </p>

                  <p className="mt-2 text-sm text-[#d5b66a]">
                    Yankees: {player.startYear}–{player.endYear}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
