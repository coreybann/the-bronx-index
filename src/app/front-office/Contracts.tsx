"use client";

import { useMemo, useState } from "react";
import {
  yankeesArbitrationProjections,
  yankeesContracts,
  yankeesPreArbitrationPlayers,
} from "@/lib/yankeesContracts";

const YEARS = [2027, 2028, 2029, 2030, 2031, 2032, 2033];

function formatSalary(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function Contracts() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");

  const positions = [
    "All",
    ...Array.from(
      new Set([
        ...yankeesContracts.map((player) => player.position),
        ...yankeesArbitrationProjections.map((player) => player.position),
        ...yankeesPreArbitrationPlayers.map((player) => player.position),
      ])
    ).sort(),
  ];

  const filteredContracts = useMemo(
    () =>
      yankeesContracts.filter((player) => {
        const matchesSearch = player.playerName
          .toLowerCase()
          .includes(search.toLowerCase());

        return (
          matchesSearch &&
          (position === "All" || player.position === position)
        );
      }),
    [search, position]
  );

  const filteredArbitration = useMemo(
    () =>
      yankeesArbitrationProjections.filter((player) => {
        const matchesSearch = player.playerName
          .toLowerCase()
          .includes(search.toLowerCase());

        return (
          matchesSearch &&
          (position === "All" || position === player.position)
        );
      }),
    [search, position]
  );

  const filteredPreArbitration = useMemo(
    () =>
      yankeesPreArbitrationPlayers.filter((player) => {
        const matchesSearch = player.playerName
          .toLowerCase()
          .includes(search.toLowerCase());

        return (
          matchesSearch &&
          (position === "All" || player.position === position)
        );
      }),
    [search, position]
  );

  const projectedArbitrationTotal = filteredArbitration.reduce(
    (total, player) => total + player.projectedSalary,
    0
  );

  const totals = YEARS.map((year) => {
    let guaranteed = 0;
    let conditional = 0;

    for (const player of filteredContracts) {
      const commitment = player.salariesByYear[year];

      if (!commitment) continue;

      if (commitment.status === "guaranteed") {
        guaranteed += commitment.amount;
      } else if (commitment.status === "club-option") {
        guaranteed += commitment.guaranteedBuyout ?? 0;
        conditional +=
          commitment.amount - (commitment.guaranteedBuyout ?? 0);
      } else {
        conditional += commitment.amount;
      }
    }

    return { guaranteed, conditional };
  });

  return (
    <section>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
          Yankees Baseball Operations
        </p>

        <h2 className="mt-3 text-3xl font-black text-white">
          Contract Commitments
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          Compare annual Yankees payroll charges across future seasons.
          Guaranteed commitments and conditional options are identified
          separately.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-white">
            Annual Payroll Breakdown
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {filteredContracts.length + filteredArbitration.length + filteredPreArbitration.length} players displayed · 2027–2033
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players..."
            aria-label="Search contracts"
            className="rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white outline-none focus:border-[#d5b66a]"
          />

          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            aria-label="Filter by position"
            className="rounded-lg border border-white/10 bg-[#0b1d36] px-4 py-3 text-sm text-white outline-none focus:border-[#d5b66a]"
          >
            {positions.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Positions" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1d36]">
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-[#102440]">
              <th className="sticky left-0 z-20 min-w-[190px] border-r border-white/10 bg-[#102440] px-5 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Players
              </th>

              {YEARS.map((year) => (
                <th
                  key={year}
                  className="min-w-[125px] px-4 py-5 text-right text-sm font-bold text-white"
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredContracts.map((player) => (
              <tr
                key={player.playerId}
                className="border-b border-white/5 transition hover:bg-white/[0.03]"
              >
                <td className="sticky left-0 z-10 border-r border-white/10 bg-[#0b1d36] px-5 py-4">
                  <a
                    href={`/player/${player.playerId}`}
                    className="font-semibold text-white transition hover:text-[#d5b66a]"
                  >
                    {player.playerName}
                  </a>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {player.position}
                  </p>
                  {player.contractNote && (
                    <p className="mt-1 max-w-[180px] text-[10px] leading-4 text-slate-500">
                      {player.contractNote}
                    </p>
                  )}
                </td>

                {YEARS.map((year) => {
                  const commitment = player.salariesByYear[year];

                  return (
                    <td
                      key={year}
                      title={commitment?.note ?? ""}
                      className={`px-4 py-4 text-right text-sm tabular-nums ${
                        commitment
                          ? commitment.status !== "guaranteed"
                            ? "font-semibold text-amber-300"
                            : "font-semibold text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {commitment ? (
                        <>
                          {formatSalary(commitment.amount)}
                          {commitment.status !== "guaranteed" && (
                            <span className="ml-1 text-[10px] text-amber-300">
                              *
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {filteredArbitration.length > 0 && (
              <>
                <tr className="border-t border-amber-400/30 bg-[#14243b]">
                  <td
                    colSpan={YEARS.length + 1}
                    className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-amber-300"
                  >
                    Projected Arbitration · 2027
                  </td>
                </tr>

                {filteredArbitration.map((player) => (
                  <tr
                    key={`arb-${player.playerId}`}
                    className="border-b border-white/5 bg-amber-400/[0.025]"
                  >
                    <td className="sticky left-0 z-10 border-r border-white/10 bg-[#102038] px-5 py-4">
                      <a
                        href={`/player/${player.playerId}`}
                        className="font-semibold text-white hover:text-amber-300"
                      >
                        {player.playerName}
                      </a>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {player.position} · ARBITRATION
                      </p>
                    </td>

                    {YEARS.map((year) => (
                      <td
                        key={year}
                        className={`px-4 py-4 text-right text-sm tabular-nums ${
                          year === 2027
                            ? "font-semibold text-amber-300"
                            : "text-slate-600"
                        }`}
                      >
                        {year === 2027
                          ? formatSalary(player.projectedSalary)
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="bg-[#14243b]">
                  <td className="sticky left-0 z-10 border-r border-white/10 bg-[#14243b] px-5 py-4 text-xs font-bold uppercase tracking-wider text-amber-300">
                    Projected Arbitration Total
                  </td>
                  {YEARS.map((year) => (
                    <td
                      key={year}
                      className="px-4 py-4 text-right text-sm font-bold tabular-nums text-amber-300"
                    >
                      {year === 2027
                        ? formatSalary(projectedArbitrationTotal)
                        : "—"}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {filteredPreArbitration.length > 0 && (
              <>
                <tr className="border-t border-sky-400/30 bg-[#14243b]">
                  <td
                    colSpan={YEARS.length + 1}
                    className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-sky-300"
                  >
                    Pre-Arbitration Candidates · 2027
                  </td>
                </tr>

                {filteredPreArbitration.map((player) => (
                  <tr
                    key={`prearb-${player.playerName}`}
                    className="border-b border-white/5 bg-sky-400/[0.025]"
                  >
                    <td className="sticky left-0 z-10 border-r border-white/10 bg-[#102038] px-5 py-4">
                      <span className="font-semibold text-white">
                        {player.playerName}
                      </span>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {player.position} · PRE-ARBITRATION
                      </p>
                    </td>

                    {YEARS.map((year) => (
                      <td
                        key={year}
                        className={`px-4 py-4 text-right text-sm ${
                          year === 2027
                            ? "font-semibold text-sky-300"
                            : "text-slate-600"
                        }`}
                      >
                        {year === 2027 ? "TBD" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {(filteredContracts.length > 0 || filteredArbitration.length > 0) && (
              <>
                <tr className="border-t border-[#d5b66a]/30 bg-[#102440]">
                  <td className="sticky left-0 z-10 border-r border-white/10 bg-[#102440] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#d5b66a]">
                    Guaranteed Commitments
                  </td>

                  {totals.map((total, index) => (
                    <td
                      key={YEARS[index]}
                      className="px-4 py-4 text-right text-sm font-bold tabular-nums text-[#d5b66a]"
                    >
                      {total.guaranteed ? formatSalary(total.guaranteed) : "—"}
                    </td>
                  ))}
                </tr>

                <tr className="bg-[#102440]">
                  <td className="sticky left-0 z-10 border-r border-white/10 bg-[#102440] px-5 py-4 text-xs font-bold uppercase tracking-wider text-amber-300">
                    Conditional Commitments
                  </td>

                  {totals.map((total, index) => (
                    <td
                      key={YEARS[index]}
                      className="px-4 py-4 text-right text-sm font-bold tabular-nums text-amber-300"
                    >
                      {total.conditional
                        ? formatSalary(total.conditional)
                        : "—"}
                    </td>
                  ))}
                </tr>
              </>
            )}

            {filteredContracts.length === 0 && filteredArbitration.length === 0 && filteredPreArbitration.length === 0 && (
              <tr>
                <td
                  colSpan={YEARS.length + 1}
                  className="px-5 py-12 text-center text-sm text-slate-400"
                >
                  No matching players found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-2 text-xs leading-6 text-slate-500">
        <p>
          Payroll charges may differ from base cash salaries because of
          signing-bonus allocations. Guaranteed Commitments includes guaranteed
          buyouts; Conditional Commitments shows the additional amount if an
          option is exercised.
        </p>
        <p>
          * Stanton&apos;s 2028 option is $25M, with a $10M buyout if declined.
          Miami owes the Yankees $3M toward Stanton&apos;s 2027 salary; displayed
          player charges are gross, before that offset.
        </p>
        <p>
          Cody Bellinger has player opt-outs after 2027 and 2028. His future
          salary schedule depends on those decisions.
        </p>
        <p>
          Guaranteed and conditional contract totals are separate from
          projected arbitration salaries. Arbitration figures are estimates,
          not agreed contracts. Pre-arbitration candidates remain unverified and have no assigned salary. These totals cover only the players displayed,
          not the complete Yankees payroll or luxury-tax calculation.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-400">
        <a
          href="https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-300 hover:text-white"
        >
          SNY 2027 arbitration projections
        </a>
        <a
          href="https://www.fangraphs.com/roster-resource/payroll/yankees?season=2026"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d5b66a] hover:text-white"
        >
          FanGraphs RosterResource
        </a>
        <a
          href="https://www.mlb.com/amp/news/giancarlo-stanton-left-calf-strain-could-end-2026-season.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d5b66a] hover:text-white"
        >
          MLB.com Stanton contract details
        </a>
        <a
          href="https://apnews.com/article/905445562bf6d1e96409c5643f8934a8"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d5b66a] hover:text-white"
        >
          AP Bellinger contract details
        </a>
      </div>
    </section>
  );
}
