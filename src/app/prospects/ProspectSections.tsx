"use client";

import { useState } from "react";
import type { YankeesProspect } from "@/lib/yankeesProspects";
import ProspectDirectory from "./ProspectDirectory";
import ProspectLeaderboards from "./leaderboards/ProspectLeaderboards";

type Props = {
  players: YankeesProspect[];
};

export default function ProspectSections({ players }: Props) {
  const [activeTab, setActiveTab] = useState<
    "directory" | "leaderboards"
  >("directory");

  const tabs = [
    { id: "directory" as const, label: "Prospect Directory" },
    { id: "leaderboards" as const, label: "Minor League Leaderboards" },
  ];

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-3 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {activeTab === "directory" ? (
        <ProspectDirectory players={players} />
      ) : (
        <ProspectLeaderboards />
      )}
    </div>
  );
}
