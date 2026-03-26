import { startServer } from "./api/server.js";
import { loadKnowledgeBase } from "./chat/knowledge.js";
import { startEventPolling } from "./sui/events.js";
import { initTracker } from "./context/tracker.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";

async function main() {
  logger.info("Initializing GHOST backend...");
  logger.info({ demoMode: config.demoMode, tenant: config.tenant }, "Config");

  // Load knowledge base for RAG
  loadKnowledgeBase();

  // Initialize terminal activity tracker
  initTracker();

  // Start polling Sui for GHOST events (if package ID is set)
  startEventPolling();

  // Start HTTP + WebSocket server
  await startServer();

  logger.info("GHOST is online. Monitoring the void.");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exit(1);
});
