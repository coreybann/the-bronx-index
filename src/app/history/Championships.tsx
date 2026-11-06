"use client";

import { useState } from "react";
import championships from "@/data/yankees-championships.json";

export default function Championships() {
  const [selectedYear, setSelectedYear] = useState(1923);

  const selected = championships.find(
    (championship) => championship.year === selectedYear
  );

  const sortedChampionships = [...championships].sort(
    (a, b) => a.year - b.year
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          { label: "World Series Titles", value: "27" },
          { label: "First Championship", value: "1923" },
          { label: "Most Recent Title", value: "2009" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-white/10 bg-[#0d203b] p-6"
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 text-4xl font-black text-[#d5b66a]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
          Championship Timeline
        </p>
        <h2 className="mt-3 text-3xl font-bold">
          27 World Series Championships
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Select a championship season to explore its World Series result.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {sortedChampionships.map((championship) => {
          const active = championship.year === selectedYear;

          return (
            <button
              key={championship.year}
              type="button"
              onClick={() => setSelectedYear(championship.year)}
              aria-pressed={active}
              className={`border px-3 py-4 text-sm font-bold transition ${
                active
                  ? "border-[#d5b66a] bg-[#d5b66a] text-[#07152b]"
                  : "border-white/10 bg-[#0d203b] text-white hover:border-[#d5b66a]"
              }`}
            >
              {championship.year}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border border-[#d5b66a]/30 bg-[#0d203b] p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
            World Series Champions
          </p>

          <h3 className="mt-4 text-5xl font-black">
            {selected.year}
          </h3>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Opponent
              </p>
              <p className="mt-2 text-xl font-bold">
                {selected.opponent}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Series Result
              </p>
              <p className="mt-2 text-xl font-bold text-[#d5b66a]">
                Yankees win {selected.wins}–{selected.losses}
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <h4 className="text-xl font-bold">
              World Series Game Results
            </h4>
            <p className="mt-2 text-sm text-slate-400">
              Game-by-game results from the {selected.year} World Series.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-4">Game</th>
                    <th className="px-3 py-4">Date</th>
                    <th className="px-3 py-4">Location</th>
                    <th className="px-3 py-4">Score</th>
                    <th className="px-3 py-4">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.gameResults.map((game) => (
                    <tr
                      key={game.gamePk}
                      className="border-b border-white/10"
                    >
                      <td className="px-3 py-4 font-semibold">
                        Game {game.game}
                      </td>
                      <td className="px-3 py-4 text-slate-300">
                        {game.date}
                      </td>
                      <td className="px-3 py-4 text-slate-300">
                        {game.home ? "Home" : "Away"}
                      </td>
                      <td className="px-3 py-4 font-semibold">
                        NYY {game.yankeesScore}–{game.opponentScore}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={
                            game.result === "W"
                              ? "font-bold text-emerald-400"
                              : "font-bold text-red-400"
                          }
                        >
                          {game.result === "W" ? "Win" : "Loss"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Source: MLB Stats API. Historical World Series results.
      </p>
    </div>
  );
}
