import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "../config.js";
import { registerRoutes } from "./routes.js";
import { logger } from "../utils/logger.js";

export async function createServer() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: config.corsOrigin });
  await app.register(websocket);
  await registerRoutes(app);

  return app;
}

export async function startServer() {
  const app = await createServer();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    logger.info({ port: config.port }, "GHOST backend running");
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }

  return app;
}
