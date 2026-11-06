import Link from "next/link";
type RosterPlayer = {
  person: {
    id: number;
    fullName: string;
  };
  jerseyNumber?: string;
  position: {
    name: string;
    abbreviation: string;
    type: string;
  };
};

type PitchingUsage = {
  games: number;
  gamesStarted: number;
};

type PitcherRole =
  | "Starter"
  | "Reliever"
  | "Hybrid"
  | "Limited Sample";

function getPitcherRole(usage: PitchingUsage): PitcherRole {
  if (usage.games < 5) return "Limited Sample";
  if (usage.gamesStarted === 0) return "Reliever";

  return usage.gamesStarted / usage.games >= 0.5
    ? "Starter"
    : "Hybrid";
}

async function getYankeesPitchingStats(): Promise<Record<number, PitchingUsage>> {
  try {
    const response = await fetch(
      "https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&teamId=147&season=2026&playerPool=ALL",
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return {};

    const data = await response.json();
    const result: Record<number, PitchingUsage> = {};

    for (const entry of data.stats?.[0]?.splits ?? []) {
      const playerId = entry.player?.id;
      if (!playerId) continue;

      result[playerId] = {
        games: Number(entry.stat?.gamesPlayed ?? 0),
        gamesStarted: Number(entry.stat?.gamesStarted ?? 0),
      };
    }

    return result;
  } catch {
    return {};
  }
}

type TeamStatistics = {
  hitting: Record<string, string | number>;
  pitching: Record<string, string | number>;
};

async function getYankeesTeamStats(): Promise<TeamStatistics | null> {
  try {
    const [hittingResponse, pitchingResponse] = await Promise.all([
      fetch(
        "https://statsapi.mlb.com/api/v1/teams/147/stats?stats=season&group=hitting&season=2026",
        { next: { revalidate: 3600 } }
      ),
      fetch(
        "https://statsapi.mlb.com/api/v1/teams/147/stats?stats=season&group=pitching&season=2026",
        { next: { revalidate: 3600 } }
      ),
    ]);

    if (!hittingResponse.ok || !pitchingResponse.ok) return null;

    const [hittingData, pitchingData] = await Promise.all([
      hittingResponse.json(),
      pitchingResponse.json(),
    ]);

    const hitting = hittingData.stats?.[0]?.splits?.[0]?.stat;
    const pitching = pitchingData.stats?.[0]?.splits?.[0]?.stat;

    if (!hitting || !pitching) return null;

    return { hitting, pitching };
  } catch {
    return null;
  }
}

type TeamStanding = {
  team: {
    id: number;
    name: string;
  };
  wins: number;
  losses: number;
  winningPercentage: string;
  divisionRank: string;
  gamesBack: string;
  records?: {
    splitRecords?: {
      type: string;
      wins: number;
      losses: number;
      pct: string;
    }[];
  };
  streak?: {
    streakCode: string;
    streakType: string;
    streakNumber: number;
  };
};

type DivisionStandings = {
  yankees: TeamStanding | null;
  teams: TeamStanding[];
};

async function getYankeesStandings(): Promise<DivisionStandings | null> {
  try {
    const response = await fetch(
      "https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=2026&standingsTypes=regularSeason",
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return null;

    const data = await response.json();

    const division = data.records?.find(
      (record: { division?: { id?: number } }) =>
        record.division?.id === 201
    );

    if (!division) return null;

    const teams: TeamStanding[] = division.teamRecords ?? [];

    return {
      yankees: teams.find((team) => team.team.id === 147) ?? null,
      teams,
    };
  } catch {
    return null;
  }
}

async function getYankeesRoster(): Promise<RosterPlayer[]> {
  try {
    const response = await fetch(
      "https://statsapi.mlb.com/api/v1/teams/147/roster?rosterType=active&hydrate=person",
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.roster ?? [];
  } catch {
    return [];
  }
}

export default async function TeamPage() {
  const [roster, pitchingStats, teamStats, standings] = await Promise.all([
    getYankeesRoster(),
    getYankeesPitchingStats(),
    getYankeesTeamStats(),
    getYankeesStandings(),
  ]);

  const pitchers = roster.filter(
    (player) => player.position.type === "Pitcher"
  );

  const hitters = roster.filter(
    (player) => player.position.type !== "Pitcher"
  );

  function PlayerTable({
    players,
    showPitchingUsage = false,
  }: {
    players: RosterPlayer[];
    showPitchingUsage?: boolean;
  }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
              <th className="px-4 py-4">Player</th>
              <th className="px-4 py-4">Position</th>
              <th className="px-4 py-4">Number</th>
              {showPitchingUsage && (
                <>
                  <th className="px-4 py-4">G</th>
                  <th className="px-4 py-4">GS</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.person.id}
                className="border-b border-white/5 transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 font-semibold text-white">
                  <Link
                    href={`/player/${player.person.id}`}
                    className="group flex items-center gap-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-end justify-center overflow-hidden rounded-full border border-white/10 bg-[#142b49]">
                      <img
                        src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:good/v1/people/${player.person.id}/headshot/67/current`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div>
                      <span className="transition group-hover:text-[#d5b66a]">
                        {player.person.fullName}
                      </span>
                      {showPitchingUsage && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#d5b66a]">
                          {getPitcherRole(
                            pitchingStats[player.person.id] ?? {
                              games: 0,
                              gamesStarted: 0,
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-slate-400">
                  {player.position.abbreviation}
                </td>
                <td className="px-4 py-4 text-sm text-[#d5b66a]">
                  {player.jerseyNumber ?? "—"}
                </td>
                {showPitchingUsage && (
                  <>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {pitchingStats[player.person.id]?.games ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {pitchingStats[player.person.id]?.gamesStarted ?? "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <div className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
            The Major League Club
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            NEW YORK <span className="text-[#d5b66a]">YANKEES</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            An in-depth look at the players representing the Yankees at
            the major league level.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {teamStats && (
          <section className="mb-12">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
                2026 Season
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Team Performance
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                New York Yankees regular-season team statistics.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Batting Average",
                  value: teamStats.hitting.avg,
                  group: "Offense",
                },
                {
                  label: "On-Base Percentage",
                  value: teamStats.hitting.obp,
                  group: "Offense",
                },
                {
                  label: "OPS",
                  value: teamStats.hitting.ops,
                  group: "Offense",
                },
                {
                  label: "Team ERA",
                  value: teamStats.pitching.era,
                  group: "Pitching",
                },
                {
                  label: "WHIP",
                  value: teamStats.pitching.whip,
                  group: "Pitching",
                },
                {
                  label: "Strikeouts",
                  value: Number(teamStats.pitching.strikeOuts).toLocaleString("en-US"),
                  group: "Pitching",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="border border-white/10 bg-[#0c1c33] p-6"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {metric.group}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-[#d5b66a]">
                    {metric.value ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {standings?.yankees && (
          <section className="mb-12">
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
                2026 Regular Season
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Season Record & Standings
              </h2>
            </div>

            {(() => {
              const yankees = standings.yankees;
              const splits = yankees.records?.splitRecords ?? [];
              const home = splits.find((record) => record.type === "home");
              const away = splits.find((record) => record.type === "away");
              const lastTen = splits.find((record) => record.type === "lastTen");
              const streak = yankees.streak;

              return (
                <>
                  <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      {
                        label: "Season Record",
                        value: `${yankees.wins}-${yankees.losses}`,
                      },
                      {
                        label: "Winning Percentage",
                        value: yankees.winningPercentage,
                      },
                      {
                        label: "Division Rank",
                        value: `#${yankees.divisionRank}`,
                      },
                      {
                        label: "Games Behind",
                        value: yankees.gamesBack,
                      },
                      {
                        label: "Home Record",
                        value: home ? `${home.wins}-${home.losses}` : "—",
                      },
                      {
                        label: "Away Record",
                        value: away ? `${away.wins}-${away.losses}` : "—",
                      },
                      {
                        label: "Last 10 Games",
                        value: lastTen
                          ? `${lastTen.wins}-${lastTen.losses}`
                          : "—",
                      },
                      {
                        label: "Current Streak",
                        value: streak?.streakCode ?? "—",
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="border border-white/10 bg-[#0c1c33] p-5"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {metric.label}
                        </p>
                        <p className="mt-3 text-2xl font-bold text-[#d5b66a]">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-white/10 bg-[#0c1c33]">
                    <div className="border-b border-white/10 p-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
                        American League East
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        Division Standings
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
                            <th className="px-5 py-4">Rank</th>
                            <th className="px-5 py-4">Team</th>
                            <th className="px-5 py-4">W</th>
                            <th className="px-5 py-4">L</th>
                            <th className="px-5 py-4">PCT</th>
                            <th className="px-5 py-4">GB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.teams.map((team) => {
                            const isYankees = team.team.id === 147;

                            return (
                              <tr
                                key={team.team.id}
                                className={`border-b border-white/5 ${
                                  isYankees
                                    ? "bg-[#d5b66a]/10"
                                    : "hover:bg-white/[0.03]"
                                }`}
                              >
                                <td className={`px-5 py-4 text-sm ${
                                  isYankees ? "font-bold text-[#d5b66a]" : "text-slate-400"
                                }`}>
                                  {team.divisionRank}
                                </td>
                                <td className={`whitespace-nowrap px-5 py-4 text-sm ${
                                  isYankees ? "font-bold text-[#d5b66a]" : "text-white"
                                }`}>
                                  {team.team.name}
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-300">
                                  {team.wins}
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-300">
                                  {team.losses}
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-300">
                                  {team.winningPercentage}
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-300">
                                  {team.gamesBack}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {teamStats && (
          <section className="mb-12">
            <div className="mb-5">
              <h3 className="text-lg font-bold">
                Additional Team Statistics
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                More detail on the Yankees' offensive production and pitching staff.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                {
                  label: "Runs",
                  value: teamStats.hitting.runs,
                  group: "Offense",
                },
                {
                  label: "Home Runs",
                  value: teamStats.hitting.homeRuns,
                  group: "Offense",
                },
                {
                  label: "RBI",
                  value: teamStats.hitting.rbi,
                  group: "Offense",
                },
                {
                  label: "Saves",
                  value: teamStats.pitching.saves,
                  group: "Pitching",
                },
                {
                  label: "Holds",
                  value: teamStats.pitching.holds,
                  group: "Pitching",
                },
                {
                  label: "Strikeouts / 9",
                  value: teamStats.pitching.strikeoutsPer9Inn,
                  group: "Pitching",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="border border-white/10 bg-[#0c1c33] p-5"
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {metric.group}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {metric.value ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="border border-white/10 bg-[#0c1c33] p-6">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Active Roster
            </p>
            <p className="mt-3 text-4xl font-bold">{roster.length}</p>
          </div>

          <div className="border border-white/10 bg-[#0c1c33] p-6">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Pitchers
            </p>
            <p className="mt-3 text-4xl font-bold">{pitchers.length}</p>
          </div>

          <div className="border border-white/10 bg-[#0c1c33] p-6">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Position Players
            </p>
            <p className="mt-3 text-4xl font-bold">{hitters.length}</p>
          </div>
        </div>

        {roster.length === 0 ? (
          <div className="border border-white/10 bg-[#0c1c33] p-10 text-center">
            <p className="text-slate-300">
              The roster is currently unavailable. Please try again later.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="border border-white/10 bg-[#0c1c33]">
              <div className="border-b border-white/10 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
                  Position Players
                </p>
                <h2 className="mt-2 text-2xl font-bold">Hitters</h2>
              </div>
              <PlayerTable players={hitters} />
            </section>

            <section className="border border-white/10 bg-[#0c1c33]">
              <div className="border-b border-white/10 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
                  Pitching Staff
                </p>
                <h2 className="mt-2 text-2xl font-bold">Pitchers</h2>
              </div>
              <PlayerTable players={pitchers} showPitchingUsage />
            </section>
          </div>
        )}

        <p className="mt-8 text-xs text-slate-500">
          Data provided by MLB Stats API. Roster information is periodically refreshed.
        </p>
      </div>
    </main>
  );
}
