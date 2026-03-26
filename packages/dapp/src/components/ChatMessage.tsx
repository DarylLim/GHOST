"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isGhost = message.role === "ghost";

  return (
    <div className={`flex ${isGhost ? "justify-start" : "justify-end"} mb-2`}>
      <div
        className={`
          max-w-[85%] px-3 py-2 rounded text-sm leading-relaxed
          ${
            isGhost
              ? "bg-ghost-surface border border-ghost-border"
              : "bg-ghost-surface-3 border border-ghost-border-2"
          }
        `}
      >
        {isGhost && (
          <div className="text-[10px] text-ghost-accent font-mono uppercase tracking-wider mb-1">
            GHOST
          </div>
        )}
        <div className="text-ghost-text whitespace-pre-wrap">
          {message.content}
          {isGhost && !message.content && (
            <span className="inline-block w-1.5 h-3.5 bg-ghost-accent animate-pulse-glow" />
          )}
        </div>
      </div>
    </div>
  );
}
