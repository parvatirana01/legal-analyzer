import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// ── GET /api/documents/[id] ───────────────────────────────────────────────────
// Returns document status + analysis data for both auth users and guests.

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: documentId } = await context.params;

  if (!documentId) {
    return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Resolve guest session ID from cookie
  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      userId: true,
      guestSessionId: true,
      fileName: true,
      fileSize: true,
      status: true,
      riskScore: true,
      riskLevel: true,
      summary: true,
      pros: true,
      cons: true,
      overallAnalysis: true,
      createdAt: true,
      updatedAt: true,
      clauses: {
        select: {
          id: true,
          title: true,
          content: true,
          riskLevel: true,
          explanation: true,
          suggestion: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  // Ownership check
  const isOwner =
    (userId && doc.userId === userId) ||
    (guestSessionId && doc.guestSessionId === guestSessionId);

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ document: doc }, { status: 200 });
}

