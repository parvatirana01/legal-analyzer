/**
 * Edge-compatible auth config — NO Node.js-only imports here.
 * Used by middleware.ts (Edge Runtime) and spread into lib/auth.ts (Node.js).
 */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

type UserRole = "GUEST" | "USER" | "SUBSCRIBER" | "ADMIN";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Auth.js v5 reads AUTH_SECRET; fall back to NEXTAUTH_SECRET for compatibility
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/", // redirect unauthenticated users to the landing page
  },

  session: { strategy: "jwt" },

  callbacks: {
    /**
     * Runs in the Edge Runtime (middleware).
     * Returning false redirects to pages.signIn ("/").
     */
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Allow NextAuth APIs to pass through
      if (pathname.startsWith("/api/auth")) return true;

      // Protect all other APIs, dashboard, and documents
      if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/documents")
      ) {
        return isAuthenticated;
      }

      if (pathname.startsWith("/admin")) {
        return isAuthenticated && auth?.user?.role === "ADMIN";
      }

      return true;
    },

    /**
     * Minimal session callback — exposes custom token fields to auth().
     * No DB access (edge-safe). The fields were written to the token by
     * the full jwt callback in lib/auth.ts on sign-in.
     */
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.tokensRemaining = token.tokensRemaining as number;
      }
      return session;
    },
  },
};

