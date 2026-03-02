"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatHistory, clearChat, sendMessage, type SendMessageOptions } from "@/api/services";
import { queryKeys } from "./keys";
import type { ChatHistoryResponse } from "@/api/schema";

// ── useChatHistory ────────────────────────────────────────────────────────────

/**
 * Fetches the full chat history for a document along with message quota info.
 *
 * @example
 * const { data: history, isLoading } = useChatHistory(documentId);
 * history?.messages.forEach((m) => console.log(m.role, m.content));
 */
export function useChatHistory(documentId: string | undefined) {
  return useQuery<ChatHistoryResponse>({
    queryKey: queryKeys.chat.history(documentId ?? ""),
    queryFn: () => getChatHistory(documentId!),
    enabled: !!documentId,
    staleTime: 30_000, // treat as fresh for 30s
    retry: 1,
  });
}

// ── useClearChat ──────────────────────────────────────────────────────────────

/**
 * Deletes all chat messages for a document.
 * Invalidates the chat history cache on success.
 *
 * @example
 * const { mutate: clear, isPending } = useClearChat();
 * clear(documentId);
 */
export function useClearChat() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (documentId: string) => clearChat(documentId),
    onSuccess: (_, documentId) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.chat.history(documentId),
      });
    },
  });
}

// ── useSendMessage ────────────────────────────────────────────────────────────

interface SendMessageVariables {
  documentId: string;
  message: string;
  /** Streaming callbacks — pass `onChunk` to update UI incrementally. */
  options?: SendMessageOptions;
}

/**
 * Sends a chat message and streams the assistant reply back.
 *
 * The mutation resolves with the **full** response text once streaming
 * completes. Use `options.onChunk` to receive incremental updates so the UI
 * can display the message as it streams in.
 *
 * Chat history is invalidated after a successful send so the persisted
 * messages stay in sync with the local streaming state.
 *
 * @example
 * const { mutate: send, isPending } = useSendMessage();
 *
 * send({
 *   documentId,
 *   message: userInput,
 *   options: {
 *     onChunk: (text) => setStreamingText(text),
 *     signal: abortController.signal,
 *   },
 * });
 */
export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation<string, Error, SendMessageVariables>({
    mutationFn: ({ documentId, message, options }) =>
      sendMessage(documentId, message, options),
    onSuccess: (_, { documentId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.chat.history(documentId),
      });
    },
  });
}

