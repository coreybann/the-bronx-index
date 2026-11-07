import type { Metadata } from "next";
import FrontOfficeTabs from "./FrontOfficeTabs";

export const metadata: Metadata = {
  title: "Yankees Front Office | The Bronx Index",
  description:
    "Explore New York Yankees contracts, payroll, transactions, and roster construction.",
};

export default function FrontOfficePage() {
  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      <section className="border-b border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
            The Bronx Index / Baseball Operations
          </p>

          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">
            FRONT <span className="text-[#d5b66a]">OFFICE.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Explore the business of building the New York Yankees.
            Analyze player contracts, payroll commitments, transactions,
            and roster construction decisions.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <FrontOfficeTabs />
      </section>
    </main>
  );
}
