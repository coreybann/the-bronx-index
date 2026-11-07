import type { Metadata } from "next";
import HistorySections from "./HistorySections";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Yankees History | The Bronx Index",
  description:
    "Explore New York Yankees championships, legendary players, franchise records, and historical seasons on The Bronx Index.",
};

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <section className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
            The Bronx Index / Franchise History
          </p>

          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">
            THE <span className="text-[#d5b66a]">LEGACY.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Explore the championships, legendary players, franchise records,
            and defining seasons that shaped the history of the New York Yankees.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <Suspense
          fallback={
            <p className="text-sm text-slate-400">
              Loading Yankees history...
            </p>
          }
        >
          <HistorySections />
        </Suspense>
      </section>
    </main>
  );
}
