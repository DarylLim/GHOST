"use client";

import type { FuelState } from "@/lib/types";

export function FuelGauge({ fuel }: { fuel: FuelState | null }) {
  if (!fuel) {
    return (
      <div className="p-2 bg-ghost-surface border border-ghost-border rounded">
        <div className="text-xs text-ghost-text-secondary uppercase tracking-wider mb-1">Fuel</div>
        <div className="text-xs text-ghost-text-secondary">No data</div>
      </div>
    );
  }

  const color =
    fuel.percent < 20
      ? "bg-ghost-critical"
      : fuel.percent < 50
        ? "bg-ghost-warning"
        : "bg-ghost-safe";

  const textColor =
    fuel.percent < 20
      ? "text-ghost-critical"
      : fuel.percent < 50
        ? "text-ghost-warning"
        : "text-ghost-safe";

  return (
    <div className="p-2 bg-ghost-surface border border-ghost-border rounded">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-ghost-text-secondary uppercase tracking-wider">Fuel</span>
        <span className={`text-xs font-mono ${textColor}`}>
          {fuel.percent}% — {fuel.estimatedWarps} warp{fuel.estimatedWarps !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="h-1.5 bg-ghost-surface-3 rounded-sm overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${fuel.percent}%` }}
        />
      </div>
      <div className="text-[10px] text-ghost-text-secondary mt-0.5 font-mono">
        {fuel.current}/{fuel.max}
      </div>
    </div>
  );
}
