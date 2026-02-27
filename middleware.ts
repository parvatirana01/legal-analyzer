/**
 * Edge-compatible middleware.
 * Uses the lean authConfig (no Prisma) to verify the JWT and protect routes.
 */
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
