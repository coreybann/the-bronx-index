"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Player = {
  playerId: number;
  playerName: string;
  affiliates: string[];
  stats: Record<string, string | number>;
};

type LeaderboardResponse = {
  season: number;
  group: "hitting" | "pitching";
  count: number;
  players: Player[];
};

const hittingColumns = [
  { label: "G", key: "gamesPlayed" },
  { label: "PA", key: "plateAppearances" },
  { label: "AB", key: "atBats" },
  { label: "H", key: "hits" },
  { label: "HR", key: "homeRuns" },
  { label: "RBI", key: "rbi" },
  { label: "BB", key: "baseOnBalls" },
  { label: "SO", key: "strikeOuts" },
  { label: "SB", key: "stolenBases" },
  { label: "AVG", key: "avg" },
  { label: "OBP", key: "obp" },
  { label: "SLG", key: "slg" },
  { label: "OPS", key: "ops" },
];

const pitchingColumns = [
  { label: "G", key: "gamesPlayed" },
  { label: "GS", key: "gamesStarted" },
  { label: "IP", key: "inningsPitched" },
  { label: "W", key: "wins" },
  { label: "L", key: "losses" },
  { label: "SV", key: "saves" },
  { label: "SO", key: "strikeOuts" },
  { label: "BB", key: "baseOnBalls" },
  { label: "ERA", key: "era" },
  { label: "WHIP", key: "whip" },
  { label: "K/9", key: "strikeoutsPer9Inn" },
  { label: "BB/9", key: "walksPer9Inn" },
  { label: "HR/9", key: "homeRunsPer9" },
];

export default function ProspectLeaderboards() {
  const [group, setGroup] = useState<"hitting" | "pitching">("hitting");
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [affiliate, setAffiliate] = useState("All Affiliates");
  const [sortKey, setSortKey] = useState("ops");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/prospects/leaderboards?season=2026&group=${group}`
        );

        if (!response.ok) {
          throw new Error("Unable to load leaderboard statistics.");
        }

        const data: LeaderboardResponse = await response.json();

        if (active) {
          setPlayers(data.players);
        }
      } catch {
        if (active) {
          setError("Unable to load leaderboard statistics. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [group]);

  const columns =
    group === "hitting" ? hittingColumns : pitchingColumns;

  const affiliates = useMemo(
    () => [
      ...new Set(players.flatMap((player) => player.affiliates)),
    ].sort(),
    [players]
  );

  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) =>
        player.playerName.toLowerCase().includes(search.toLowerCase())
      )
      .filter(
        (player) =>
          affiliate === "All Affiliates" ||
          player.affiliates.includes(affiliate)
      )
      .sort((a, b) => {
        const first = a.stats[sortKey];
        const second = b.stats[sortKey];

        const getNumber = (value: string | number | undefined) => {
          if (value === undefined || value === "—") return null;

          if (sortKey === "inningsPitched") {
            const [innings, remainder] = String(value).split(".");
            return Number(innings) * 3 + Number(remainder ?? 0);
          }

          const number = Number(value);
          return Number.isFinite(number) ? number : null;
        };

        const aValue = getNumber(first);
        const bValue = getNumber(second);

        if (aValue === null) return 1;
        if (bValue === null) return -1;

        return sortDirection === "desc"
          ? bValue - aValue
          : aValue - bValue;
      });
  }, [players, search, affiliate, sortKey, sortDirection]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((previous) =>
        previous === "desc" ? "asc" : "desc"
      );
    } else {
      setSortKey(key);
      setSortDirection(
        group === "pitching" && ["era", "whip", "walksPer9Inn", "homeRunsPer9"].includes(key)
          ? "asc"
          : "desc"
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 border-b border-white/10 pb-6">
        {(["hitting", "pitching"] as const).map((option) => (
          <button
            key={option}
            onClick={() => {
              setGroup(option);
              setSortKey(option === "hitting" ? "ops" : "era");
              setSortDirection(option === "hitting" ? "desc" : "asc");
              setAffiliate("All Affiliates");
            }}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition ${
              group === option
                ? "bg-[#d5b66a] text-[#07152b]"
                : "border border-white/10 text-slate-300 hover:border-[#d5b66a] hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#d5b66a]">
            Search Players
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by player name..."
            className="w-full border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white outline-none focus:border-[#d5b66a]"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#d5b66a]">
            Affiliate
          </label>
          <select
            value={affiliate}
            onChange={(event) => setAffiliate(event.target.value)}
            className="w-full border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white outline-none focus:border-[#d5b66a]"
          >
            <option>All Affiliates</option>
            {affiliates.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            {group === "hitting" ? "Hitting Leaders" : "Pitching Leaders"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            2026 Season · Yankees Minor League Affiliates
          </p>
        </div>

        <p className="text-sm text-slate-400">
          {filteredPlayers.length} players
        </p>
      </div>

      {loading ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-[#0b1d36] p-12 text-center text-sm text-slate-400">
          Loading leaderboard statistics...
        </div>
      ) : error ? (
        <div className="mt-8 rounded-xl border border-red-500/20 bg-[#0b1d36] p-12 text-center text-sm text-red-300">
          {error}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-[#0b1d36] p-12 text-center text-sm text-slate-400">
          No players match your search.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-[#142a47] text-xs uppercase tracking-wider text-[#d5b66a]">
              <tr>
                <th className="sticky left-0 bg-[#142a47] px-4 py-4">
                  Player
                </th>
                <th className="px-4 py-4">Affiliate</th>
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-4 text-right">
                    <button
                      onClick={() => handleSort(column.key)}
                      className="whitespace-nowrap hover:text-white"
                    >
                      {column.label}
                      {sortKey === column.key
                        ? sortDirection === "desc" ? " ↓" : " ↑"
                        : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr
                  key={player.playerId}
                  className="border-t border-white/5 text-slate-300 transition hover:bg-[#142a47]/70"
                >
                  <td className="sticky left-0 whitespace-nowrap bg-[#0b1d36] px-4 py-4 font-semibold text-white">
                    <span className="mr-3 text-xs text-slate-500">
                      {index + 1}
                    </span>
                    <Link
                      href={`/prospects/player/${player.playerId}`}
                      className="hover:text-[#d5b66a]"
                    >
                      {player.playerName}
                    </Link>
                  </td>

                  <td className="max-w-[220px] px-4 py-4 text-xs text-slate-400">
                    {player.affiliates.join(", ")}
                  </td>

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-4 text-right tabular-nums"
                    >
                      {player.stats[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        Statistics reflect performance with Yankees minor league affiliates.
        Multi-affiliate totals are combined using affiliate-level counting
        statistics. Rankings are statistical comparisons, not official
        organizational prospect rankings.
      </p>
    </div>
  );
}
