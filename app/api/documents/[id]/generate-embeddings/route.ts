/**
 * POST /api/documents/[id]/generate-embeddings
 *
 * Lightweight endpoint that:
 *   1. Validates ownership
 *   2. Downloads the file from R2
 *   3. Extracts plain text
 *   4. Generates & stores embeddings (pgvector)
 *
 * Does NOT re-run AI analysis and does NOT deduct a token.
 * Used to backfill embeddings for documents analyzed before the embedding
 * pipeline was set up, or when the chat detects no embeddings exist.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";
import { extractText } from "@/lib/extract-text";
import { generateAndStoreEmbeddings } from "@/lib/embeddings";
import { DocumentStatus } from "@/lib/generated/prisma/enums";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: documentId } = await context.params;

  if (!documentId) {
    return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  if (!userId && !guestSessionId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Document lookup & ownership ───────────────────────────────────────────
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: {
      userId: true,
      guestSessionId: true,
      fileUrl: true,
      fileName: true,
      status: true,
      _count: { select: { embeddings: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const isOwner =
    (userId && doc.userId === userId) ||
    (guestSessionId && doc.guestSessionId === guestSessionId);

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (doc.status !== DocumentStatus.COMPLETED) {
    return NextResponse.json(
      { error: "Document must be fully analyzed before embeddings can be generated." },
      { status: 400 }
    );
  }

  // Skip if embeddings already exist (idempotency guard, can override with ?force=true)
  const force = req.nextUrl.searchParams.get("force") === "true";
  if (doc._count.embeddings > 0 && !force) {
    return NextResponse.json({
      message: "Embeddings already exist.",
      count: doc._count.embeddings,
    });
  }

  // ── Download from R2 ──────────────────────────────────────────────────────
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: doc.fileUrl,
    });
    const r2Response = await r2Client.send(command);

    if (!r2Response.Body) {
      throw new Error("Empty response from R2.");
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of r2Response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // ── Extract text ────────────────────────────────────────────────────────
    const ext = doc.fileUrl.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
    };
    const mimeType = mimeMap[ext] ?? "application/pdf";
    const { text } = await extractText(fileBuffer, mimeType);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this document." },
        { status: 422 }
      );
    }

    // ── Generate & store embeddings ─────────────────────────────────────────
    await generateAndStoreEmbeddings(documentId, text);

    const newCount = await prisma.documentEmbedding.count({
      where: { documentId },
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${newCount} embedding chunks for this document.`,
      count: newCount,
    });
  } catch (err) {
    console.error(`[generate-embeddings] Failed for ${documentId}:`, err);
    return NextResponse.json(
      { error: "Failed to generate embeddings. Please try again." },
      { status: 500 }
    );
  }
}

