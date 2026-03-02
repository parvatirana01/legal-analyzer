import { z } from "zod";

// ── User ──────────────────────────────────────────────────────────────────────

export const userSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable(),
  role: z.string(),
  tokensRemaining: z.number(),
  tokensResetDate: z.string().nullable().optional(),
});

// ── API response wrappers ─────────────────────────────────────────────────────

export const userResponseSchema = z.object({
  user: userSchema,
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type User = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

