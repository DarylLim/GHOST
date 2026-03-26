import { SuiClient } from "@mysten/sui/client";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

let client: SuiClient | null = null;

export function getSuiClient(): SuiClient {
  if (!client) {
    client = new SuiClient({ url: config.sui.rpcUrl });
    logger.info({ rpcUrl: config.sui.rpcUrl }, "Sui client initialized");
  }
  return client;
}
