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
 *
 * This function is designed to be called fire-and-forget from the upload
 * route — it must never throw unhandled rejections.
 */

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { extractText } from "@/lib/extract-text";
import { analyzeDocument } from "@/lib/gemini";
import { calculateRiskScore } from "@/lib/risk-score";
import { prisma } from "@/lib/prisma";
import type { RiskLevel } from "@/lib/generated/prisma/enums";

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

  // Body is a ReadableStream in Node.js — collect chunks
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
 * Safe to call without `await` — errors are caught and written to the DB.
 */
export async function processDocument(
  documentId: string
): Promise<ProcessDocumentOutcome> {
  const startedAt = Date.now();

  // ── Step 1: Fetch document metadata ────────────────────────────────────────
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

  // Allow re-processing if stuck in PROCESSING (e.g. server restart mid-pipeline)
  // The process API already resets status to UPLOADED before calling here for force-retries.

  // ── Step 2: Mark as PROCESSING ─────────────────────────────────────────────
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
    // ── Step 3: Fetch file from R2 ──────────────────────────────────────────
    console.log(`[process] Fetching ${doc.fileUrl} from R2…`);
    const buffer = await fetchFileFromR2(doc.fileUrl);

    // ── Step 4: Determine MIME type from R2 key extension ──────────────────
    const ext = doc.fileUrl.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
    };
    const mimeType = mimeMap[ext] ?? "application/pdf";

    // ── Step 5: Extract text ────────────────────────────────────────────────
    console.log(`[process] Extracting text from ${documentId}…`);
    const { text, truncated } = await extractText(buffer, mimeType);

    if (truncated) {
      console.warn(`[process] Text truncated for ${documentId} — file was very large.`);
    }

    // ── Step 6: Gemini analysis ─────────────────────────────────────────────
    console.log(`[process] Calling Gemini for ${documentId}…`);
    const analysis = await analyzeDocument(text);

    // ── Step 7: Risk score ──────────────────────────────────────────────────
    const { score, level } = calculateRiskScore(analysis.clauses);
    console.log(`[process] Risk score: ${score} (${level}) for ${documentId}`);

    // ── Step 8: Persist results in a transaction ────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Delete any stale clause records (idempotent retry support)
      await tx.clause.deleteMany({ where: { documentId } });

      // Insert new clause records
      if (analysis.clauses.length > 0) {
        await tx.clause.createMany({
          data: analysis.clauses.map((c) => ({
            documentId,
            title: c.title,
            content: c.summary,      // Clause.content stores the summary
            riskLevel: c.riskLevel as RiskLevel,
            explanation: c.explanation,
            suggestion: c.suggestion,
          })),
        });
      }

      // Update document with full analysis
      await tx.document.update({
        where: { id: documentId },
        data: {
          status: "COMPLETED",
          summary: analysis.summary,
          pros: analysis.pros,
          cons: analysis.cons,
          riskScore: score,
          riskLevel: level as RiskLevel,
          overallAnalysis: analysis as unknown as Record<string, unknown>,
        },
      });
    });

    const processingMs = Date.now() - startedAt;
    console.log(`[process] Completed ${documentId} in ${processingMs}ms`);

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

    // Mark document as FAILED with error message
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "FAILED",
          // Store error in overallAnalysis for debugging
          overallAnalysis: { error: message } as unknown as Record<string, unknown>,
        },
      });
    } catch (dbErr) {
      console.error(`[process] Failed to mark FAILED for ${documentId}:`, dbErr);
    }

    return { success: false, documentId, error: message };
  }
}

