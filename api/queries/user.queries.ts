"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/services";
import { queryKeys } from "./keys";
import type { User } from "@/api/schema";

// ── useCurrentUser ────────────────────────────────────────────────────────────

/**
 * Returns fresh user data (name, email, role, tokensRemaining) from the server.
 * Bypasses the potentially-stale Next-Auth JWT so token counts are always
 * up-to-date after deductions.
 *
 * Pass `placeholderData` to show SSR-fetched user data instantly while the
 * client-side fetch is in flight (avoids a flash of missing token count).
 * TanStack Query will replace it with live data once the fetch resolves,
 * and will automatically re-fetch whenever the cache is invalidated
 * (e.g. after upload or re-analysis deducts a token).
 *
 * @example
 * // Without SSR data
 * const { data: user } = useCurrentUser();
 *
 * // With SSR data (e.g. passed as a prop from a server component)
 * const { data: user } = useCurrentUser({ placeholderData: initialUser });
 */
export function useCurrentUser(options?: { placeholderData?: User }) {
  return useQuery<User>({
    queryKey: queryKeys.user.me(),
    queryFn: getCurrentUser,
    staleTime: 60_000,
    retry: 1,
    placeholderData: options?.placeholderData,
  });
}
