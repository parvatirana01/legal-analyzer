/**
 * Embedding pipeline for RAG.
 *
 * Flow:
 *   1. chunkText()              — split extracted text into overlapping windows
 *   2. generateEmbedding()      — Gemini text-embedding-004 → float[]
 *   3. generateAndStoreEmbeddings() — chunk + embed + raw-SQL insert (pgvector)
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/gemini";

// ── Chunking ──────────────────────────────────────────────────────────────────

const CHUNK_SIZE_WORDS = 700;
const CHUNK_OVERLAP_WORDS = 100;

/**
 * Split text into overlapping word-window chunks.
 * Each chunk is ≤ CHUNK_SIZE_WORDS words. Adjacent chunks share
 * CHUNK_OVERLAP_WORDS words for context continuity.
 */
export function chunkText(text: string): string[] {
  if (!text.trim()) return [];

  const words = text.split(/\s+/);
  const chunks: string[] = [];
  const step = CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS;

  for (let i = 0; i < words.length; i += step) {
    const chunk = words.slice(i, i + CHUNK_SIZE_WORDS).join(" ").trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (i + CHUNK_SIZE_WORDS >= words.length) break;
  }

  return chunks;
}

// ── Storage ───────────────────────────────────────────────────────────────────

/**
 * Insert one embedding row using raw SQL (required because Prisma maps the
 * `embedding` column as `Unsupported("vector")`).
 */
async function insertEmbeddingRow(
  id: string,
  documentId: string,
  content: string,
  vector: number[]
): Promise<void> {
  // Format: '[0.1, 0.2, ...]'
  const vectorLiteral = `[${vector.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "DocumentEmbedding" (id, "documentId", content, embedding, "createdAt")
    VALUES (${id}, ${documentId}, ${content}, ${vectorLiteral}::vector, NOW())
    ON CONFLICT (id) DO NOTHING
  `;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Delete existing embeddings for a document, then chunk + embed + store fresh.
 * Called after processDocument() completes successfully.
 *
 * Designed to be best-effort: the caller should catch and log errors rather
 * than letting a failure here fail the whole pipeline.
 */
export async function generateAndStoreEmbeddings(
  documentId: string,
  text: string
): Promise<void> {
  if (!text.trim()) {
    console.warn(`[embeddings] No text provided for document ${documentId} — skipping.`);
    return;
  }

  // Clear stale embeddings (idempotent on re-analysis)
  await prisma.documentEmbedding.deleteMany({ where: { documentId } });

  const chunks = chunkText(text);
  console.log(`[embeddings] Generating ${chunks.length} embeddings for ${documentId}…`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const id = crypto.randomUUID();

    // Generate embedding vector
    const vector = await generateEmbedding(chunk);

    // Store in DB
    await insertEmbeddingRow(id, documentId, chunk, vector);

    if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
      console.log(`[embeddings] Stored ${i + 1}/${chunks.length} chunks for ${documentId}`);
    }
  }

  console.log(`[embeddings] Done — ${chunks.length} embeddings stored for ${documentId}`);
}

