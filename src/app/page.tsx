
const sections = [
  {
    number: "01",
    title: "The Major League Club",
    description:
      "The complete picture of the Yankees roster, from everyday players to the pitching staff.",
    detail: "ROSTER · PLAYERS · STATISTICS",
    href: "/team",
  },
  {
    number: "02",
    title: "The Farm System",
    description:
      "Explore the organization's prospects, minor league affiliates, draft history, and player development.",
    detail: "PROSPECTS · AFFILIATES · DRAFT",
    href: "/prospects",
  },
  {
    number: "03",
    title: "The Franchise",
    description:
      "Explore the people, seasons, championships, records, and moments that shaped the Yankees.",
    detail: "HISTORY · RECORDS · LEGENDS",
    href: "/history",
  },
  {
    number: "04",
    title: "Front Office",
    description:
      "A closer look at contracts, payroll, transactions, roster construction, and organizational decisions.",
    detail: "CONTRACTS · PAYROLL · TRANSACTIONS",
    href: "/front-office",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07152b] text-white">
      {/* Top announcement */}
      <div className="border-b border-white/10 bg-[#0b1d36] px-5 py-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c5a253]">
          An independent resource dedicated to the New York Yankees
        </p>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(197,162,83,0.10),transparent_45%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-32">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <div className="h-px w-10 bg-[#c5a253]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
                A deeper look at the Yankees
              </span>
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              EVERYTHING
              <br />
              <span className="text-[#d5b66a]">IN PINSTRIPES.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-8 text-slate-300">
              One organization. Every player, every season, every decision.
              Explore the history, people, numbers, and future of the New York
              Yankees in one place.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/team"
                className="bg-[#c5a253] px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#07152b] transition hover:bg-[#dfc47e]"
              >
                Explore the Yankees →
              </a>
              <a
                href="/history"
                className="border border-white/20 px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:border-[#c5a253] hover:text-[#d5b66a]"
              >
                Discover the history
              </a>
            </div>
          </div>

          {/* Editorial feature panel */}
          <div className="relative">
            <div className="border border-white/10 bg-[#0d203b] p-8 sm:p-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d5b66a]">
                  The Bronx Index
                </span>
                <span className="text-[10px] tracking-widest text-slate-500">
                  NY · 001
                </span>
              </div>

              <div className="py-12 text-center">
                <div className="text-8xl font-black tracking-tighter text-white sm:text-9xl">
                  NY
                </div>
                <div className="mx-auto mt-5 h-px w-20 bg-[#c5a253]" />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">
                  New York Yankees
                </p>
              </div>

              <div className="grid grid-cols-3 border-t border-white/10 pt-6 text-center">
                <div>
                  <div className="text-xl font-bold">1903</div>
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">
                    Founded
                  </div>
                </div>
                <div className="border-x border-white/10">
                  <div className="text-xl font-bold">27</div>
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">
                    World Series
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold">1</div>
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-slate-500">
                    Organization
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 -z-10 h-full w-full border border-[#c5a253]/30" />
          </div>
        </div>
      </section>

      {/* Main sections */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
              Explore the organization
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              The Yankees, in depth.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Everything you want to know about the organization, organized in
            one destination.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <a
              key={section.number}
              href={section.href}
              className="group border border-white/10 bg-[#0c1c33] p-8 transition duration-300 hover:border-[#c5a253]/60 hover:bg-[#102440]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-[#c5a253]">
                  {section.number}
                </span>
                <span className="text-xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-[#d5b66a]">
                  →
                </span>
              </div>

              <h3 className="mt-8 text-2xl font-bold">{section.title}</h3>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                {section.description}
              </p>

              <div className="mt-8 border-t border-white/10 pt-5 text-[9px] font-bold tracking-[0.2em] text-[#c5a253]">
                {section.detail}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-y border-white/10 bg-[#0b1d36]">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d5b66a]">
            More than a box score
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Understand the organization.
            <span className="text-[#d5b66a]"> Discover the details.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400">
            From the earliest days of the franchise to the next generation of
            Yankees, The Bronx Index brings every part of the organization
            together.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-6 py-10 sm:flex-row sm:items-center lg:px-10">
        <div>
          <div className="text-sm font-black tracking-[0.2em]">
            THE BRONX <span className="text-[#d5b66a]">INDEX</span>
          </div>
          <p className="mt-2 text-[10px] tracking-wider text-slate-500">
            AN INDEPENDENT NEW YORK YANKEES RESOURCE
          </p>
        </div>
        <p className="text-[10px] leading-5 text-slate-500">
          Not affiliated with or endorsed by the New York Yankees or Major
          League Baseball.
          <br />
          © 2026 The Bronx Index. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
