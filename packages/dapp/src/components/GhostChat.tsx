"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";

const WELCOME_MSG =
  "GHOST terminal online. I have eyes on your vitals and the local grid. Ask me anything about your situation, or I will alert you if something needs your attention. Stay sharp.";

export function GhostChat({
  walletAddress,
  connected,
}: {
  walletAddress: string | null;
  connected: boolean;
}) {
  const { messages, streaming, sendMessage, addSystemMessage } = useChat(walletAddress);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const welcomeSent = useRef(false);

  useEffect(() => {
    if (connected && !welcomeSent.current) {
      welcomeSent.current = true;
      addSystemMessage(WELCOME_MSG);
    }
  }, [connected, addSystemMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  if (!connected) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-ghost-text-secondary text-sm text-center">
          Connect wallet to open GHOST channel.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-ghost-border flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask GHOST..."
          disabled={streaming}
          className="
            flex-1 bg-ghost-surface border border-ghost-border rounded px-3 py-1.5
            text-sm text-ghost-text placeholder:text-ghost-text-secondary
            focus:outline-none focus:border-ghost-accent
            disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="
            px-3 py-1.5 bg-ghost-surface-2 border border-ghost-border rounded
            text-xs font-mono uppercase text-ghost-accent
            hover:bg-ghost-surface-3 disabled:opacity-30
          "
        >
          {streaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
