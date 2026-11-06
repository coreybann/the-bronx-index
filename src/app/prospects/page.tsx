import type { Metadata } from "next";
import ProspectDirectory from "./ProspectDirectory";
import { getYankeesProspects } from "@/lib/yankeesProspects";

export const metadata: Metadata = {
  title: "Yankees Prospects | The Bronx Index",
  description:
    "Explore the New York Yankees farm system, top prospects, minor league statistics, and player development.",
};

export default async function ProspectsPage() {
  const players = await getYankeesProspects(2026);
  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <section className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
            The Bronx Index / Player Development
          </p>

          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">
            THE FARM <span className="text-[#d5b66a]">SYSTEM.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            A comprehensive look at the future of the New York Yankees.
            Explore organizational prospects, minor league performance,
            scouting evaluations, and player development.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <ProspectDirectory players={players} />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
          Yankees Prospect Development
        </p>

        <h2 className="mt-4 text-3xl font-bold">
          Inside the Yankees farm system
        </h2>

        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">
          This section will bring together prospect rankings, minor league
          statistics, scouting profiles, and organizational development
          analysis in one destination.
        </p>
      </section>
    </main>
  );
}
