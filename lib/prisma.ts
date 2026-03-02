import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

/**
 * Normalises the DATABASE_URL SSL mode to silence the pg deprecation warning:
 *
 *   "The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases
 *    for 'verify-full'. In the next major version these modes will adopt
 *    standard libpq semantics, which have weaker security guarantees."
 *
 * Current pg behaviour for 'require' is identical to 'verify-full' (full cert
 * verification). Explicitly setting 'verify-full' locks in that secure
 * behaviour now so future pg upgrades cannot silently weaken it.
 */
function buildConnectionString(): string {
  const url = process.env.DATABASE_URL ?? "";

  // Replace any of the three deprecated SSL modes with the explicit equivalent.
  return url.replace(
    /sslmode=(prefer|require|verify-ca)/g,
    "sslmode=verify-full"
  );
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: buildConnectionString() }),
  });

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma;
