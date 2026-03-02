import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSignedDownloadUrl } from "@/lib/signed-url";

// ── GET /api/documents/[id]/download ─────────────────────────────────────────
//
// Validates ownership, then redirects to a 5-minute presigned R2 URL.
// Never exposes the raw R2 key or bucket URL to the client.

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: documentId } = await context.params;

  // ── Identity resolution ────────────────────────────────────────────────────
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

  // ── Ownership check ────────────────────────────────────────────────────────
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: { userId: true, guestSessionId: true, fileUrl: true },
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

  // ── Generate presigned URL and redirect ────────────────────────────────────
  const signedUrl = await getSignedDownloadUrl(doc.fileUrl);
  return NextResponse.redirect(signedUrl);
}

