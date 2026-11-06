import type { MinorLeagueStatLine } from "@/lib/minorLeagueStats";
import {
  getAdvancedHitting,
  getAdvancedPitching,
} from "@/lib/minorLeagueAdvanced";

type Props = {
  stats: MinorLeagueStatLine[];
  careerStats: Record<string, string | number> | null;
  isPitcher: boolean;
};

export default function MinorLeagueAdvancedTable({
  stats,
  careerStats,
  isPitcher,
}: Props) {
  const columns = isPitcher
    ? ["K/9", "BB/9", "HR/9", "K/BB", "K%", "BB%"]
    : ["ISO", "BB%", "K%", "HR%", "BABIP", "SB%"];

  if (!stats.length) {
    return (
      <p className="text-sm text-slate-400">
        Advanced minor league statistics are not available.
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
            {columns.map((column) => (
              <th key={column} className="px-4 py-4 text-right">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {stats.map((line, index) => {
            const advanced = isPitcher
              ? getAdvancedPitching(line.stats)
              : getAdvancedHitting(line.stats);

            return (
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

                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-4 py-3 text-right tabular-nums"
                  >
                    {advanced[column as keyof typeof advanced] ?? "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>

        {careerStats && (() => {
          const advanced = isPitcher
            ? getAdvancedPitching(careerStats)
            : getAdvancedHitting(careerStats);

          return (
            <tfoot>
              <tr className="border-t-2 border-[#d5b66a]/60 bg-[#d5b66a]/15 font-bold text-white">
                <td className="whitespace-nowrap px-4 py-4">
                  Career
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-[#d5b66a]">
                  All Minors · Career Total
                </td>

                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-4 py-4 text-right tabular-nums"
                  >
                    {advanced[column as keyof typeof advanced] ?? "—"}
                  </td>
                ))}
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </div>
  );
}
