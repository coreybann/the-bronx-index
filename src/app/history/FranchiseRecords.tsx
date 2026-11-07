"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import legends from "@/data/yankees-legends.json";

type StatGroup = "hitting" | "pitching";
type RecordType = "career" | "season";

type RecordEntry = {
  rank: number;
  playerId: number;
  player: string;
  season?: number;
  value: number;
};

const CATEGORIES = {
  hitting: [
    { id: "homeRuns", label: "Home Runs" },
    { id: "hits", label: "Hits" },
    { id: "rbi", label: "RBIs" },
    { id: "stolenBases", label: "Stolen Bases" },
  ],
  pitching: [
    { id: "wins", label: "Wins" },
    { id: "strikeouts", label: "Strikeouts" },
    { id: "saves", label: "Saves" },
  ],
} as const;

const LEGEND_IDS = new Set(
  legends.map((legend) => legend.id)
);

function getPlayerProfileUrl(playerId: number): string {
  const profilePath = LEGEND_IDS.has(playerId)
    ? `/history/legends/${playerId}`
    : `/player/${playerId}`;

  return `${profilePath}?from=records`;
}

export default function FranchiseRecords() {
  const [recordType, setRecordType] = useState<RecordType>("season");
  const [group, setGroup] = useState<StatGroup>("hitting");
  const [category, setCategory] = useState("homeRuns");
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [limit, setLimit] = useState<25 | 50 | 100>(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      try {
        const response = await fetch(
          `/api/franchise-records?type=${recordType}&group=${group}&category=${category}&limit=${limit}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load franchise records.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setRecords(data.records ?? []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load franchise records."
        );
        setLoading(false);
      }
    }

    loadRecords();

    return () => controller.abort();
  }, [recordType, group, category, limit]);

  function changeGroup(nextGroup: StatGroup) {
    setGroup(nextGroup);
    setCategory(CATEGORIES[nextGroup][0].id);
    setRecords([]);
    setLoading(true);
  }

  function changeCategory(nextCategory: string) {
    setCategory(nextCategory);
    setRecords([]);
    setLoading(true);
  }

  const filteredRecords = records.filter((record) =>
    record.player.toLowerCase().includes(playerSearch.trim().toLowerCase())
  );

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
        Yankees History / Record Book
      </p>

      <h2 className="mt-4 text-3xl font-black text-white">
        Franchise Records
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Explore the greatest career and single-season statistical
        performances in New York Yankees history.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {([
          { id: "season", label: "Single Season" },
          { id: "career", label: "All-Time Career" },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setRecordType(item.id);
              setRecords([]);
              setLoading(true);
            }}
            aria-pressed={recordType === item.id}
            className={`rounded-lg border px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
              recordType === item.id
                ? "border-[#d5b66a] bg-[#d5b66a]/10 text-[#d5b66a]"
                : "border-white/10 bg-[#0b1d36] text-slate-400 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {(["hitting", "pitching"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => changeGroup(item)}
            aria-pressed={group === item}
            className={`rounded-lg border px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
              group === item
                ? "border-[#d5b66a] bg-[#d5b66a]/10 text-[#d5b66a]"
                : "border-white/10 bg-[#0b1d36] text-slate-400 hover:text-white"
            }`}
          >
            {item === "hitting" ? "Batting" : "Pitching"}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES[group].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeCategory(item.id)}
            aria-pressed={category === item.id}
            className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
              category === item.id
                ? "bg-white text-[#07152b]"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="franchise-record-limit"
            className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Leaderboard Depth
          </label>
          <select
            id="franchise-record-limit"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value) as 25 | 50 | 100);
              setRecords([]);
              setLoading(true);
            }}
            className="rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white focus:border-[#d5b66a] focus:outline-none"
          >
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        <label
          htmlFor="franchise-player-search"
          className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Search leaderboard players
        </label>
        <input
          id="franchise-player-search"
          type="search"
          value={playerSearch}
          onChange={(event) => setPlayerSearch(event.target.value)}
          placeholder="Search by player name..."
          className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#d5b66a] focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#0b1d36]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h3 className="text-lg font-bold text-white">
            {recordType === "career"
              ? "All-Time Career Leaders"
              : "Single-Season Leaders"}
          </h3>
          <span className="text-xs text-slate-500">
            Yankees Only
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-sm text-slate-400">
            Loading franchise records...
          </p>
        ) : error ? (
          <p role="alert" className="p-8 text-sm text-red-400">
            {error}
          </p>
        ) : records.length === 0 ? (
          <p className="p-8 text-sm text-slate-400">
            No historical records available.
          </p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-8 text-sm text-slate-400">
            No players matching your search appear in this leaderboard.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  {recordType === "season" && (
                    <th className="px-6 py-4">Season</th>
                  )}
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={`${record.playerId}-${record.season ?? "career"}`}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-6 py-4 font-bold text-[#d5b66a]">
                      {record.rank}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      <Link
                        href={getPlayerProfileUrl(record.playerId)}
                        className="transition hover:text-[#d5b66a] hover:underline"
                      >
                        {record.player}
                      </Link>
                    </td>
                    {recordType === "season" && (
                      <td className="px-6 py-4 text-slate-400">
                        {record.season}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-bold tabular-nums text-white">
                      {record.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-5 text-xs leading-6 text-slate-500">
        Source: MLB Stats API. Historical rankings are based on
        collected Yankees career and single-season leaderboards,
        including ties. Statistical coverage may vary for early seasons.
      </p>
    </section>
  );
}
