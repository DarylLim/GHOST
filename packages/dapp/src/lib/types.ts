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

export interface ShellState {
  hpPercent: number;
  shieldPercent: number;
  armorPercent: number;
  shellType: string;
  crownCount: number;
  crownDetails: { crownId: string; value: number }[];
}

export interface FuelState {
  current: number;
  max: number;
  percent: number;
  estimatedWarps: number;
}

export interface InventoryState {
  items: { typeId: string; name: string; quantity: number }[];
  cargoPercent: number;
}

export interface LocationState {
  systemId: string;
  systemName: string;
}

export interface EnvironmentState {
  threatLevel: number;
  hostileCount: number;
  neutralCount: number;
  entities: EntityInfo[];
  feralAIDetected: boolean;
}

export interface EntityInfo {
  id: string;
  name: string;
  shipClass: string;
  isHostile: boolean;
  isAggressor: boolean;
}

export interface ProgressionState {
  stage: "newcomer" | "established" | "veteran";
  hasRefinery: boolean;
  hasReflexShip: boolean;
  firstCombatDone: boolean;
}

export interface GhostAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "fuel" | "threat" | "shell" | "tutorial" | "system";
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

export interface ChatMessage {
  id: string;
  role: "ghost" | "player";
  content: string;
  timestamp: number;
}

export type TabId = "status" | "intel" | "chat";
