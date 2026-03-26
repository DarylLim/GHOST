"use client";

import type { ShellState } from "@/lib/types";

function Bar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-ghost-text-secondary uppercase w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-ghost-surface-3 rounded-sm overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-ghost-text-secondary w-8 text-right">{percent}%</span>
    </div>
  );
}

export function HealthBars({ shell }: { shell: ShellState | null }) {
  if (!shell) {
    return (
      <div className="p-2 bg-ghost-surface border border-ghost-border rounded">
        <div className="text-xs text-ghost-text-secondary uppercase tracking-wider mb-1">Hull Status</div>
        <div className="text-xs text-ghost-text-secondary">No data</div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-ghost-surface border border-ghost-border rounded">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-ghost-text-secondary uppercase tracking-wider">Hull Status</span>
        <span className="text-[10px] font-mono text-ghost-text-secondary">{shell.shellType}</span>
      </div>
      <div className="space-y-1">
        <Bar label="HP" percent={shell.hpPercent} color="bg-ghost-critical" />
        <Bar label="Shield" percent={shell.shieldPercent} color="bg-[#3388ff]" />
        <Bar label="Armor" percent={shell.armorPercent} color="bg-ghost-warning" />
      </div>
    </div>
  );
}
