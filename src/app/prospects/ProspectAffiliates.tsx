"use client";

import Link from "next/link";
import { useState } from "react";
import type { YankeesProspect } from "@/lib/yankeesProspects";
import type { YankeesAffiliateStanding } from "@/lib/yankeesAffiliateStandings";

type Props = {
  players: YankeesProspect[];
  standings: YankeesAffiliateStanding[];
};

export default function ProspectAffiliates({
  players,
  standings,
}: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d5b66a]">
          Yankees Player Development
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          2026 Minor League Affiliates
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Explore the Yankees farm system by affiliate, including
          team records, division standings, and player rosters.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {standings.map((team) => {
          const roster = players
            .filter((player) =>
              player.affiliates.some(
                (affiliate) => affiliate.id === team.id
              )
            )
            .sort((a, b) => a.name.localeCompare(b.name));

          const expanded = expandedId === team.id;

          return (
            <div
              key={team.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1d30]"
            >
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#d5b66a]">
                  {team.level}
                </p>

                <h3 className="mt-2 text-lg font-bold text-white">
                  {team.name}
                </h3>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Record",
                      value:
                        team.wins !== null && team.losses !== null
                          ? `${team.wins}-${team.losses}`
                          : "—",
                    },
                    {
                      label: "Win %",
                      value: team.winningPercentage ?? "—",
                    },
                    {
                      label: "Division",
                      value: team.divisionRank
                        ? `#${team.divisionRank}`
                        : "—",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/5 bg-white/5 p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {stat.label}
                      </p>

                      <p className="mt-2 text-xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : team.id)
                  }
                  aria-expanded={expanded}
                  className="mt-6 w-full rounded-lg border border-[#d5b66a]/30 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#d5b66a] transition hover:bg-[#d5b66a]/10"
                >
                  {expanded
                    ? "Hide Roster"
                    : `View Roster (${roster.length})`}
                </button>
              </div>

              {expanded && (
                <div className="max-h-96 overflow-y-auto border-t border-white/10 px-6 py-4">
                  {roster.length ? (
                    <div className="space-y-1">
                      {roster.map((player) => (
                        <Link
                          key={player.id}
                          href={`/prospects/player/${player.id}`}
                          className="flex items-center justify-between rounded-lg px-3 py-3 text-sm transition hover:bg-white/5"
                        >
                          <span className="font-medium text-white">
                            {player.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {player.position}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="py-5 text-sm text-slate-400">
                      No roster data available for this affiliate.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Source: MLB Stats API. Records reflect the 2026 regular season.
        Rosters reflect players associated with each affiliate during
        the 2026 season, not necessarily the current active roster.
      </p>
    </section>
  );
}
