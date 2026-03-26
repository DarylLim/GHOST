import { logger } from "../utils/logger.js";
import { ALERT_RULES } from "./rules.js";
import type { GhostAlert } from "./types.js";
import type { PlayerContext } from "../context/types.js";

type AlertCallback = (walletAddress: string, alert: GhostAlert) => void;

const playerAlerts = new Map<string, GhostAlert[]>();
const lastFired = new Map<string, Map<string, number>>();
const listeners: AlertCallback[] = [];

let alertCounter = 0;

export function onAlert(cb: AlertCallback): void {
  listeners.push(cb);
}

export function getAlerts(walletAddress: string): GhostAlert[] {
  return playerAlerts.get(walletAddress) || [];
}

export function evaluateAlerts(
  walletAddress: string,
  ctx: PlayerContext
): GhostAlert[] {
  const fired: GhostAlert[] = [];
  const now = Date.now();

  if (!lastFired.has(walletAddress)) {
    lastFired.set(walletAddress, new Map());
  }
  const cooldowns = lastFired.get(walletAddress)!;

  for (const rule of ALERT_RULES) {
    const lastTime = cooldowns.get(rule.id) || 0;
    if (now - lastTime < rule.cooldownMs) continue;

    const result = rule.evaluate(ctx);
    if (!result || !result.fire) continue;

    const alert: GhostAlert = {
      id: `alert-${++alertCounter}`,
      severity: result.severity,
      category: rule.category,
      title: result.title,
      message: result.message,
      timestamp: now,
      dismissed: false,
    };

    fired.push(alert);
    cooldowns.set(rule.id, now);

    // Store
    if (!playerAlerts.has(walletAddress)) {
      playerAlerts.set(walletAddress, []);
    }
    const alerts = playerAlerts.get(walletAddress)!;
    alerts.unshift(alert);
    // Keep last 50
    if (alerts.length > 50) alerts.length = 50;

    // Notify listeners
    for (const listener of listeners) {
      try {
        listener(walletAddress, alert);
      } catch (err) {
        logger.error({ err }, "Alert listener error");
      }
    }
  }

  return fired;
}

export function dismissAlert(walletAddress: string, alertId: string): boolean {
  const alerts = playerAlerts.get(walletAddress);
  if (!alerts) return false;
  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.dismissed = true;
  return true;
}

export function clearPlayerAlerts(walletAddress: string): void {
  playerAlerts.delete(walletAddress);
  lastFired.delete(walletAddress);
}
