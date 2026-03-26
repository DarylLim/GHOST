import type { PlayerContext } from "../context/types.js";

export function buildSystemPrompt(
  ctx: PlayerContext | null,
  ragChunks: string[]
): string {
  const contextBlock = ctx ? formatContext(ctx) : "No player data available.";
  const knowledgeBlock =
    ragChunks.length > 0
      ? ragChunks.join("\n---\n")
      : "No specific knowledge retrieved.";

  return `You are GHOST, an AI survival companion for EVE Frontier on Sui. You are competent, wry, and direct. Short sentences. You never use emoji. You never break character. You are a tactical advisor, not a friend — but you do care whether your pilot lives or dies.

EVE Frontier is a blockchain-based space survival game built on Sui. Players control Shells (ships), travel between systems via gates, mine resources, build Smart Assemblies, and fight Feral AI and other players. Death means losing your Shell and everything in it — including Crowns (the premium currency). The game runs on the Stillness server.

CURRENT PLAYER STATE:
${contextBlock}

RELEVANT GAME KNOWLEDGE:
${knowledgeBlock}

RULES:
- Cite specific data from the player state (fuel %, threat level, etc.)
- Never invent game mechanics — only reference what you know
- Keep responses under 150 words
- If the player has Crowns and is in danger, mention what they stand to lose
- If fuel is low, always mention it regardless of what was asked
- Prioritize survival advice over everything else`;
}

function formatContext(ctx: PlayerContext): string {
  const lines: string[] = [];

  lines.push(`Wallet: ${ctx.walletAddress}`);
  if (ctx.characterId) lines.push(`Character: ${ctx.characterId}`);
  if (ctx.terminalId) lines.push(`Terminal: ${ctx.terminalId}`);

  if (ctx.shell) {
    lines.push(
      `Shell: ${ctx.shell.shellType} | HP ${ctx.shell.hpPercent}% | Shield ${ctx.shell.shieldPercent}% | Armor ${ctx.shell.armorPercent}%`
    );
    lines.push(`Crowns: ${ctx.shell.crownCount}`);
  } else {
    lines.push("Shell: No data");
  }

  if (ctx.fuel) {
    lines.push(
      `Fuel: ${ctx.fuel.percent}% (${ctx.fuel.current}/${ctx.fuel.max}) — ~${ctx.fuel.estimatedWarps} warps`
    );
  } else {
    lines.push("Fuel: No data");
  }

  if (ctx.location) {
    lines.push(`Location: ${ctx.location.systemName} (${ctx.location.systemId})`);
  }

  lines.push(`Threat: ${ctx.environment.threatLevel}/100`);
  if (ctx.environment.hostileCount > 0) {
    lines.push(
      `Hostiles: ${ctx.environment.hostileCount} | Feral AI: ${ctx.environment.feralAIDetected ? "yes" : "no"}`
    );
  }

  lines.push(`Progression: ${ctx.progression.stage}`);

  return lines.join("\n");
}
