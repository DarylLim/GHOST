import { onGhostActivation } from "../sui/events.js";
import { logger } from "../utils/logger.js";

interface TerminalStats {
  totalActivations: number;
  uniquePlayers: Set<string>;
  lastActivation: number;
}

const terminalStats = new Map<string, TerminalStats>();

export function initTracker(): void {
  onGhostActivation((event) => {
    let stats = terminalStats.get(event.terminalId);
    if (!stats) {
      stats = {
        totalActivations: 0,
        uniquePlayers: new Set(),
        lastActivation: 0,
      };
      terminalStats.set(event.terminalId, stats);
    }
    stats.totalActivations++;
    stats.uniquePlayers.add(event.player);
    stats.lastActivation = event.timestamp;
    logger.info(
      { terminalId: event.terminalId, player: event.player },
      "Terminal activation tracked"
    );
  });
}

export function getTerminalStats(
  terminalId: string
): { totalActivations: number; uniquePlayers: number; lastActivation: number } | null {
  const stats = terminalStats.get(terminalId);
  if (!stats) return null;
  return {
    totalActivations: stats.totalActivations,
    uniquePlayers: stats.uniquePlayers.size,
    lastActivation: stats.lastActivation,
  };
}
