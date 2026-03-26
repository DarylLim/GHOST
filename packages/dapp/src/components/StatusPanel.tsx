"use client";

import type { PlayerContext, GhostAlert } from "@/lib/types";
import { FuelGauge } from "./FuelGauge";
import { HealthBars } from "./HealthBars";
import { ThreatIndicator } from "./ThreatIndicator";
import { AlertCard } from "./AlertCard";

export function StatusPanel({
  context,
  alerts,
  wsStatus,
  onDismissAlert,
}: {
  context: PlayerContext | null;
  alerts: GhostAlert[];
  wsStatus: string;
  onDismissAlert: (id: string) => void;
}) {
  if (!context) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-ghost-text-secondary text-sm text-center">
          <div className="text-ghost-accent font-mono text-lg mb-2">GHOST</div>
          <div>Waiting for connection...</div>
        </div>
      </div>
    );
  }

  const latestAlerts = alerts.filter((a) => !a.dismissed).slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {/* Connection status */}
      <div className="flex items-center justify-between text-[10px] font-mono text-ghost-text-secondary">
        <span>
          {context.location
            ? `${context.location.systemName}`
            : "Location unknown"}
        </span>
        <span className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              wsStatus === "connected" ? "bg-ghost-safe" : "bg-ghost-warning animate-pulse-glow"
            }`}
          />
          {wsStatus === "connected" ? "LIVE" : wsStatus.toUpperCase()}
        </span>
      </div>

      {/* Fuel */}
      <FuelGauge fuel={context.fuel} />

      {/* Health */}
      <HealthBars shell={context.shell} />

      {/* Threat */}
      <ThreatIndicator env={context.environment} />

      {/* Shell info */}
      {context.shell && context.shell.crownCount > 0 && (
        <div className="p-2 bg-ghost-surface border border-ghost-border rounded">
          <div className="flex justify-between items-center">
            <span className="text-xs text-ghost-text-secondary uppercase tracking-wider">
              Crowns
            </span>
            <span className="text-xs font-mono text-ghost-warning">
              {context.shell.crownCount} on board
            </span>
          </div>
        </div>
      )}

      {/* Active alerts */}
      {latestAlerts.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-ghost-text-secondary uppercase tracking-wider">
            Active Alerts
          </div>
          {latestAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={onDismissAlert}
            />
          ))}
        </div>
      )}

      {/* Progression */}
      <div className="text-[10px] text-ghost-text-secondary font-mono pt-1 border-t border-ghost-border">
        Stage: {context.progression.stage} | Character: {context.characterId || "—"}
      </div>
    </div>
  );
}
