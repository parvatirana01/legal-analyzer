/**
 * Retrieval-Augmented Generation helpers.
 *
 * Uses pgvector cosine distance to find the most semantically similar
 * document chunks for a given query embedding.
 */

import { prisma } from "@/lib/prisma";
import { generateQueryEmbedding } from "@/lib/gemini";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

/** Maximum total characters sent to Gemini as context */
const MAX_CONTEXT_CHARS = 12_000;

// ── Retrieval ─────────────────────────────────────────────────────────────────

/**
 * Find the top-K most similar chunks for a given query embedding using
 * pgvector cosine distance (`<=>`).
 *
 * Raw SQL required: Prisma maps `embedding` as `Unsupported("vector")`.
 */
export async function retrieveRelevantChunks(
  documentId: string,
  queryEmbedding: number[],
  topK = 5
): Promise<RetrievedChunk[]> {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  // Raw query: cosine similarity = 1 - cosine distance
  const rows = await prisma.$queryRaw<
    Array<{ id: string; content: string; similarity: number }>
  >`
    SELECT
      id,
      content,
      (1 - (embedding <=> ${vectorLiteral}::vector))::float AS similarity
    FROM "DocumentEmbedding"
    WHERE "documentId" = ${documentId}
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `;

  return rows;
}

// ── Context assembly ──────────────────────────────────────────────────────────

/**
 * Concatenate retrieved chunks into a single context string.
 * Trims to MAX_CONTEXT_CHARS to stay within Gemini's context window.
 * Each chunk is prefixed with its 1-based index for citation purposes.
 */
export function buildContext(chunks: RetrievedChunk[]): string {
  let context = "";

  for (let i = 0; i < chunks.length; i++) {
    const section = `[${i + 1}] ${chunks[i].content}\n\n`;
    if (context.length + section.length > MAX_CONTEXT_CHARS) {
      // Trim the last section to fit exactly
      const remaining = MAX_CONTEXT_CHARS - context.length;
      if (remaining > 100) {
        context += section.slice(0, remaining) + "…";
      }
      break;
    }
    context += section;
  }

  return context.trim();
}

// ── Combined helper ───────────────────────────────────────────────────────────

/**
 * High-level: embed the query, retrieve chunks, build context string.
 * Returns both the context string and the raw chunks (for citation metadata).
 */
export async function getContextForQuery(
  documentId: string,
  question: string,
  topK = 5
): Promise<{ context: string; chunks: RetrievedChunk[] }> {
  const queryEmbedding = await generateQueryEmbedding(question);
  const chunks = await retrieveRelevantChunks(documentId, queryEmbedding, topK);
  const context = buildContext(chunks);
  return { context, chunks };
}

