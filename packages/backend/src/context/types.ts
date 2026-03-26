import type {
  ShellState,
  FuelState,
  InventoryState,
  LocationState,
  EnvironmentState,
} from "../sui/types.js";

export interface PlayerContext {
  walletAddress: string;
  characterId: string | null;
  terminalId: string | null;
  shell: ShellState | null;
  fuel: FuelState | null;
  inventory: InventoryState | null;
  location: LocationState | null;
  environment: EnvironmentState;
  progression: ProgressionState;
  lastUpdated: number;
}

export interface ProgressionState {
  stage: "newcomer" | "established" | "veteran";
  hasRefinery: boolean;
  hasReflexShip: boolean;
  firstCombatDone: boolean;
}

export function createDefaultContext(walletAddress: string): PlayerContext {
  return {
    walletAddress,
    characterId: null,
    terminalId: null,
    shell: null,
    fuel: null,
    inventory: null,
    location: null,
    environment: {
      threatLevel: 0,
      hostileCount: 0,
      neutralCount: 0,
      entities: [],
      feralAIDetected: false,
    },
    progression: {
      stage: "newcomer",
      hasRefinery: false,
      hasReflexShip: false,
      firstCombatDone: false,
    },
    lastUpdated: Date.now(),
  };
}
