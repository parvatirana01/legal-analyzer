import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatHistory, getUserMessageCount, USER_CHAT_LIMIT } from "@/lib/chat-service";

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
  const role = (session?.user?.role as string | undefined) ?? "GUEST";

  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  // Ownership check
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: { userId: true, guestSessionId: true, status: true },
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

  const [messages, userMessageCount] = await Promise.all([
    getChatHistory(documentId),
    getUserMessageCount(documentId),
  ]);

  const isUnlimited = role === "SUBSCRIBER" || role === "ADMIN";

  return NextResponse.json({
    messages,
    userMessageCount,
    limit: isUnlimited ? null : USER_CHAT_LIMIT,
    remaining: isUnlimited ? null : Math.max(0, USER_CHAT_LIMIT - userMessageCount),
    documentStatus: doc.status,
  });
}

