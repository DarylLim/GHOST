import { config } from "../config.js";
import { logger } from "../utils/logger.js";

export type StreamCallback = (chunk: string) => void;
export type DoneCallback = () => void;

export async function streamChatResponse(
  systemPrompt: string,
  userMessage: string,
  onChunk: StreamCallback,
  onDone: DoneCallback
): Promise<void> {
  if (config.anthropicApiKey) {
    await streamAnthropic(systemPrompt, userMessage, onChunk, onDone);
  } else if (config.openaiApiKey) {
    await streamOpenAI(systemPrompt, userMessage, onChunk, onDone);
  } else {
    // Fallback: scripted response
    const fallback =
      "GHOST systems degraded. No LLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY. I can still monitor your vitals and issue alerts, but conversational mode is offline.";
    for (const word of fallback.split(" ")) {
      onChunk(word + " ");
      await new Promise((r) => setTimeout(r, 50));
    }
    onDone();
  }
}

async function streamAnthropic(
  systemPrompt: string,
  userMessage: string,
  onChunk: StreamCallback,
  onDone: DoneCallback
): Promise<void> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        onChunk(event.delta.text);
      }
    }
    onDone();
  } catch (err) {
    logger.error({ err }, "Anthropic streaming error");
    onChunk("GHOST comms disrupted. Try again.");
    onDone();
  }
}

async function streamOpenAI(
  systemPrompt: string,
  userMessage: string,
  onChunk: StreamCallback,
  onDone: DoneCallback
): Promise<void> {
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: config.openaiApiKey });

    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) onChunk(text);
    }
    onDone();
  } catch (err) {
    logger.error({ err }, "OpenAI streaming error");
    onChunk("GHOST comms disrupted. Try again.");
    onDone();
  }
}
