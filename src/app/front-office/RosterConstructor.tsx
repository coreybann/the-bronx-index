"use client";

import { useEffect, useMemo, useState } from "react";

type Player = {
  id: number;
  name: string;
  position: string;
  positionType: string;
  status: string;
  pitchingStats?: {
    gamesPitched: number;
    gamesStarted: number;
  } | null;
  fieldingPositions?: {
    position: string;
    games: number;
  }[];
};

const POSITION_GROUPS = [
  { label: "Pitchers", type: "Pitcher" },
  { label: "Catchers", type: "Catcher" },
  { label: "Infielders", type: "Infielder" },
  { label: "Outfielders", type: "Outfielder" },
  { label: "Designated Hitters", type: "Hitter" },
] as const;

const ROSTER_NEEDS = [
  { label: "Catcher", positions: ["C"], minimum: 2 },
  { label: "First Base", positions: ["1B"], minimum: 1 },
  { label: "Second Base", positions: ["2B"], minimum: 1 },
  { label: "Third Base", positions: ["3B"], minimum: 1 },
  { label: "Shortstop", positions: ["SS"], minimum: 1 },
  {
    label: "Outfield",
    positions: ["LF", "CF", "RF", "OF"],
    minimum: 3,
  },
  { label: "Designated Hitter", positions: ["DH"], minimum: 1 },
] as const;

const LINEUP_POSITIONS = [
  "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH",
] as const;

function getEligiblePositions(player: Player): Set<string> {
  const positions = new Set([player.position]);

  for (const entry of player.fieldingPositions ?? []) {
    if (entry.games >= 10) {
      positions.add(entry.position);
    }
  }

  return positions;
}

function calculateLineupCoverage(players: Player[]) {
  const eligiblePlayers = players.filter(
    (player) => player.positionType !== "Pitcher"
  );

  type LineupState = {
    score: number;
    assignments: Map<string, number>;
  };

  const states = new Map<number, LineupState>([
    [0, { score: 0, assignments: new Map() }],
  ]);

  for (const player of eligiblePlayers) {
    const eligiblePositions = getEligiblePositions(player);

    const options = LINEUP_POSITIONS.flatMap((position, index) => {
      if (!eligiblePositions.has(position)) return [];

      const games =
        player.fieldingPositions?.find(
          (entry) => entry.position === position
        )?.games ?? 0;

      return [{
        position,
        bit: 1 << index,
        score: games + (player.position === position ? 1000 : 0),
      }];
    });

    const previousStates = [...states.entries()];

    for (const [mask, state] of previousStates) {
      for (const option of options) {
        if ((mask & option.bit) !== 0) continue;

        const nextMask = mask | option.bit;
        const nextScore = state.score + option.score;
        const existing = states.get(nextMask);

        if (!existing || nextScore > existing.score) {
          const assignments = new Map(state.assignments);
          assignments.set(option.position, player.id);

          states.set(nextMask, {
            score: nextScore,
            assignments,
          });
        }
      }
    }
  }

  let bestState = states.get(0)!;
  let bestFilled = 0;

  for (const [mask, state] of states) {
    const filled = LINEUP_POSITIONS.reduce(
      (count, _, index) =>
        count + ((mask & (1 << index)) !== 0 ? 1 : 0),
      0
    );

    if (
      filled > bestFilled ||
      (filled === bestFilled && state.score > bestState.score)
    ) {
      bestState = state;
      bestFilled = filled;
    }
  }

  return {
    filled: bestFilled,
    total: LINEUP_POSITIONS.length,
    assignments: bestState.assignments,
  };
}

type PitchingRole =
  | "Starter"
  | "Reliever"
  | "Swingman"
  | "Unclassified";

function getPitchingRole(player: Player): PitchingRole {
  const stats = player.pitchingStats;

  if (!stats || stats.gamesPitched <= 0) {
    return "Unclassified";
  }

  const startRate = stats.gamesStarted / stats.gamesPitched;

  if (startRate >= 0.6) return "Starter";
  if (startRate < 0.2) return "Reliever";

  return "Swingman";
}

const MAX_ROSTER = 26;
const MAX_PITCHERS = 13;

export default function RosterConstructor() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [pitchingRoleOverrides, setPitchingRoleOverrides] =
    useState<Record<number, PitchingRole>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoster() {
      try {
        const response = await fetch("/api/yankees-roster", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load Yankees roster.");
        }

        const data = (await response.json()) as {
          players: Player[];
        };

        if (!controller.signal.aborted) {
          setPlayers(data.players);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load roster."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadRoster();

    return () => controller.abort();
  }, []);

  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedIds.includes(player.id)),
    [players, selectedIds]
  );

  const pitcherCount = selectedPlayers.filter(
    (player) => player.positionType === "Pitcher"
  ).length;

  const positionPlayerCount = selectedPlayers.length - pitcherCount;

  const pitchingDepth = useMemo(() => {
    const pitchers = selectedPlayers.filter(
      (player) => player.positionType === "Pitcher"
    );

    const roleFor = (player: Player) =>
      pitchingRoleOverrides[player.id] ?? getPitchingRole(player);

    return {
      starters: pitchers.filter(
        (player) => roleFor(player) === "Starter"
      ),
      relievers: pitchers.filter(
        (player) => roleFor(player) === "Reliever"
      ),
      swingmen: pitchers.filter(
        (player) => roleFor(player) === "Swingman"
      ),
      unclassified: pitchers.filter(
        (player) => roleFor(player) === "Unclassified"
      ),
    };
  }, [selectedPlayers, pitchingRoleOverrides]);


  const rosterNeeds = ROSTER_NEEDS.map((need) => {
    const count = selectedPlayers.filter((player) => {
      const positions = new Set([player.position]);

      for (const entry of player.fieldingPositions ?? []) {
        if (entry.games >= 10) {
          positions.add(entry.position);
        }
      }

      return need.positions.some((position) =>
        positions.has(position)
      );
    }).length;

    return {
      label: need.label,
      count,
      minimum: need.minimum,
      covered: count >= need.minimum,
    };
  });

  const lineupCoverage = useMemo(
    () => calculateLineupCoverage(selectedPlayers),
    [selectedPlayers]
  );

  const benchDepth = useMemo(() => {
    const startingIds = new Set(
      lineupCoverage.assignments.values()
    );

    const benchPlayers = selectedPlayers.filter(
      (player) =>
        player.positionType !== "Pitcher" &&
        !startingIds.has(player.id)
    );

    const backupCatchers = benchPlayers.filter(
      (player) => getEligiblePositions(player).has("C")
    );

    return {
      players: benchPlayers.map((player) => ({
        ...player,
        eligiblePositions: LINEUP_POSITIONS.filter(
          (position) => getEligiblePositions(player).has(position)
        ),
      })),
      count: benchPlayers.length,
      backupCatcherCount: backupCatchers.length,
      hasBackupCatcher: backupCatchers.length > 0,
    };
  }, [selectedPlayers, lineupCoverage]);

  const availablePlayers = players.filter(
    (player) =>
      !selectedIds.includes(player.id) &&
      player.name.toLowerCase().includes(search.toLowerCase())
  );

  function addPlayer(player: Player) {
    if (selectedIds.length >= MAX_ROSTER) return;

    if (
      player.positionType === "Pitcher" &&
      pitcherCount >= MAX_PITCHERS
    ) {
      return;
    }

    setSelectedIds((current) => [...current, player.id]);
  }

  function removePlayer(id: number) {
    setSelectedIds((current) =>
      current.filter((playerId) => playerId !== id)
    );

    setPitchingRoleOverrides((current) => {
      const updated = { ...current };
      delete updated[id];
      return updated;
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight">
          Yankees <span className="text-[#d5b66a]">Roster Construction</span>
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-400">
          Build a hypothetical 26-man Yankees roster using players
          from the current 40-man roster.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Roster", `${selectedPlayers.length}/26`],
          ["Pitchers", `${pitcherCount}/13`],
          ["Position Players", `${positionPlayerCount}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-[#0b1d36] p-5"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {label}
            </p>
            <p className="mt-3 text-3xl font-black text-[#d5b66a]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {!loading && !error && (
        <div className="mb-6 space-y-4">
          <section className="rounded-xl border border-white/10 bg-[#0b1d36] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                Starting Lineup Coverage
              </h3>
              <span className="text-sm font-bold text-[#d5b66a]">
                {lineupCoverage.filled}/{lineupCoverage.total} filled
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {LINEUP_POSITIONS.map((position) => {
                const playerId = lineupCoverage.assignments.get(position);
                const player = selectedPlayers.find(
                  (entry) => entry.id === playerId
                );

                return (
                  <div
                    key={position}
                    className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-[#07152b] px-3 py-2"
                  >
                    <span className="w-7 shrink-0 text-xs font-bold text-[#d5b66a]">
                      {position}
                    </span>
                    <span
                      className={`min-w-0 truncate text-sm ${
                        player ? "text-white" : "text-slate-500"
                      }`}
                      title={player?.name ?? "Needs player"}
                    >
                      {player?.name ?? "Needs player"}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              One player per position. Secondary positions require
              10 MLB games in 2026.
            </p>
          </section>

          <section className="mb-6 rounded-xl border border-white/10 bg-[#0b1d36] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              Bench Depth
            </h3>

            <span className="text-sm font-bold text-[#d5b66a]">
              {benchDepth.count} bench players
            </span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400">
              Backup Catcher:
            </span>

            <span
              className={`font-semibold ${
                benchDepth.hasBackupCatcher
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {benchDepth.hasBackupCatcher
                ? `Available (${benchDepth.backupCatcherCount})`
                : "Not available"}
            </span>
          </div>

          {benchDepth.count === 0 ? (
            <p className="text-sm text-slate-400">
              No bench players available. Add more position players
              to evaluate bench depth.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {benchDepth.players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-lg border border-white/10 bg-[#07152b] px-3 py-2"
                >
                  <p className="truncate text-sm font-semibold text-white">
                    {player.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Positions: {player.eligiblePositions.join(", ") || player.position}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

          <section className="rounded-xl border border-white/10 bg-[#0b1d36] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                Pitching Depth
              </h3>
              <span className="text-sm font-bold text-[#d5b66a]">
                {pitcherCount}/13 pitchers
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Starting Rotation",
                  players: pitchingDepth.starters,
                  target: 5,
                },
                {
                  label: "Bullpen",
                  players: pitchingDepth.relievers,
                  target: 8,
                },
                {
                  label: "Swingmen",
                  players: pitchingDepth.swingmen,
                  target: null,
                },
                {
                  label: "Unclassified",
                  players: pitchingDepth.unclassified,
                  target: null,
                },
              ].map((group) => (
                <div
                  key={group.label}
                  className="rounded-lg border border-white/10 bg-[#07152b] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {group.label}
                    </h4>
                    <span className="text-xs font-bold text-[#d5b66a]">
                      {group.players.length}
                      {group.target !== null ? `/${group.target}` : ""}
                    </span>
                  </div>

                  {group.players.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No pitchers selected
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {group.players.map((player) => (
                        <div
                          key={player.id}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 px-2 py-1"
                        >
                          <span className="text-xs text-slate-300">
                            {player.name}
                          </span>

                          <select
                            aria-label={`Pitching role for ${player.name}`}
                            value={
                              pitchingRoleOverrides[player.id] ??
                              getPitchingRole(player)
                            }
                            onChange={(event) => {
                              const role = event.target.value as PitchingRole;

                              setPitchingRoleOverrides((previous) => ({
                                ...previous,
                                [player.id]: role,
                              }));
                            }}
                            className="rounded border border-white/10 bg-[#0b1d36] px-1 py-1 text-xs text-[#d5b66a]"
                          >
                            <option value="Starter">Starter</option>
                            <option value="Reliever">Reliever</option>
                            <option value="Swingman">Swingman</option>
                            <option value="Unclassified">Unclassified</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Roles are estimated from 2026 MLB appearances.
              A five-starter, eight-reliever staff is a planning
              guideline, not a required roster composition.
              Swingmen may provide rotation or bullpen depth.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0b1d36] p-4">
            <h3 className="mb-3 text-lg font-bold text-white">
              Roster Needs
            </h3>

            <div className="flex flex-wrap gap-2">
              {rosterNeeds.map((need) => (
                <div
                  key={need.label}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#07152b] px-3 py-2"
                  title={`${need.label}: ${need.count}/${need.minimum}`}
                >
                  <span className="text-xs font-semibold text-white">
                    {need.label}
                  </span>

                  <span className="text-xs font-bold text-[#d5b66a]">
                    {need.count}/{need.minimum}
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      need.covered
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                    aria-label={
                      need.covered ? "Covered" : "Needs coverage"
                    }
                  >
                    {need.covered ? "✓" : "!"}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Suggested roster depth based on primary and eligible
              secondary positions.
            </p>
          </section>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-400">
          Loading Yankees roster...
        </p>
      ) : error ? (
        <p role="alert" className="py-12 text-red-400">
          {error}
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#0b1d36] p-5">
            <h3 className="mb-4 text-xl font-bold">
              Available Players
            </h3>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Yankees players..."
              aria-label="Search available players"
              className="mb-5 w-full rounded-lg border border-white/10 bg-[#07152b] px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />

            <div className="max-h-[600px] space-y-2 overflow-y-auto">
              {availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {player.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {player.position}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addPlayer(player)}
                    disabled={
                      selectedIds.length >= MAX_ROSTER ||
                      (player.positionType === "Pitcher" &&
                        pitcherCount >= MAX_PITCHERS)
                    }
                    className="rounded-md border border-[#d5b66a]/40 px-3 py-1.5 text-xs font-bold text-[#d5b66a] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0b1d36] p-5">
            <h3 className="mb-4 text-xl font-bold">
              Your 26-Man Roster
            </h3>

            {selectedPlayers.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                Select players to begin building your roster.
              </p>
            ) : (
              <div className="max-h-[600px] space-y-5 overflow-y-auto">
                {POSITION_GROUPS.map((group) => {
                  const groupPlayers = selectedPlayers.filter(
                    (player) => player.positionType === group.type
                  );

                  if (groupPlayers.length === 0) return null;

                  return (
                    <div key={group.type}>
                      <h4 className="mb-3 border-b border-white/10 pb-2 text-xs font-bold uppercase tracking-widest text-[#d5b66a]">
                        {group.label} ({groupPlayers.length})
                      </h4>

                      <div className="space-y-2">
                        {groupPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {player.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {player.position}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removePlayer(player.id)}
                              className="rounded-md border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-400/10"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
