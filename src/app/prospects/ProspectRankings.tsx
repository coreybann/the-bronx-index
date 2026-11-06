"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import rankings from "@/data/yankees-pipeline-top30-2026.json";
import ProspectHeadshot from "./ProspectHeadshot";

export default function ProspectRankings() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rankings.filter(
      (player) =>
        player.name.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query) ||
        String(player.rank).includes(query)
    );
  }, [search]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d5b66a]">
          MLB Pipeline
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          2026 Yankees Top 30 Prospects
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Scouting-based organizational rankings published by MLB Pipeline.
          Rankings are a saved 2026 snapshot, not live updates.
        </p>

        <a
          href="https://www.mlb.com/prospects/yankees/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-semibold text-[#d5b66a] hover:underline"
        >
          View original MLB Pipeline rankings ↗
        </a>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search prospects, positions, or ranks..."
        aria-label="Search prospect rankings"
        className="w-full rounded-xl border border-white/10 bg-[#0d1d30] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#d5b66a]"
      />

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1d30]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">Prospect</th>
                <th className="px-5 py-4">Position</th>
                <th className="px-5 py-4">Profile</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="px-5 py-4 font-bold text-[#d5b66a]">
                    #{player.rank}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/prospects/player/${player.id}`}
                      className="flex items-center gap-3 font-semibold text-white hover:text-[#d5b66a]"
                    >
                      <ProspectHeadshot
                        playerId={player.id}
                        playerName={player.name}
                      />
                      <span>{player.name}</span>
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {player.position}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/prospects/player/${player.id}`}
                      className="text-xs font-semibold text-[#d5b66a] hover:underline"
                    >
                      View Profile →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No prospects match your search.
          </p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Source: MLB Pipeline, 2026 Yankees Top 30. Player rankings are
        MLB Pipeline evaluations, not The Bronx Index statistical rankings.
      </p>
    </section>
  );
}
