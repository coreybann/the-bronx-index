"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Championships from "./Championships";
import ChampionshipComparison from "./ChampionshipComparison";
import LegendsDirectory from "./LegendsDirectory";
import FranchiseRecords from "./FranchiseRecords";
import HistoricalSeasons from "./HistoricalSeasons";

type HistoryTab = "championships" | "legends" | "records" | "seasons";

export default function HistorySections() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const requestedTab = searchParams.get("tab");

  const activeTab: HistoryTab =
    requestedTab === "legends" ||
    requestedTab === "records" ||
    requestedTab === "seasons"
      ? requestedTab
      : "championships";

  function changeTab(tab: HistoryTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/history?${params.toString()}`, {
      scroll: false,
    });
  }

  const tabs = [
    { id: "championships" as const, label: "Championships" },
    { id: "legends" as const, label: "Yankees Legends" },
    { id: "records" as const, label: "Franchise Records" },
    { id: "seasons" as const, label: "Historical Seasons" },
  ];

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-3 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => changeTab(tab.id)}
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
      {activeTab === "records" && <FranchiseRecords />}
      {activeTab === "seasons" && <HistoricalSeasons />}
    </div>
  );
}
