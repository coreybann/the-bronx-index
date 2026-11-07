"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { label: "Home", href: "/", page: true },
  { label: "Team", href: "/team", page: true },
  { label: "Prospects", href: "/prospects", page: true },
  { label: "History", href: "/history", page: true },
  { label: "Front Office", href: "/front-office", page: true },
];

export default function SiteNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1d36]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="group shrink-0">
          <div className="text-lg font-black tracking-[0.18em] text-white">
            THE BRONX
          </div>
          <div className="mt-0.5 text-[9px] font-semibold tracking-[0.48em] text-[#c5a253]">
            INDEX
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = link.page && pathname === link.href;

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`border-b-2 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
                  active
                    ? "border-[#d5b66a] text-[#d5b66a]"
                    : "border-transparent text-slate-300 hover:text-[#d5b66a]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border border-[#c5a253]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#d5b66a] sm:block">
          NYY · EST. 1903
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center border border-white/15 text-xl text-white md:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#0b1d36] px-6 py-3 md:hidden">
          {links.map((link) => {
            const active = link.page && pathname === link.href;

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block border-b border-white/5 py-4 text-xs font-bold uppercase tracking-widest ${
                  active ? "text-[#d5b66a]" : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
