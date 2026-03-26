import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });

export const config = {
  sui: {
    rpcUrl:
      process.env.SUI_RPC_URL || "https://fullnode.mainnet.sui.io:443",
    graphqlUrl:
      process.env.SUI_GRAPHQL_URL ||
      "https://graphql.mainnet.sui.io/graphql",
    worldPackageId: process.env.WORLD_PACKAGE_ID || "",
    ghostPackageId: process.env.GHOST_PACKAGE_ID || "",
  },
  tenant: process.env.TENANT || "stillness",
  pollingIntervalMs: parseInt(process.env.POLLING_INTERVAL_MS || "1000", 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  port: parseInt(process.env.PORT || "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  demoMode: process.env.DEMO_MODE === "true",
} as const;
