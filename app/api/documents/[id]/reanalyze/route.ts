import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/process-document";
import { deductTokenForAnalysis } from "@/lib/token-manager";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── POST /api/documents/[id]/reanalyze ────────────────────────────────────────
//
// Deducts a token, wipes the previous analysis, and re-runs the AI pipeline.
// Requires authenticated ownership.

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: documentId } = await context.params;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Ownership check ────────────────────────────────────────────────────────
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: { userId: true, status: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (doc.userId !== userId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (doc.status === "PROCESSING") {
    return NextResponse.json(
      { error: "Document is already being processed." },
      { status: 409 }
    );
  }

  // ── Token deduction ────────────────────────────────────────────────────────
  const role = (session.user.role ?? "USER") as UserRole;
  const tokenResult = await deductTokenForAnalysis(userId, role, documentId);

  if (!tokenResult.allowed) {
    return NextResponse.json({ error: tokenResult.error }, { status: 402 });
  }

  // ── Wipe previous analysis & reset status ─────────────────────────────────
  await prisma.$transaction(async (tx) => {
    await tx.clause.deleteMany({ where: { documentId } });
    await tx.document.update({
      where: { id: documentId },
      data: {
        status: "UPLOADED",
        riskScore: null,
        riskLevel: null,
        summary: null,
        pros: null,
        cons: null,
        overallAnalysis: null,
        processingTimeMs: null,
        aiModelUsed: null,
      },
    });
  });

  // ── Fire-and-forget ────────────────────────────────────────────────────────
  processDocument(documentId, userId, role).catch((err: unknown) => {
    console.error(`[reanalyze] Background processing error for ${documentId}:`, err);
  });

  return NextResponse.json(
    { success: true, documentId, message: "Re-analysis started." },
    { status: 202 }
  );
}

