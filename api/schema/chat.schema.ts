import { z } from "zod";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const messageRoleSchema = z.enum(["USER", "ASSISTANT"]);

// ── Chat message ──────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  id: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
});

// ── API response wrappers ─────────────────────────────────────────────────────

export const chatHistoryResponseSchema = z.object({
  messages: z.array(chatMessageSchema),
  userMessageCount: z.number(),
  /** null for SUBSCRIBER / ADMIN (unlimited) */
  limit: z.number().nullable(),
  /** null for SUBSCRIBER / ADMIN (unlimited) */
  remaining: z.number().nullable(),
  documentStatus: z.string(),
});

export const clearChatResponseSchema = z.object({
  success: z.boolean(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type MessageRole = z.infer<typeof messageRoleSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;
export type ClearChatResponse = z.infer<typeof clearChatResponseSchema>;

