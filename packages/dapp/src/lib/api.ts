import { API_URL } from "./config";
import type { PlayerContext, GhostAlert } from "./types";

export async function connectToGhost(
  walletAddress: string,
  terminalId?: string
): Promise<{ success: boolean; context: PlayerContext }> {
  const res = await fetch(`${API_URL}/api/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, terminalId }),
  });
  return res.json();
}

export async function disconnectFromGhost(walletAddress: string): Promise<void> {
  await fetch(`${API_URL}/api/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
}

export async function getPlayerContext(
  walletAddress: string
): Promise<PlayerContext> {
  const res = await fetch(`${API_URL}/api/context/${walletAddress}`);
  return res.json();
}

export async function getPlayerAlerts(
  walletAddress: string
): Promise<{ alerts: GhostAlert[] }> {
  const res = await fetch(`${API_URL}/api/alerts/${walletAddress}`);
  return res.json();
}

export async function dismissAlertApi(
  walletAddress: string,
  alertId: string
): Promise<void> {
  await fetch(`${API_URL}/api/alerts/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, alertId }),
  });
}

export async function* streamChat(
  walletAddress: string,
  message: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, message }),
  });

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) yield parsed.text;
        } catch {
          // skip
        }
      }
    }
  }
}
