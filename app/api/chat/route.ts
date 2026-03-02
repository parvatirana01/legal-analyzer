import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContextForQuery } from "@/lib/rag";
import { streamRagAnswer } from "@/lib/gemini";
import { checkMessageLimit, saveMessages } from "@/lib/chat-service";

// ── In-memory rate limiter (per-user sliding window) ──────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CHAT_RATE_LIMITS: Record<string, number> = {
  USER: 5,
  SUBSCRIBER: 20,
  ADMIN: Infinity,
  GUEST: 3,
};

function checkChatRateLimit(
  identifier: string,
  role: string,
  windowMs = 60_000
): boolean {
  const limit = CHAT_RATE_LIMITS[role] ?? CHAT_RATE_LIMITS.GUEST;
  if (limit === Infinity) return true;

  const now = Date.now();
  const entry = rateLimitStore.get(identifier) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    rateLimitStore.set(identifier, entry);
    return false;
  }

  entry.timestamps.push(now);
  rateLimitStore.set(identifier, entry);
  return true;
}

// ── Route ─────────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  documentId: string;
  message: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { documentId, message } = body;

  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "Missing documentId." }, { status: 400 });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 chars)." }, { status: 400 });
  }

  // ── 2. Auth ───────────────────────────────────────────────────────────────
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const role = (session?.user?.role as string | undefined) ?? "GUEST";

  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  // Guests cannot use chat
  if (!userId) {
    return NextResponse.json(
      { error: "Please log in to chat with your document.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  // ── 3. Rate limit ─────────────────────────────────────────────────────────
  const rateLimitKey = userId;
  const allowed = checkChatRateLimit(rateLimitKey, role);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment before sending another.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // ── 4. Ownership check ────────────────────────────────────────────────────
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: { userId: true, guestSessionId: true, status: true, fileName: true },
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

  // ── 5. Status check ───────────────────────────────────────────────────────
  if (doc.status !== "COMPLETED") {
    return NextResponse.json(
      {
        error:
          doc.status === "PROCESSING"
            ? "Document is still being analyzed. Please wait until analysis is complete."
            : "Document analysis must be complete before you can chat.",
        code: "NOT_READY",
      },
      { status: 400 }
    );
  }

  // ── 6. Message limit check ────────────────────────────────────────────────
  const limitResult = await checkMessageLimit(documentId, role);
  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: `You have reached the limit of ${limitResult.limit} messages per document on the free plan.`,
        code: "LIMIT_EXCEEDED",
        used: limitResult.used,
        limit: limitResult.limit,
      },
      { status: 403 }
    );
  }

  // ── 7. Retrieve relevant context via RAG ──────────────────────────────────
  let context: string;
  try {
    const ragResult = await getContextForQuery(documentId, message.trim());
    context = ragResult.context;

    if (!context) {
      context = "No relevant context found in the document.";
    }
  } catch (ragErr) {
    console.error(`[chat] RAG retrieval failed for ${documentId}:`, ragErr);
    return NextResponse.json(
      { error: "Failed to retrieve document context. Please try again." },
      { status: 500 }
    );
  }

  // ── 8. Stream Gemini response ─────────────────────────────────────────────
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamRagAnswer(message.trim(), context)) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "AI generation failed.";
        console.error(`[chat] Gemini stream error for ${documentId}:`, err);
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        // Save messages after stream completes (best-effort)
        if (fullResponse.trim()) {
          try {
            await saveMessages(documentId, message.trim(), fullResponse.trim());
          } catch (saveErr) {
            console.error(`[chat] Failed to save messages for ${documentId}:`, saveErr);
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Chat-Used": String(limitResult.used + 1),
      "X-Chat-Limit": String(limitResult.limit === Infinity ? -1 : limitResult.limit),
      "X-Chat-Remaining": String(
        limitResult.limit === Infinity ? -1 : Math.max(0, limitResult.remaining - 1)
      ),
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

