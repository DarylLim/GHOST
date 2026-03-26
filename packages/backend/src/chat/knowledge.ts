import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { logger } from "../utils/logger.js";

interface KnowledgeChunk {
  source: string;
  title: string;
  content: string;
  keywords: string[];
}

let chunks: KnowledgeChunk[] = [];

export function loadKnowledgeBase(basePath?: string): void {
  const knowledgePath = basePath || resolve(process.cwd(), "../../knowledge");
  chunks = [];

  try {
    walkDir(knowledgePath, knowledgePath);
    logger.info({ count: chunks.length }, "Knowledge base loaded");
  } catch (err) {
    logger.warn({ err, knowledgePath }, "Failed to load knowledge base");
  }
}

function walkDir(dir: string, basePath: string): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, basePath);
    } else if (entry.endsWith(".md")) {
      loadFile(fullPath, basePath);
    }
  }
}

function loadFile(filePath: string, basePath: string): void {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const relativePath = filePath.replace(basePath + "/", "");
    const title = extractTitle(raw) || relativePath;

    // Split into chunks of ~500 tokens (~2000 chars)
    const sections = raw.split(/\n#{1,3}\s+/).filter(Boolean);

    for (const section of sections) {
      const trimmed = section.trim();
      if (trimmed.length < 20) continue;

      // Chunk large sections
      if (trimmed.length > 2000) {
        const paragraphs = trimmed.split(/\n\n+/);
        let current = "";
        for (const p of paragraphs) {
          if (current.length + p.length > 2000 && current.length > 0) {
            addChunk(relativePath, title, current);
            current = p;
          } else {
            current += (current ? "\n\n" : "") + p;
          }
        }
        if (current) addChunk(relativePath, title, current);
      } else {
        addChunk(relativePath, title, trimmed);
      }
    }
  } catch (err) {
    logger.warn({ filePath, err }, "Failed to load knowledge file");
  }
}

function addChunk(source: string, title: string, content: string): void {
  const keywords = extractKeywords(content);
  chunks.push({ source, title, content, keywords });
}

function extractTitle(md: string): string {
  const match = md.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "";
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);
}

export function searchKnowledge(query: string, topK = 5): KnowledgeChunk[] {
  if (chunks.length === 0) return [];

  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = chunks.map((chunk) => {
    let score = 0;

    for (const qw of queryWords) {
      // Keyword match
      if (chunk.keywords.includes(qw)) score += 3;
      // Content match
      if (chunk.content.toLowerCase().includes(qw)) score += 1;
      // Title match
      if (chunk.title.toLowerCase().includes(qw)) score += 2;
    }

    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}
