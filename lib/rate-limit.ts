import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── Limits per role (uploads per hour) ───────────────────────────────────────

const RATE_LIMITS: Record<string, number> = {
  GUEST: 2,
  USER: 5,
  SUBSCRIBER: 20,
  ADMIN: Infinity,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  /** Uploads remaining in the current window (may be 0) */
  remaining: number;
  /** Uploads used in the last hour */
  used: number;
  /** Maximum allowed per hour for this role */
  limit: number;
}

// ── Main check ────────────────────────────────────────────────────────────────

/**
 * Check whether an upload is within the hourly rate limit.
 *
 * @param userId          The authenticated user ID (null for guests)
 * @param guestSessionId  The guest session ID (null for authenticated users)
 * @param role            The uploader's role
 */
export async function checkRateLimit(
  userId: string | null,
  guestSessionId: string | null,
  role: UserRole | "GUEST"
): Promise<RateLimitResult> {
  const roleKey = (role as string) in RATE_LIMITS ? (role as string) : "GUEST";
  const limit = RATE_LIMITS[roleKey];

  // Admins are never rate-limited
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, used: 0, limit: Infinity };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Count recent documents for this identity
  const used = await prisma.document.count({
    where: {
      createdAt: { gte: oneHourAgo },
      ...(userId
        ? { userId }
        : { guestSessionId: guestSessionId ?? "__none__" }),
    },
  });

  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    remaining,
    used,
    limit,
  };
}

