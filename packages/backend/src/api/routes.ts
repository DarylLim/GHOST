import type { FastifyInstance } from "fastify";
import { connectPlayer, disconnectPlayer, getContext } from "../context/engine.js";
import { getAlerts, dismissAlert } from "../alerts/engine.js";
import { handleChat } from "../chat/handler.js";
import { handleWebSocket } from "./websocket.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check
  app.get("/health", async () => ({
    status: "ok",
    service: "ghost-backend",
    timestamp: Date.now(),
  }));

  // Connect player
  app.post<{
    Body: { walletAddress: string; terminalId?: string };
  }>("/api/connect", async (request, reply) => {
    const { walletAddress, terminalId } = request.body;
    if (!walletAddress) {
      return reply.status(400).send({ error: "walletAddress required" });
    }
    const ctx = await connectPlayer(walletAddress, terminalId);
    return { success: true, context: ctx };
  });

  // Disconnect player
  app.post<{
    Body: { walletAddress: string };
  }>("/api/disconnect", async (request, reply) => {
    const { walletAddress } = request.body;
    if (!walletAddress) {
      return reply.status(400).send({ error: "walletAddress required" });
    }
    disconnectPlayer(walletAddress);
    return { success: true };
  });

  // Get player context
  app.get<{
    Params: { addr: string };
  }>("/api/context/:addr", async (request, reply) => {
    const ctx = getContext(request.params.addr);
    if (!ctx) {
      return reply.status(404).send({ error: "Player not connected" });
    }
    return ctx;
  });

  // Get player alerts
  app.get<{
    Params: { addr: string };
  }>("/api/alerts/:addr", async (request, reply) => {
    const alerts = getAlerts(request.params.addr);
    return { alerts };
  });

  // Dismiss alert
  app.post<{
    Body: { walletAddress: string; alertId: string };
  }>("/api/alerts/dismiss", async (request, reply) => {
    const { walletAddress, alertId } = request.body;
    const success = dismissAlert(walletAddress, alertId);
    return { success };
  });

  // Chat — SSE streaming
  app.post<{
    Body: { walletAddress: string; message: string };
  }>("/api/chat", async (request, reply) => {
    const { walletAddress, message } = request.body;
    if (!walletAddress || !message) {
      return reply.status(400).send({ error: "walletAddress and message required" });
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    await handleChat(
      walletAddress,
      message,
      (chunk) => {
        reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      () => {
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();
      }
    );
  });

  // WebSocket endpoint
  app.get<{
    Params: { addr: string };
  }>("/ws/:addr", { websocket: true }, (socket, request) => {
    handleWebSocket(socket, request.params.addr);
  });
}
