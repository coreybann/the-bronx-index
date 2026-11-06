import type { MinorLeagueStatLine } from "@/lib/minorLeagueStats";

type Props = {
  stats: MinorLeagueStatLine[];
  careerStats: Record<string, string | number> | null;
  isPitcher: boolean;
};

export default function MinorLeagueStatsTable({
  stats,
  careerStats,
  isPitcher,
}: Props) {
  const columns = isPitcher
    ? [
        ["G", "gamesPlayed"],
        ["GS", "gamesStarted"],
        ["IP", "inningsPitched"],
        ["ERA", "era"],
        ["WHIP", "whip"],
        ["SO", "strikeOuts"],
        ["BB", "baseOnBalls"],
        ["HR", "homeRuns"],
      ]
    : [
        ["G", "gamesPlayed"],
        ["PA", "plateAppearances"],
        ["AB", "atBats"],
        ["H", "hits"],
        ["HR", "homeRuns"],
        ["RBI", "rbi"],
        ["BB", "baseOnBalls"],
        ["SO", "strikeOuts"],
        ["SB", "stolenBases"],
        ["AVG", "avg"],
        ["OBP", "obp"],
        ["SLG", "slg"],
        ["OPS", "ops"],
      ];

  if (!stats.length) {
    return (
      <p className="text-sm text-slate-400">
        Minor league statistics are not available for this player.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-[#142a47] text-xs uppercase tracking-wider text-[#d5b66a]">
          <tr>
            <th className="px-4 py-4">Season</th>
            <th className="px-4 py-4">Team / Level</th>
            {columns.map(([label]) => (
              <th key={label} className="px-3 py-4 text-right">
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {stats.map((line, index) => (
            <tr
              key={`${line.season}-${line.team ?? "combined"}-${index}`}
              className={
                line.isCombined
                  ? "border-t border-[#d5b66a]/30 bg-[#d5b66a]/10 font-semibold"
                  : "border-t border-white/5 text-slate-300"
              }
            >
              <td className="whitespace-nowrap px-4 py-3">
                {line.season}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                {line.isCombined
                  ? "All Minors · Combined"
                  : `${line.team ?? "Unknown Team"} · ${line.level}`}
              </td>

              {columns.map(([, key]) => (
                <td
                  key={key}
                  className="px-3 py-3 text-right tabular-nums"
                >
                  {line.stats[key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {careerStats && (
          <tfoot>
            <tr className="border-t-2 border-[#d5b66a]/60 bg-[#d5b66a]/15 font-bold text-white">
              <td className="whitespace-nowrap px-4 py-4">
                Career
              </td>

              <td className="whitespace-nowrap px-4 py-4 text-[#d5b66a]">
                All Minors · Career Total
              </td>

              {columns.map(([, key]) => (
                <td
                  key={key}
                  className="px-3 py-4 text-right tabular-nums"
                >
                  {careerStats[key] ?? "—"}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
