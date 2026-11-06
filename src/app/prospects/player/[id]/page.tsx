import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMinorLeagueStats,
  getMinorLeagueCareerStats,
} from "@/lib/minorLeagueStats";
import MinorLeaguePerformanceTabs from "../../MinorLeaguePerformanceTabs";
import ProspectHeadshot from "../../ProspectHeadshot";

type Player = {
  id: number;
  fullName: string;
  currentAge?: number;
  birthDate?: string;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  primaryPosition?: {
    name?: string;
    abbreviation?: string;
  };
  batSide?: { description?: string };
  pitchHand?: { description?: string };
};

async function getPlayer(id: string): Promise<Player | null> {
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.people?.[0] ?? null;
  } catch {
    return null;
  }
}

async function ProspectProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();

  const player = await getPlayer(id);
  if (!player) notFound();

  const isPitcher =
    player.primaryPosition?.abbreviation === "P";

  const group = isPitcher ? "pitching" : "hitting";

  const [stats, careerStats] = await Promise.all([
    getMinorLeagueStats(player.id, group),
    getMinorLeagueCareerStats(player.id, group),
  ]);

  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <div className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <Link
            href="/prospects"
            className="text-xs font-semibold uppercase tracking-widest text-[#d5b66a] hover:text-white"
          >
            ← Back to Prospect Directory
          </Link>

          <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
                The Bronx Index · Prospect Profile
              </p>

              <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                {player.fullName}
              </h1>

              <p className="mt-4 text-sm text-slate-400">
                {player.primaryPosition?.name ?? "Player"}
                {player.currentAge
                  ? ` · Age ${player.currentAge}`
                  : ""}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/10 bg-[#142a47] p-6">
              <ProspectHeadshot
                playerId={player.id}
                playerName={player.fullName}
                size="large"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0b1d36] p-6">
          <h2 className="text-xl font-bold text-white">
            Player Information
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ["Age", player.currentAge],
              ["Position", player.primaryPosition?.name],
              ["Bats", player.batSide?.description],
              ["Throws", player.pitchHand?.description],
              ["Height", player.height],
              ["Weight", player.weight ? `${player.weight} lbs` : undefined],
              [
                "Born",
                player.birthDate
                  ? new Date(`${player.birthDate}T12:00:00`).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )
                  : undefined,
              ],
              [
                "Birthplace",
                [
                  player.birthCity,
                  player.birthStateProvince,
                  player.birthCountry,
                ]
                  .filter(Boolean)
                  .join(", "),
              ],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d5b66a]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <MinorLeaguePerformanceTabs
          stats={stats}
          careerStats={careerStats}
          isPitcher={isPitcher}
        />
      </section>
    </main>
  );
}


export default function ProspectProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#07152b] px-6 py-16 text-[#d5b66a]">
          Loading prospect profile...
        </main>
      }
    >
      <ProspectProfile params={params} />
    </Suspense>
  );
}
