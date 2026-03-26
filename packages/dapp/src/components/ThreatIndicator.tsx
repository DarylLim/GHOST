"use client";

import type { EnvironmentState } from "@/lib/types";

export function ThreatIndicator({ env }: { env: EnvironmentState }) {
  const level = env.threatLevel;
  const color =
    level === 0
      ? "text-ghost-safe"
      : level < 30
        ? "text-ghost-warning"
        : level < 70
          ? "text-ghost-warning"
          : "text-ghost-critical";

  const label =
    level === 0
      ? "CLEAR"
      : level < 30
        ? "LOW"
        : level < 70
          ? "MODERATE"
          : "HIGH";

  return (
    <div className="p-2 bg-ghost-surface border border-ghost-border rounded">
      <div className="text-xs text-ghost-text-secondary uppercase tracking-wider mb-1">
        Threat Assessment
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              level > 0 ? "animate-pulse-glow" : ""
            } ${
              level === 0
                ? "bg-ghost-safe"
                : level < 70
                  ? "bg-ghost-warning"
                  : "bg-ghost-critical"
            }`}
          />
          <span className={`text-sm font-mono ${color}`}>
            {level}/100
          </span>
          <span className={`text-xs ${color}`}>{label}</span>
        </div>
        <div className="text-[10px] text-ghost-text-secondary font-mono">
          {env.hostileCount > 0 && (
            <span className="text-ghost-critical mr-2">
              {env.hostileCount} hostile{env.hostileCount > 1 ? "s" : ""}
            </span>
          )}
          {env.feralAIDetected && (
            <span className="text-ghost-warning">FERAL AI</span>
          )}
        </div>
      </div>
    </div>
  );
}
