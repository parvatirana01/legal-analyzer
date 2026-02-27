import { prisma } from "@/lib/prisma";

/**
 * Returns true if the tokensResetDate is null or in the past.
 */
export function isTokenExpired(date: Date | null | undefined): boolean {
  if (!date) return true;
  return new Date() > date;
}

/**
 * If the user's tokensResetDate has passed (or is missing), reset their
 * tokensRemaining to 3 and set a new reset date 30 days from now.
 * Returns the updated tokensRemaining value.
 */
export async function resetTokensIfExpired(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokensResetDate: true, tokensRemaining: true },
  });

  if (!user) return 3;

  if (isTokenExpired(user.tokensResetDate ?? null)) {
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + 30);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        tokensRemaining: 3,
        tokensResetDate: resetDate,
      },
      select: { tokensRemaining: true },
    });

    return updated.tokensRemaining;
  }

  return user.tokensRemaining;
}

