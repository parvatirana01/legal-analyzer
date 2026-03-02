import apiClient from "@/api/client";
import { userResponseSchema, type User } from "@/api/schema";

// ── GET /api/user/me ──────────────────────────────────────────────────────────

/**
 * Fetches the currently authenticated user's fresh data from the server.
 * Bypasses the potentially-stale JWT so token counts are always current.
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ user: User }>("/user/me");
  const parsed = userResponseSchema.parse(response.data);
  return parsed.user;
}

