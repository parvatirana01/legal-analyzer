import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearChatHistory } from "@/lib/chat-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: documentId } = await context.params;

  if (!documentId) {
    return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  // Must be authenticated to clear chat
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Ownership check
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: { userId: true, guestSessionId: true },
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

  await clearChatHistory(documentId);

  return NextResponse.json({ success: true, message: "Chat history cleared." });
}

