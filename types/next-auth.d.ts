import type { UserRole } from "@/lib/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tokensRemaining: number;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    role: UserRole;
    tokensRemaining: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tokensRemaining: number;
  }
}

