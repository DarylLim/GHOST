"use client";

import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "status", label: "STATUS" },
  { id: "intel", label: "INTEL" },
  { id: "chat", label: "GHOST" },
];

export function TabNav({
  active,
  onChange,
  alertCount,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  alertCount: number;
}) {
  return (
    <div className="flex border-b border-ghost-border">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 py-2 text-xs font-mono uppercase tracking-widest
            border-b-2 transition-colors
            ${
              active === tab.id
                ? "border-ghost-accent text-ghost-accent"
                : "border-transparent text-ghost-text-secondary hover:text-ghost-text"
            }
          `}
        >
          {tab.label}
          {tab.id === "intel" && alertCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] bg-ghost-critical text-white rounded-sm">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
