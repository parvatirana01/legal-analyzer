/**
 * Full auth config — runs in Node.js (API routes, Server Components).
 * Imports Prisma for user upsert. NOT used in middleware.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/generated/prisma/enums";
import { resetTokensIfExpired } from "@/lib/tokens";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  callbacks: {
    // Keep the edge-safe callbacks from authConfig
    ...authConfig.callbacks,

    /**
     * Runs after successful OAuth sign-in (Node.js only).
     * Creates the user on first login or resets tokens if expired.
     */
    async signIn({ user }) {
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, tokensResetDate: true },
      });

      if (!existing) {
        // First login — create user with default values
        const resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 30);

        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: UserRole.USER,
            tokensRemaining: 3,
            tokensResetDate: resetDate,
          },
        });
      } else {
        // Subsequent login — sync name/image and reset tokens if expired
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });

        await resetTokensIfExpired(existing.id);
      }

      return true;
    },

    /**
     * Runs when a JWT is created or refreshed (Node.js only).
     * On initial sign-in, loads role + tokens from DB into the token.
     */
    async jwt({ token, user }) {
      // `user` is only present on the initial sign-in
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, tokensRemaining: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.tokensRemaining = dbUser.tokensRemaining;
        }
      }

      return token;
    },

    // session callback is inherited from authConfig (edge-safe, reads token)
  },
});
