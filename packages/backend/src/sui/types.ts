export interface CharacterProfile {
  characterId: string;
  name: string;
  walletAddress: string;
}

export interface ShellState {
  hpPercent: number;
  shieldPercent: number;
  armorPercent: number;
  shellType: string;
  crownCount: number;
  crownDetails: CrownDetail[];
}

export interface CrownDetail {
  crownId: string;
  value: number;
}

export interface FuelState {
  current: number;
  max: number;
  percent: number;
  estimatedWarps: number;
}

export interface InventoryState {
  items: InventoryItem[];
  cargoPercent: number;
}

export interface InventoryItem {
  typeId: string;
  name: string;
  quantity: number;
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
  shipClass: "Shuttle" | "Frigate" | "Cruiser" | "Battleship" | "Unknown";
  isHostile: boolean;
  isAggressor: boolean;
}

export interface GhostActivationEvent {
  terminalId: string;
  player: string;
  timestamp: number;
  activationType: number;
}

export interface GhostQueryEvent {
  terminalId: string;
  player: string;
  queryType: number;
  timestamp: number;
}
