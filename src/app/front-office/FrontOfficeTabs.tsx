"use client";

import { useState } from "react";
import Contracts from "./Contracts";
import Transactions from "./Transactions";
import RosterConstructor from "./RosterConstructor";

type FrontOfficeTab = "contracts" | "transactions" | "roster";

export default function FrontOfficeTabs() {
  const [activeTab, setActiveTab] =
    useState<FrontOfficeTab>("contracts");

  const tabs: { id: FrontOfficeTab; label: string }[] = [
    { id: "contracts", label: "Contracts" },
    { id: "transactions", label: "Transactions" },
    { id: "roster", label: "Roster Construction" },
  ];

  return (
    <div>
      <div className="mb-10 flex gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-5 py-4 text-sm font-bold transition ${
              activeTab === tab.id
                ? "border-[#d5b66a] text-[#d5b66a]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "contracts" ? (
        <Contracts />
      ) : activeTab === "transactions" ? (
        <Transactions />
      ) : (
        <RosterConstructor />
      )}
    </div>
  );
}
