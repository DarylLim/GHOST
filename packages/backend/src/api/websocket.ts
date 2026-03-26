import type { WebSocket } from "@fastify/websocket";
import { getContext } from "../context/engine.js";
import { evaluateAlerts, getAlerts } from "../alerts/engine.js";
import { onAlert } from "../alerts/engine.js";
import { logger } from "../utils/logger.js";

interface WsConnection {
  socket: WebSocket;
  walletAddress: string;
  interval: ReturnType<typeof setInterval> | null;
}

const connections = new Map<string, WsConnection[]>();

export function handleWebSocket(socket: WebSocket, walletAddress: string): void {
  logger.info({ walletAddress }, "WebSocket connected");

  const conn: WsConnection = { socket, walletAddress, interval: null };

  if (!connections.has(walletAddress)) {
    connections.set(walletAddress, []);
  }
  connections.get(walletAddress)!.push(conn);

  // Send initial state
  const ctx = getContext(walletAddress);
  if (ctx) {
    sendJson(socket, { type: "context", data: ctx });
    const alerts = getAlerts(walletAddress);
    if (alerts.length > 0) {
      sendJson(socket, { type: "alerts", data: alerts.slice(0, 10) });
    }
  }

  // Poll and push updates every second
  conn.interval = setInterval(() => {
    const currentCtx = getContext(walletAddress);
    if (!currentCtx) return;

    sendJson(socket, { type: "context", data: currentCtx });

    // Evaluate alerts on each tick
    const newAlerts = evaluateAlerts(walletAddress, currentCtx);
    if (newAlerts.length > 0) {
      sendJson(socket, { type: "alerts", data: newAlerts });
    }
  }, 1000);

  socket.on("close", () => {
    logger.info({ walletAddress }, "WebSocket disconnected");
    if (conn.interval) clearInterval(conn.interval);
    const conns = connections.get(walletAddress);
    if (conns) {
      const idx = conns.indexOf(conn);
      if (idx !== -1) conns.splice(idx, 1);
      if (conns.length === 0) connections.delete(walletAddress);
    }
  });

  socket.on("error", (err) => {
    logger.error({ walletAddress, err }, "WebSocket error");
  });

  socket.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "ping") {
        sendJson(socket, { type: "pong" });
      }
    } catch {
      // Ignore invalid messages
    }
  });
}

// Push alerts to connected clients
onAlert((walletAddress, alert) => {
  const conns = connections.get(walletAddress);
  if (!conns) return;
  for (const conn of conns) {
    sendJson(conn.socket, { type: "alert", data: alert });
  }
});

function sendJson(socket: WebSocket, data: unknown): void {
  try {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(data));
    }
  } catch {
    // Socket may have closed
  }
}
