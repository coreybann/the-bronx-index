"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { YankeesProspect } from "@/lib/yankeesProspects";
import ProspectHeadshot from "./ProspectHeadshot";

type Props = {
  players: YankeesProspect[];
};

const levels = [
  "All Levels",
  "Triple-A",
  "Double-A",
  "High-A",
  "Single-A",
  "Rookie",
];

export default function ProspectDirectory({ players }: Props) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All Levels");
  const [position, setPosition] = useState("All Positions");

  const positions = useMemo(
    () => [
      "All Positions",
      ...Array.from(new Set(players.map((player) => player.position))).sort(),
    ],
    [players]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(query);

      const matchesLevel =
        level === "All Levels" ||
        player.affiliates.some((affiliate) => affiliate.level === level);

      const matchesPosition =
        position === "All Positions" || player.position === position;

      return matchesSearch && matchesLevel && matchesPosition;
    });
  }, [players, search, level, position]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
            2026 Organizational Directory
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Yankees Minor League Players
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            Explore players who appeared on Yankees affiliate rosters
            during the 2026 season. Players who appeared at multiple
            levels are listed once.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players..."
            aria-label="Search players"
            className="w-full border border-white/15 bg-[#0d203b] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#c5a253]"
          />

          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            aria-label="Filter by level"
            className="w-full border border-white/15 bg-[#0d203b] px-4 py-3 text-sm text-white outline-none focus:border-[#c5a253]"
          >
            {levels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            aria-label="Filter by position"
            className="w-full border border-white/15 bg-[#0d203b] px-4 py-3 text-sm text-white outline-none focus:border-[#c5a253]"
          >
            {positions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {players.length} players
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-white/10 bg-[#0d203b] p-10 text-center text-sm text-slate-400">
          No players match your filters.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/prospects/player/${player.id}`}
              className="group border border-white/10 bg-[#0d203b] p-5 transition hover:border-[#c5a253]/60 hover:bg-[#102440]"
            >
              <div className="flex items-start gap-4">
                <ProspectHeadshot
                  playerId={player.id}
                  playerName={player.name}
                />

                <div className="min-w-0">
                  <h3 className="font-bold text-white transition group-hover:text-[#d5b66a]">
                    {player.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {player.position} · Age {player.age ?? "—"}
                  </p>

                  <p className="mt-2 text-xs text-[#d5b66a]">
                    {player.affiliates.map((affiliate) => affiliate.level).filter(
                      (value, index, array) => array.indexOf(value) === index
                    ).join(" · ")}
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
