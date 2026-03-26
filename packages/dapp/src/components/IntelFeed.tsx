"use client";

import { useAlerts } from "@/hooks/useAlerts";
import { AlertCard } from "./AlertCard";
import type { GhostAlert } from "@/lib/types";

const FILTERS = [
  { id: "all" as const, label: "All" },
  { id: "threat" as const, label: "Threats" },
  { id: "fuel" as const, label: "Fuel" },
  { id: "shell" as const, label: "Shell" },
  { id: "tutorial" as const, label: "Tutorial" },
];

export function IntelFeed({
  alerts: rawAlerts,
  walletAddress,
}: {
  alerts: GhostAlert[];
  walletAddress: string | null;
}) {
  const { alerts, filter, setFilter, dismiss } = useAlerts(
    rawAlerts,
    walletAddress
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="flex gap-1 p-2 border-b border-ghost-border">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              px-2 py-0.5 text-[10px] font-mono uppercase rounded-sm
              ${
                filter === f.id
                  ? "bg-ghost-accent text-black"
                  : "bg-ghost-surface-2 text-ghost-text-secondary hover:text-ghost-text"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {alerts.length === 0 ? (
          <div className="text-center text-ghost-text-secondary text-xs py-8">
            {filter === "all"
              ? "No active alerts. Space is quiet... for now."
              : `No ${filter} alerts.`}
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
          ))
        )}
      </div>
    </div>
  );
}
