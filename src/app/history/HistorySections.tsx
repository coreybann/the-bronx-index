"use client";

import { useState } from "react";
import Championships from "./Championships";
import ChampionshipComparison from "./ChampionshipComparison";
import LegendsDirectory from "./LegendsDirectory";

type HistoryTab = "championships" | "legends";

export default function HistorySections() {
  const [activeTab, setActiveTab] =
    useState<HistoryTab>("championships");

  const tabs = [
    { id: "championships" as const, label: "Championships" },
    { id: "legends" as const, label: "Yankees Legends" },
  ];

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-3 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`border-b-2 px-5 py-4 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === tab.id
                ? "border-[#d5b66a] text-[#d5b66a]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "championships" && (
        <>
          <Championships />
          <div className="mt-16">
            <ChampionshipComparison />
          </div>
        </>
      )}

      {activeTab === "legends" && <LegendsDirectory />}
    </div>
  );
}
