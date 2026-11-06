"use client";

import { useState } from "react";
import championships from "@/data/yankees-championships.json";

type Metric = {
  label: string;
  key: "wins" | "losses" | "winningPercentage" |
    "runsScored" | "runsAllowed" | "runDifferential";
  lowerIsBetter?: boolean;
};

const metrics: Metric[] = [
  { label: "Wins", key: "wins" },
  { label: "Losses", key: "losses", lowerIsBetter: true },
  { label: "Winning %", key: "winningPercentage" },
  { label: "Runs Scored", key: "runsScored" },
  { label: "Runs Allowed", key: "runsAllowed", lowerIsBetter: true },
  { label: "Run Differential", key: "runDifferential" },
];

type Championship = (typeof championships)[number];

function getValue(team: Championship, key: Metric["key"]): number {
  if (key === "runDifferential") {
    return team.regularSeason.runsScored - team.regularSeason.runsAllowed;
  }

  return Number(team.regularSeason[key]);
}

export default function ChampionshipComparison() {
  const [firstYear, setFirstYear] = useState(1927);
  const [secondYear, setSecondYear] = useState(1998);

  const first = championships.find((team) => team.year === firstYear);
  const second = championships.find((team) => team.year === secondYear);

  if (!first || !second) return null;

  return (
    <section className="border-t border-white/10 pt-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
        Championship Team Comparison
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        Compare Yankees Dynasties
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
        Compare the regular-season performance of two Yankees World Series
        championship teams. Green highlights indicate the stronger
        statistical result.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {[
          { label: "Team One", value: firstYear, setter: setFirstYear },
          { label: "Team Two", value: secondYear, setter: setSecondYear },
        ].map((selector) => (
          <div key={selector.label}>
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-400">
              {selector.label}
            </label>
            <select
              value={selector.value}
              onChange={(event) => selector.setter(Number(event.target.value))}
              className="w-full border border-white/15 bg-[#0d203b] px-4 py-4 text-white outline-none focus:border-[#d5b66a]"
            >
              {championships.map((team) => (
                <option key={team.year} value={team.year}>
                  {team.year} Yankees
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto border border-white/10 bg-[#0d203b]">
        <table className="w-full min-w-[460px] text-center text-sm">
          <thead>
            <tr className="border-b border-white/15">
              <th className="px-4 py-5 text-left text-slate-400">
                Statistic
              </th>
              <th className="px-4 py-5 text-[#d5b66a]">
                {firstYear}
              </th>
              <th className="px-4 py-5 text-[#d5b66a]">
                {secondYear}
              </th>
            </tr>
          </thead>

          <tbody>
            {metrics.map((metric) => {
              const firstValue = getValue(first, metric.key);
              const secondValue = getValue(second, metric.key);

              const firstBetter = metric.lowerIsBetter
                ? firstValue < secondValue
                : firstValue > secondValue;

              const secondBetter = metric.lowerIsBetter
                ? secondValue < firstValue
                : secondValue > firstValue;

              const format = (value: number) =>
                metric.key === "winningPercentage"
                  ? value.toFixed(3).replace(/^0/, "")
                  : value.toLocaleString();

              return (
                <tr key={metric.key} className="border-b border-white/10">
                  <td className="px-4 py-5 text-left font-medium text-slate-300">
                    {metric.label}
                  </td>
                  <td className={`px-4 py-5 font-bold ${
                    firstBetter ? "text-emerald-400" : "text-white"
                  }`}>
                    {format(firstValue)}
                  </td>
                  <td className={`px-4 py-5 font-bold ${
                    secondBetter ? "text-emerald-400" : "text-white"
                  }`}>
                    {format(secondValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold">
          World Series Performance
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Compare each championship team&apos;s World Series opponent,
          series record, and winning percentage.
        </p>

        <div className="mt-6 overflow-x-auto border border-white/10 bg-[#0d203b]">
          <table className="w-full min-w-[460px] text-center text-sm">
            <thead>
              <tr className="border-b border-white/15">
                <th className="px-4 py-5 text-left text-slate-400">
                  Statistic
                </th>
                <th className="px-4 py-5 text-[#d5b66a]">
                  {firstYear}
                </th>
                <th className="px-4 py-5 text-[#d5b66a]">
                  {secondYear}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="px-4 py-5 text-left font-medium text-slate-300">
                  Opponent
                </td>
                <td className="px-4 py-5 font-semibold">{first.opponent}</td>
                <td className="px-4 py-5 font-semibold">{second.opponent}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="px-4 py-5 text-left font-medium text-slate-300">
                  Series Record
                </td>
                <td className="px-4 py-5 font-semibold">
                  {first.wins}–{first.losses}
                </td>
                <td className="px-4 py-5 font-semibold">
                  {second.wins}–{second.losses}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-5 text-left font-medium text-slate-300">
                  Winning %
                </td>
                <td className={`px-4 py-5 font-bold ${
                  first.wins / (first.wins + first.losses) >
                  second.wins / (second.wins + second.losses)
                    ? "text-emerald-400"
                    : "text-white"
                }`}>
                  {(first.wins / (first.wins + first.losses))
                    .toFixed(3).replace(/^0/, "")}
                </td>
                <td className={`px-4 py-5 font-bold ${
                  second.wins / (second.wins + second.losses) >
                  first.wins / (first.wins + first.losses)
                    ? "text-emerald-400"
                    : "text-white"
                }`}>
                  {(second.wins / (second.wins + second.losses))
                    .toFixed(3).replace(/^0/, "")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Source: MLB Stats API. Regular-season and World Series statistics.
        Comparisons are descriptive and do not adjust for differences
        between baseball eras or opponent strength.
      </p>
    </section>
  );
}
