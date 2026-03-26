"use client";

import type { GhostAlert } from "@/lib/types";

const SEVERITY_COLORS = {
  critical: "border-l-ghost-critical",
  warning: "border-l-ghost-warning",
  info: "border-l-ghost-accent",
};

const SEVERITY_ICONS = {
  critical: "!",
  warning: "!",
  info: "i",
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

export function AlertCard({
  alert,
  onDismiss,
}: {
  alert: GhostAlert;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`
        p-2 bg-ghost-surface border border-ghost-border border-l-2
        ${SEVERITY_COLORS[alert.severity]} rounded
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className={`
              shrink-0 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-sm
              ${
                alert.severity === "critical"
                  ? "bg-ghost-critical text-white"
                  : alert.severity === "warning"
                    ? "bg-ghost-warning text-black"
                    : "bg-ghost-surface-3 text-ghost-accent"
              }
            `}
          >
            {SEVERITY_ICONS[alert.severity]}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ghost-text truncate">
                {alert.title}
              </span>
              <span className="text-[10px] text-ghost-text-secondary shrink-0">
                {timeAgo(alert.timestamp)}
              </span>
            </div>
            <p className="text-[11px] text-ghost-text-secondary mt-0.5 leading-tight">
              {alert.message}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="shrink-0 text-ghost-text-secondary hover:text-ghost-text text-xs p-0.5"
        >
          x
        </button>
      </div>
    </div>
  );
}
