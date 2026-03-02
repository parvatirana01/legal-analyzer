import { prisma } from "@/lib/prisma";
import { resetTokensIfExpired } from "@/lib/tokens";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TokenCheckResult =
  | { allowed: true }
  | { allowed: false; error: string };

// ── Token deduction ───────────────────────────────────────────────────────────

/**
 * Deduct 1 token for a document analysis.
 *
 * Rules:
 *  - ADMIN / SUBSCRIBER: always allowed, no deduction.
 *  - USER: atomically check balance (auto-reset if expired) → deduct → log.
 *  - GUEST: always allowed here; guest limits are enforced at the upload route.
 */
export async function deductTokenForAnalysis(
  userId: string,
  role: UserRole,
  documentId: string
): Promise<TokenCheckResult> {
  if (role === "SUBSCRIBER" || role === "ADMIN") {
    return { allowed: true };
  }

  // Trigger monthly auto-reset before reading the balance
  const available = await resetTokensIfExpired(userId);

  if (available <= 0) {
    return {
      allowed: false,
      error:
        "You have no analysis tokens remaining. Your tokens will reset in 30 days.",
    };
  }

  // Atomic read-check-deduct inside a transaction
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { tokensRemaining: true },
      });

      if (!user || user.tokensRemaining <= 0) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      await tx.user.update({
        where: { id: userId },
        data: { tokensRemaining: { decrement: 1 } },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -1,
          reason: `DOCUMENT_ANALYSIS:${documentId}`,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_TOKENS") {
      return {
        allowed: false,
        error:
          "You have no analysis tokens remaining. Your tokens will reset in 30 days.",
      };
    }
    throw err;
  }

  return { allowed: true };
}

// ── Token refund ──────────────────────────────────────────────────────────────

/**
 * Refund 1 token when the AI pipeline fails after a token was already deducted.
 * Only call this for USER role — SUBSCRIBER / ADMIN tokens are never deducted.
 */
export async function refundToken(
  userId: string,
  documentId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { tokensRemaining: { increment: 1 } },
    });

    await tx.tokenTransaction.create({
      data: {
        userId,
        amount: 1,
        reason: `ANALYSIS_REFUND:${documentId}`,
      },
    });
  });
}

