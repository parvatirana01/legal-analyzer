/**
 * Background document processing pipeline.
 *
 * Flow:
 *   1. Mark document as PROCESSING
 *   2. Fetch file buffer from Cloudflare R2
 *   3. Extract plain text (PDF / DOCX)
 *   4. Call Gemini for structured analysis
 *   5. Calculate smart risk score
 *   6. Persist results + clause records in Postgres
 *   7. Mark document as COMPLETED (or FAILED on error)
 *   8. Refund token on failure (USER role only)
 *
 * This function is designed to be called fire-and-forget from the upload
 * route — it must never throw unhandled rejections.
 */

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { extractText } from "@/lib/extract-text";
import { analyzeDocument, GEMINI_MODEL } from "@/lib/gemini";
import { calculateRiskScore } from "@/lib/risk-score";
import { prisma } from "@/lib/prisma";
import { refundToken } from "@/lib/token-manager";
import { generateAndStoreEmbeddings } from "@/lib/embeddings";
import type { RiskLevel, UserRole } from "@/lib/generated/prisma/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProcessDocumentResult {
  success: true;
  documentId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  processingMs: number;
}

export interface ProcessDocumentError {
  success: false;
  documentId: string;
  error: string;
}

export type ProcessDocumentOutcome =
  | ProcessDocumentResult
  | ProcessDocumentError;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchFileFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? "",
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error(`R2 returned an empty body for key: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// ── Core pipeline ─────────────────────────────────────────────────────────────

/**
 * Run the full AI processing pipeline for a document.
 *
 * @param documentId  The document to process
 * @param userId      Optional — used to refund tokens on failure (USER role only)
 * @param role        Optional — only USER role triggers a refund
 *
 * Safe to call without `await` — errors are caught and written to the DB.
 */
export async function processDocument(
  documentId: string,
  userId?: string | null,
  role?: UserRole | null
): Promise<ProcessDocumentOutcome> {
  const startedAt = Date.now();

  // ── Step 1: Fetch document metadata ──────────────────────────────────────
  let doc: { fileUrl: string; status: string } | null;
  try {
    doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { fileUrl: true, status: true },
    });
  } catch (err) {
    console.error(`[process] DB lookup failed for ${documentId}:`, err);
    return { success: false, documentId, error: "Database error during lookup." };
  }

  if (!doc) {
    return { success: false, documentId, error: "Document not found." };
  }

  if (doc.status === "COMPLETED") {
    console.warn(`[process] Document ${documentId} already COMPLETED — skipping.`);
    return { success: false, documentId, error: "Already COMPLETED." };
  }

  // ── Step 2: Mark as PROCESSING ────────────────────────────────────────────
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });
  } catch (err) {
    console.error(`[process] Failed to set PROCESSING for ${documentId}:`, err);
    return { success: false, documentId, error: "Failed to update processing status." };
  }

  try {
    // ── Step 3: Fetch file from R2 ────────────────────────────────────────
    console.log(`[process] Fetching ${doc.fileUrl} from R2…`);
    const buffer = await fetchFileFromR2(doc.fileUrl);

    // ── Step 4: Determine MIME type from R2 key extension ─────────────────
    const ext = doc.fileUrl.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
    };
    const mimeType = mimeMap[ext] ?? "application/pdf";

    // ── Step 5: Extract text ──────────────────────────────────────────────
    console.log(`[process] Extracting text from ${documentId}…`);
    const { text, truncated } = await extractText(buffer, mimeType);

    if (truncated) {
      console.warn(`[process] Text truncated for ${documentId} — file was very large.`);
    }

    // ── Step 6: Gemini analysis ───────────────────────────────────────────
    console.log(`[process] Calling Gemini for ${documentId}…`);
    const analysis = await analyzeDocument(text);

    // ── Step 7: Risk score ────────────────────────────────────────────────
    const { score, level } = calculateRiskScore(analysis.clauses);
    console.log(`[process] Risk score: ${score} (${level}) for ${documentId}`);

    const processingMs = Date.now() - startedAt;

    // ── Step 8: Persist results in a transaction ──────────────────────────
    await prisma.$transaction(async (tx) => {
      // Delete any stale clause records (idempotent retry support)
      await tx.clause.deleteMany({ where: { documentId } });

      if (analysis.clauses.length > 0) {
        await tx.clause.createMany({
          data: analysis.clauses.map((c) => ({
            documentId,
            title: c.title,
            content: c.summary,
            riskLevel: c.riskLevel as RiskLevel,
            explanation: c.explanation,
            suggestion: c.suggestion,
          })),
        });
      }

      await tx.document.update({
        where: { id: documentId },
        data: {
          status: "COMPLETED",
          summary: analysis.summary,
          pros: JSON.parse(JSON.stringify(analysis.pros)),
          cons: JSON.parse(JSON.stringify(analysis.cons)),
          riskScore: score,
          riskLevel: level as RiskLevel,
          overallAnalysis: JSON.parse(JSON.stringify(analysis)),
          processingTimeMs: processingMs,
          aiModelUsed: GEMINI_MODEL,
        },
      });
    });

    console.log(`[process] Completed ${documentId} in ${processingMs}ms`);

    // ── Step 9: Generate RAG embeddings (best-effort) ─────────────────────
    try {
      await generateAndStoreEmbeddings(documentId, text);
    } catch (embErr) {
      console.error(`[process] Embedding generation failed for ${documentId}:`, embErr);
    }

    return {
      success: true,
      documentId,
      riskScore: score,
      riskLevel: level as RiskLevel,
      processingMs,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    console.error(`[process] Pipeline failed for ${documentId}:`, err);

    // Mark document as FAILED
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          overallAnalysis: JSON.parse(JSON.stringify({ error: message })),
        },
      });
    } catch (dbErr) {
      console.error(`[process] Failed to mark FAILED for ${documentId}:`, dbErr);
    }

    // Refund token for USER role (best-effort — don't crash on refund failure)
    if (userId && role === "USER") {
      try {
        await refundToken(userId, documentId);
        console.log(`[process] Token refunded for user ${userId} (doc ${documentId})`);
      } catch (refundErr) {
        console.error(`[process] Token refund failed for ${documentId}:`, refundErr);
      }
    }

    return { success: false, documentId, error: message };
  }
}
