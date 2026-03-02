/**
 * Centralised query-key factory.
 *
 * Using structured key arrays instead of bare strings lets you:
 *   • Invalidate all queries under a key prefix (e.g. all document queries)
 *   • Keep keys consistent between query definitions and manual invalidations
 *   • Avoid typo bugs from duplicated string literals
 */
export const queryKeys = {
  // ── User ───────────────────────────────────────────────────────────────────
  user: {
    all: () => ["user"] as const,
    me: () => ["user", "me"] as const,
  },

  // ── Document ───────────────────────────────────────────────────────────────
  document: {
    all: () => ["document"] as const,
    detail: (id: string) => ["document", id] as const,
  },

  // ── Chat ───────────────────────────────────────────────────────────────────
  chat: {
    all: () => ["chat"] as const,
    history: (documentId: string) =>
      ["chat", documentId, "history"] as const,
  },
} as const;

