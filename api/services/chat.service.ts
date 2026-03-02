import apiClient from "@/api/client";
import {
  chatHistoryResponseSchema,
  type ChatHistoryResponse,
} from "@/api/schema";

// ── GET /api/documents/[id]/chat-history ─────────────────────────────────────

/**
 * Fetches the full chat history and remaining message quota for a document.
 */
export async function getChatHistory(
  documentId: string
): Promise<ChatHistoryResponse> {
  const response = await apiClient.get(`/documents/${documentId}/chat-history`);
  return chatHistoryResponseSchema.parse(response.data);
}

// ── POST /api/chat (streaming) ────────────────────────────────────────────────

export interface SendMessageOptions {
  /**
   * Called progressively as streaming chunks arrive.
   * Receives the *full accumulated text* so far — not just the latest chunk.
   */
  onChunk?: (accumulatedText: string) => void;
  /** AbortSignal to cancel the in-flight stream. */
  signal?: AbortSignal;
}

interface ChatErrorBody {
  error?: string;
  code?: string;
}

/**
 * Sends a chat message to the RAG-powered chat endpoint and streams the
 * assistant's reply back via the Fetch Streams API.
 *
 * Returns the full response text once streaming is complete.
 * The `options.onChunk` callback is called on every chunk so the UI can
 * update incrementally without waiting for the full response.
 *
 * Note: This uses the native `fetch` API (not axios) because axios does not
 * natively support server-sent streaming responses.
 */
export async function sendMessage(
  documentId: string,
  message: string,
  options?: SendMessageOptions
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, message }),
    signal: options?.signal,
    credentials: "include",
  });

  if (!response.ok) {
    const body = (await response.json()) as ChatErrorBody;
    throw {
      error: body.error ?? "Chat request failed.",
      code: body.code,
      status: response.status,
    };
  }

  if (!response.body) {
    throw { error: "No response body received.", status: 500 };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    options?.onChunk?.(fullText);
  }

  return fullText;
}

