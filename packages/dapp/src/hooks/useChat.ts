"use client";

import { useState, useCallback, useRef } from "react";
import { streamChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export function useChat(walletAddress: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const idCounter = useRef(0);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!walletAddress || !text.trim() || streaming) return;

      const playerMsg: ChatMessage = {
        id: `msg-${++idCounter.current}`,
        role: "player",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const ghostMsg: ChatMessage = {
        id: `msg-${++idCounter.current}`,
        role: "ghost",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, playerMsg, ghostMsg]);
      setStreaming(true);

      try {
        for await (const chunk of streamChat(walletAddress, text.trim())) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "ghost") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return updated;
          });
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "ghost" && !last.content) {
            updated[updated.length - 1] = {
              ...last,
              content: "GHOST comms disrupted. Signal lost. Try again.",
            };
          }
          return updated;
        });
      } finally {
        setStreaming(false);
      }
    },
    [walletAddress, streaming]
  );

  const addSystemMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: `msg-${++idCounter.current}`,
      role: "ghost",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  return { messages, streaming, sendMessage, addSystemMessage };
}
