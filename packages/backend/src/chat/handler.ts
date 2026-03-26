import { getContext } from "../context/engine.js";
import { searchKnowledge } from "./knowledge.js";
import { buildSystemPrompt } from "./prompt.js";
import { streamChatResponse } from "./llm.js";
import type { StreamCallback, DoneCallback } from "./llm.js";

export async function handleChat(
  walletAddress: string,
  message: string,
  onChunk: StreamCallback,
  onDone: DoneCallback
): Promise<void> {
  const ctx = getContext(walletAddress) || null;

  // RAG: search knowledge base
  const results = searchKnowledge(message, 5);
  const ragChunks = results.map(
    (r) => `[${r.source}] ${r.title}\n${r.content}`
  );

  const systemPrompt = buildSystemPrompt(ctx, ragChunks);
  await streamChatResponse(systemPrompt, message, onChunk, onDone);
}
