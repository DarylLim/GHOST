import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import {
  getCharacterByWallet,
  getShellState,
  getFuelState,
  getInventoryState,
  getLocationState,
} from "../sui/queries.js";
import { clamp } from "../utils/helpers.js";
import type { PlayerContext } from "./types.js";
import type { EnvironmentState, EntityInfo } from "../sui/types.js";
import { createDefaultContext } from "./types.js";

const contexts = new Map<string, PlayerContext>();
const pollingIntervals = new Map<string, ReturnType<typeof setInterval>>();

const SHIP_CLASS_WEIGHTS: Record<string, number> = {
  Shuttle: 1,
  Frigate: 3,
  Cruiser: 7,
  Battleship: 10,
  Unknown: 2,
};
const AGGRESSOR_MULT = 2.5;

export function getContext(walletAddress: string): PlayerContext | undefined {
  return contexts.get(walletAddress);
}

export function getAllContexts(): Map<string, PlayerContext> {
  return contexts;
}

export async function connectPlayer(
  walletAddress: string,
  terminalId?: string
): Promise<PlayerContext> {
  let ctx = contexts.get(walletAddress);
  if (!ctx) {
    ctx = createDefaultContext(walletAddress);
    contexts.set(walletAddress, ctx);
  }
  if (terminalId) ctx.terminalId = terminalId;

  if (config.demoMode) {
    applyMockContext(ctx);
  } else {
    await refreshContext(walletAddress);
  }

  startPolling(walletAddress);
  logger.info({ walletAddress, terminalId }, "Player connected");
  return ctx;
}

export function disconnectPlayer(walletAddress: string): void {
  stopPolling(walletAddress);
  contexts.delete(walletAddress);
  logger.info({ walletAddress }, "Player disconnected");
}

async function refreshContext(walletAddress: string): Promise<void> {
  const ctx = contexts.get(walletAddress);
  if (!ctx) return;

  try {
    const [character, shell, fuel, inventory, location] = await Promise.all([
      ctx.characterId ? null : getCharacterByWallet(walletAddress),
      getShellState(walletAddress),
      getFuelState(walletAddress),
      getInventoryState(walletAddress),
      getLocationState(walletAddress),
    ]);

    if (character && !ctx.characterId) {
      ctx.characterId = character.characterId;
    }
    if (shell) ctx.shell = shell;
    if (fuel) ctx.fuel = fuel;
    if (inventory) ctx.inventory = inventory;
    if (location) ctx.location = location;

    ctx.environment = computeEnvironment(ctx.environment);
    ctx.lastUpdated = Date.now();
  } catch (err) {
    logger.debug({ walletAddress, err }, "Context refresh failed, using mock");
    applyMockContext(ctx);
  }
}

function computeEnvironment(env: EnvironmentState): EnvironmentState {
  let threat = 0;
  for (const entity of env.entities) {
    if (!entity.isHostile) continue;
    const weight = SHIP_CLASS_WEIGHTS[entity.shipClass] || 2;
    const mult = entity.isAggressor ? AGGRESSOR_MULT : 1;
    threat += weight * mult;
  }
  return {
    ...env,
    threatLevel: clamp(Math.round(threat), 0, 100),
    hostileCount: env.entities.filter((e) => e.isHostile).length,
    neutralCount: env.entities.filter((e) => !e.isHostile).length,
  };
}

function startPolling(walletAddress: string): void {
  if (pollingIntervals.has(walletAddress)) return;

  const interval = setInterval(async () => {
    const ctx = contexts.get(walletAddress);
    if (!ctx) {
      stopPolling(walletAddress);
      return;
    }

    if (config.demoMode) {
      tickMockContext(ctx);
    } else {
      await refreshContext(walletAddress);
    }
  }, config.pollingIntervalMs);

  pollingIntervals.set(walletAddress, interval);
}

function stopPolling(walletAddress: string): void {
  const interval = pollingIntervals.get(walletAddress);
  if (interval) {
    clearInterval(interval);
    pollingIntervals.delete(walletAddress);
  }
}

// ========== Mock / Demo mode ==========

let mockTick = 0;

function applyMockContext(ctx: PlayerContext): void {
  ctx.characterId = ctx.characterId || "GHOST-DEMO-001";
  ctx.shell = {
    hpPercent: 85,
    shieldPercent: 100,
    armorPercent: 92,
    shellType: "Reflex",
    crownCount: 2,
    crownDetails: [
      { crownId: "crown-1", value: 1500 },
      { crownId: "crown-2", value: 800 },
    ],
  };
  ctx.fuel = {
    current: 450,
    max: 1000,
    percent: 45,
    estimatedWarps: 4,
  };
  ctx.inventory = {
    items: [
      { typeId: "fuel-cell", name: "Fuel Cell", quantity: 12 },
      { typeId: "ore-iron", name: "Iron Ore", quantity: 340 },
      { typeId: "component-a", name: "Hull Plate", quantity: 5 },
    ],
    cargoPercent: 62,
  };
  ctx.location = {
    systemId: "sys-001",
    systemName: "Syndara Reach",
  };
  ctx.environment = {
    threatLevel: 15,
    hostileCount: 0,
    neutralCount: 3,
    entities: [
      {
        id: "npc-1",
        name: "Mining Barge",
        shipClass: "Shuttle",
        isHostile: false,
        isAggressor: false,
      },
      {
        id: "npc-2",
        name: "Patrol Vessel",
        shipClass: "Frigate",
        isHostile: false,
        isAggressor: false,
      },
    ],
    feralAIDetected: false,
  };
  ctx.progression = {
    stage: "established",
    hasRefinery: true,
    hasReflexShip: true,
    firstCombatDone: true,
  };
  ctx.lastUpdated = Date.now();
  mockTick = 0;
}

function tickMockContext(ctx: PlayerContext): void {
  mockTick++;

  // Simulate fuel drain
  if (ctx.fuel) {
    ctx.fuel.current = Math.max(0, ctx.fuel.current - 5);
    ctx.fuel.percent = Math.round((ctx.fuel.current / ctx.fuel.max) * 100);
    ctx.fuel.estimatedWarps = Math.floor(ctx.fuel.current / 100);
  }

  // At tick 10 (~10s): fuel warning territory
  if (mockTick === 10 && ctx.fuel) {
    ctx.fuel.current = 180;
    ctx.fuel.percent = 18;
    ctx.fuel.estimatedWarps = 1;
  }

  // At tick 20 (~20s): hostiles appear
  if (mockTick === 20) {
    ctx.environment = {
      threatLevel: 65,
      hostileCount: 2,
      neutralCount: 1,
      entities: [
        {
          id: "hostile-1",
          name: "Raider Alpha",
          shipClass: "Frigate",
          isHostile: true,
          isAggressor: true,
        },
        {
          id: "hostile-2",
          name: "Raider Beta",
          shipClass: "Cruiser",
          isHostile: true,
          isAggressor: false,
        },
        {
          id: "npc-1",
          name: "Mining Barge",
          shipClass: "Shuttle",
          isHostile: false,
          isAggressor: false,
        },
      ],
      feralAIDetected: true,
    };
  }

  // At tick 30: hostiles leave, fuel gets critical
  if (mockTick === 30) {
    ctx.environment = {
      threatLevel: 0,
      hostileCount: 0,
      neutralCount: 2,
      entities: [],
      feralAIDetected: false,
    };
    if (ctx.fuel) {
      ctx.fuel.current = 50;
      ctx.fuel.percent = 5;
      ctx.fuel.estimatedWarps = 0;
    }
  }

  ctx.lastUpdated = Date.now();
}
