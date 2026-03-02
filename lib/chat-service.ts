/**
 * Chat service — message limits, history management, persistence.
 */

import { prisma } from "@/lib/prisma";
import type { ChatRole } from "@/lib/generated/prisma/enums";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum USER-role messages allowed per document for the USER plan */
export const USER_CHAT_LIMIT = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessageRecord {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export interface MessageLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Count the number of USER-role messages for a document.
 * Since each document belongs to one user, this equals the user's chat count.
 */
export async function getUserMessageCount(documentId: string): Promise<number> {
  return prisma.chatMessage.count({
    where: { documentId, role: "USER" },
  });
}

/**
 * Check whether a new USER message is within the limit.
 * SUBSCRIBER and ADMIN roles always return `allowed: true`.
 */
export async function checkMessageLimit(
  documentId: string,
  role: string
): Promise<MessageLimitResult> {
  if (role === "SUBSCRIBER" || role === "ADMIN") {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  }

  const used = await getUserMessageCount(documentId);
  const remaining = Math.max(0, USER_CHAT_LIMIT - used);

  return {
    allowed: used < USER_CHAT_LIMIT,
    used,
    limit: USER_CHAT_LIMIT,
    remaining,
  };
}

/**
 * Retrieve full chat history for a document ordered ascending by createdAt.
 */
export async function getChatHistory(
  documentId: string
): Promise<ChatMessageRecord[]> {
  return prisma.chatMessage.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Atomically save a USER message and the ASSISTANT reply.
 * Uses createMany inside a transaction so both are stored or neither.
 */
export async function saveMessages(
  documentId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { documentId, role: "USER", content: userMessage },
    }),
    prisma.chatMessage.create({
      data: { documentId, role: "ASSISTANT", content: assistantMessage },
    }),
  ]);
}

/**
 * Delete all chat messages for a document (used by the "clear chat" action).
 */
export async function clearChatHistory(documentId: string): Promise<void> {
  await prisma.chatMessage.deleteMany({ where: { documentId } });
}

