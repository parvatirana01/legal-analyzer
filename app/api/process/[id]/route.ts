import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/process-document";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── POST /api/process/[id] ────────────────────────────────────────────────────
//
// Triggers background AI processing for a document.
// Can be called by:
//   - The upload route (fire-and-forget, no auth required server-side)
//   - The results page "Retry" button (requires user ownership)
//
// The actual processing runs async — the response returns immediately.

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

  // ── Authorization ──────────────────────────────────────────────────────────
  // Guests can retry their own documents via the internal secret header.
  // Authenticated users must own the document.
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal =
    internalSecret === process.env.INTERNAL_API_SECRET &&
    !!process.env.INTERNAL_API_SECRET;

  let processUserId: string | null = null;
  let processRole: UserRole | null = null;

  if (!isInternal) {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    processUserId = userId;
    processRole = (session?.user?.role ?? null) as UserRole | null;

    // Resolve guest session for unauthenticated users
    let guestSessionId: string | null = null;
    if (!userId) {
      const cookieStore = await cookies();
      guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
    }

    if (!userId && !guestSessionId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Verify ownership (auth user OR guest)
    const doc = await prisma.document.findUnique({
      where: { id: documentId, deletedAt: null },
      select: { userId: true, guestSessionId: true, status: true, updatedAt: true },
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

    if (doc.status === "COMPLETED") {
      return NextResponse.json(
        { message: "Document already completed." },
        { status: 200 }
      );
    }

    // Allow force-retry if stuck in PROCESSING for more than 3 minutes
    if (doc.status === "PROCESSING") {
      const stuckThresholdMs = 3 * 60 * 1000;
      const isStuck = Date.now() - new Date(doc.updatedAt).getTime() > stuckThresholdMs;
      if (!isStuck) {
        return NextResponse.json(
          { message: "Document is already being processed." },
          { status: 202 }
        );
      }
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "UPLOADED" },
      });
    }
  }

  // ── Fire and forget ────────────────────────────────────────────────────────
  processDocument(documentId, processUserId, processRole).catch((err: unknown) => {
    console.error(`[api/process] Unhandled error for ${documentId}:`, err);
  });

  return NextResponse.json(
    { message: "Processing started.", documentId },
    { status: 202 }
  );
}

