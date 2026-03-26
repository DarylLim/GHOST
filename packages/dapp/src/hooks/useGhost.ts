"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WS_URL, DEMO_MODE } from "@/lib/config";
import { connectToGhost, disconnectFromGhost } from "@/lib/api";
import type { PlayerContext, GhostAlert } from "@/lib/types";

interface GhostState {
  context: PlayerContext | null;
  alerts: GhostAlert[];
  connected: boolean;
  connecting: boolean;
  wsStatus: "connecting" | "connected" | "disconnected" | "reconnecting";
  error: string | null;
}

export function useGhost(walletAddress: string | null, terminalId?: string | null) {
  const [state, setState] = useState<GhostState>({
    context: null,
    alerts: [],
    connected: false,
    connecting: false,
    wsStatus: "disconnected",
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(1000);

  const connect = useCallback(async () => {
    if (!walletAddress) return;

    setState((s) => ({ ...s, connecting: true, error: null }));

    try {
      const result = await connectToGhost(walletAddress, terminalId || undefined);
      setState((s) => ({
        ...s,
        context: result.context,
        connected: true,
        connecting: false,
      }));

      // Open WebSocket
      openWebSocket(walletAddress);
    } catch (err) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: "Failed to connect to GHOST service",
      }));
    }
  }, [walletAddress, terminalId]);

  const disconnect = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (walletAddress) {
      try {
        await disconnectFromGhost(walletAddress);
      } catch {
        // Best effort
      }
    }
    setState({
      context: null,
      alerts: [],
      connected: false,
      connecting: false,
      wsStatus: "disconnected",
      error: null,
    });
  }, [walletAddress]);

  const openWebSocket = useCallback(
    (addr: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setState((s) => ({ ...s, wsStatus: "connecting" }));
      const ws = new WebSocket(`${WS_URL}/ws/${addr}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((s) => ({ ...s, wsStatus: "connected" }));
        reconnectDelay.current = 1000;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "context") {
            setState((s) => ({ ...s, context: msg.data }));
          } else if (msg.type === "alerts") {
            setState((s) => ({
              ...s,
              alerts: [...msg.data, ...s.alerts].slice(0, 50),
            }));
          } else if (msg.type === "alert") {
            setState((s) => ({
              ...s,
              alerts: [msg.data, ...s.alerts].slice(0, 50),
            }));
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, wsStatus: "reconnecting" }));
        // Exponential backoff reconnect, max 30s
        reconnectRef.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
          openWebSocket(addr);
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    },
    []
  );

  // Auto-connect in demo mode
  useEffect(() => {
    if (DEMO_MODE && walletAddress && !state.connected && !state.connecting) {
      connect();
    }
  }, [walletAddress, DEMO_MODE, connect, state.connected, state.connecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return { ...state, connect, disconnect };
}
