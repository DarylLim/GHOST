import type { PlayerContext } from "../context/types.js";
import type { GhostAlert, AlertSeverity, AlertCategory } from "./types.js";

interface AlertRule {
  id: string;
  category: AlertCategory;
  cooldownMs: number;
  evaluate: (ctx: PlayerContext) => { fire: boolean; severity: AlertSeverity; title: string; message: string } | null;
}

export const ALERT_RULES: AlertRule[] = [
  {
    id: "FUEL_CRITICAL",
    category: "fuel",
    cooldownMs: 60_000,
    evaluate: (ctx) => {
      if (!ctx.fuel || ctx.fuel.percent >= 20) return null;
      return {
        fire: true,
        severity: "critical",
        title: "Fuel Critical",
        message: `Fuel at ${ctx.fuel.percent}%. ${ctx.fuel.estimatedWarps} warp${ctx.fuel.estimatedWarps !== 1 ? "s" : ""} remaining. Dock immediately or you will be stranded.`,
      };
    },
  },
  {
    id: "FUEL_LOW",
    category: "fuel",
    cooldownMs: 60_000,
    evaluate: (ctx) => {
      if (!ctx.fuel || ctx.fuel.percent >= 50 || ctx.fuel.percent < 20) return null;
      return {
        fire: true,
        severity: "warning",
        title: "Fuel Low",
        message: `Fuel at ${ctx.fuel.percent}%. Consider refueling. ${ctx.fuel.estimatedWarps} warps left.`,
      };
    },
  },
  {
    id: "THREAT_DETECTED",
    category: "threat",
    cooldownMs: 30_000,
    evaluate: (ctx) => {
      if (ctx.environment.hostileCount === 0) return null;
      const severity: AlertSeverity = ctx.environment.hostileCount >= 3 ? "critical" : "warning";
      const feralNote = ctx.environment.feralAIDetected ? " Feral AI signatures detected." : "";
      return {
        fire: true,
        severity,
        title: `${ctx.environment.hostileCount} Hostile${ctx.environment.hostileCount > 1 ? "s" : ""} Detected`,
        message: `Threat level ${ctx.environment.threatLevel}/100.${feralNote} ${severity === "critical" ? "Evade now." : "Stay alert."}`,
      };
    },
  },
  {
    id: "SHELL_RISK",
    category: "shell",
    cooldownMs: 60_000,
    evaluate: (ctx) => {
      if (!ctx.shell || ctx.shell.crownCount === 0 || ctx.environment.hostileCount === 0) return null;
      return {
        fire: true,
        severity: "critical",
        title: "Crowns at Risk",
        message: `${ctx.shell.crownCount} crown${ctx.shell.crownCount > 1 ? "s" : ""} on board with hostiles nearby. Death means losing everything. Consider docking.`,
      };
    },
  },
  {
    id: "STRANDING",
    category: "fuel",
    cooldownMs: 60_000,
    evaluate: (ctx) => {
      if (!ctx.fuel || ctx.fuel.estimatedWarps > 0) return null;
      return {
        fire: true,
        severity: "critical",
        title: "Stranding Imminent",
        message: "Not enough fuel for a single warp. You are effectively stranded. Call for help or self-destruct.",
      };
    },
  },
  {
    id: "TUTORIAL_NUDGE",
    category: "tutorial",
    cooldownMs: 300_000,
    evaluate: (ctx) => {
      if (ctx.progression.stage !== "newcomer") return null;
      return {
        fire: true,
        severity: "info",
        title: "GHOST Tip",
        message: !ctx.progression.firstCombatDone
          ? "Try asking GHOST about combat basics. Type 'how do I fight?' in the chat."
          : !ctx.progression.hasRefinery
            ? "Building a refinery is your next milestone. Ask GHOST about base building."
            : "Ask GHOST anything about EVE Frontier. I'm here to help you survive.",
      };
    },
  },
];
