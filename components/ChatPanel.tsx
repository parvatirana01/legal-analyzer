"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  Lock,
  Zap,
  MessageSquare,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = "USER" | "ASSISTANT";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  userMessageCount: number;
  limit: number | null;
  remaining: number | null;
  documentStatus: string;
}

interface ChatPanelProps {
  documentId: string;
  isAuthenticated: boolean;
  userRole: string;
  documentStatus: string;
  documentName?: string;
}

// ── Quick suggestions ─────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  "Summarise this document in simple terms",
  "What are the key risks I should know about?",
  "Who are the parties involved?",
  "What are my obligations under this contract?",
];

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silently fail */
    }
  };

  return (
    <button
      onClick={copy}
      title="Copy message"
      className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-white/30 hover:text-white/70 transition-all"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ── Upgrade modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-violet-500/20 bg-[#0f0f1a] p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/30 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20">
            <Zap className="h-7 w-7 text-violet-400" />
          </span>
        </div>

        <h2 className="mb-2 text-center text-xl font-bold text-white">
          Upgrade to Pro
        </h2>
        <p className="mb-6 text-center text-sm text-white/50">
          You&apos;ve used all 10 free messages for this document. Upgrade to Pro
          for unlimited questions on every document.
        </p>

        <ul className="mb-6 space-y-2.5">
          {[
            "Unlimited chat messages per document",
            "Priority AI processing",
            "Export chat transcripts",
            "Advanced risk analysis",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-white/70">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-600/20">
                <Check className="h-3 w-3 text-violet-400" />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-violet-500 hover:to-purple-500"
        >
          Upgrade to Pro — Unlimited Access
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ── Typing animation ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === "USER";

  return (
    <div
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-violet-600/30"
            : "bg-sky-600/20"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-violet-400" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-sky-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`relative max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-violet-600/25 text-white"
            : "rounded-tl-sm bg-white/5 text-white/85"
        } ${message.isStreaming ? "border border-violet-500/20" : ""}`}
      >
        {message.isStreaming && !message.content ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Copy button (non-streaming only) */}
        {!message.isStreaming && message.content && (
          <div
            className={`mt-1 flex ${isUser ? "justify-start" : "justify-end"}`}
          >
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ChatPanel({
  documentId,
  isAuthenticated,
  userRole,
  documentStatus,
  documentName,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState<number | null>(10);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Embedding pipeline state
  const [embeddingStatus, setEmbeddingStatus] = useState<
    "idle" | "checking" | "generating" | "ready" | "error"
  >("idle");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isUnlimited = userRole === "SUBSCRIBER" || userRole === "ADMIN";
  const limitReached =
    !isUnlimited && messageLimit !== null && userMessageCount >= messageLimit;

  // ── Ensure embeddings exist before allowing chat ──────────────────────────

  useEffect(() => {
    if (documentStatus !== "COMPLETED") return;

    async function ensureEmbeddings() {
      setEmbeddingStatus("checking");
      try {
        // Check if embeddings already exist (POST with no ?force returns fast if they do)
        const checkRes = await fetch(
          `/api/documents/${documentId}/generate-embeddings`,
          { method: "POST" }
        );
        const checkData = await checkRes.json() as { success?: boolean; message?: string; count?: number };

        if (checkRes.ok && !checkData.success) {
          // Already existed — message says "Embeddings already exist."
          setEmbeddingStatus("ready");
          return;
        }

        if (checkRes.ok && checkData.success) {
          // Just generated — done
          setEmbeddingStatus("ready");
          return;
        }

        // Non-OK response → try to generate
        setEmbeddingStatus("generating");
        const genRes = await fetch(
          `/api/documents/${documentId}/generate-embeddings?force=true`,
          { method: "POST" }
        );

        if (genRes.ok) {
          setEmbeddingStatus("ready");
        } else {
          console.error("[ChatPanel] Failed to generate embeddings");
          setEmbeddingStatus("error");
        }
      } catch (err) {
        console.error("[ChatPanel] Embedding check error:", err);
        setEmbeddingStatus("error");
      }
    }

    void ensureEmbeddings();
  }, [documentId, documentStatus]);

  // ── Load chat history on mount ────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      setHistoryLoaded(true);
      return;
    }

    fetch(`/api/documents/${documentId}/chat-history`)
      .then((r) => r.json())
      .then((data: ChatHistoryResponse) => {
        setMessages(
          data.messages.map((m) => ({ ...m, createdAt: m.createdAt }))
        );
        setUserMessageCount(data.userMessageCount);
        setMessageLimit(data.limit);
      })
      .catch((err) => {
        console.error("[ChatPanel] Failed to load history:", err);
      })
      .finally(() => setHistoryLoaded(true));
  }, [documentId, isAuthenticated]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(!historyLoaded);
  }, [messages, scrollToBottom, historyLoaded]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollButton(distanceFromBottom > 120);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !isAuthenticated) return;
      if (documentStatus !== "COMPLETED") return;
      if (limitReached) {
        setShowUpgradeModal(true);
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "USER",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setError(null);
      setIsStreaming(true);

      // Optimistically increment message count
      const newCount = userMessageCount + 1;
      setUserMessageCount(newCount);
      if (messageLimit !== null && newCount >= messageLimit) {
        // Will show modal after this message completes
      }

      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, message: text.trim() }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {
            error?: string;
            code?: string;
          };

          if (errorData.code === "LIMIT_EXCEEDED") {
            setShowUpgradeModal(true);
            setUserMessageCount((prev) => prev - 1); // rollback
          } else {
            setError(errorData.error ?? "Something went wrong.");
          }

          // Remove the streaming assistant message
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
          return;
        }

        if (!response.body) {
          throw new Error("No response body.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: fullText, isStreaming: true }
                : m
            )
          );
        }

        // Mark streaming complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: fullText, isStreaming: false }
              : m
          )
        );

        // Show upgrade modal if limit now reached
        if (!isUnlimited && messageLimit !== null && newCount >= messageLimit) {
          setTimeout(() => setShowUpgradeModal(true), 800);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        console.error("[ChatPanel] Stream error:", err);
        setError("Failed to get a response. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
        setUserMessageCount((prev) => Math.max(0, prev - 1)); // rollback
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [
      documentId,
      documentStatus,
      isAuthenticated,
      isStreaming,
      isUnlimited,
      limitReached,
      messageLimit,
      userMessageCount,
    ]
  );

  // ── Keyboard handler ──────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Clear chat ────────────────────────────────────────────────────────────

  const handleClearChat = async () => {
    if (!confirm("Clear all chat history for this document?")) return;
    setIsClearing(true);
    try {
      await fetch(`/api/documents/${documentId}/clear-chat`, {
        method: "DELETE",
      });
      setMessages([]);
      setUserMessageCount(0);
      setError(null);
    } catch {
      setError("Failed to clear chat.");
    } finally {
      setIsClearing(false);
    }
  };

  // ── Auto-resize textarea ──────────────────────────────────────────────────

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ── Counter bar ───────────────────────────────────────────────────────────

  const counterPercent =
    messageLimit !== null ? (userMessageCount / messageLimit) * 100 : 0;
  const counterColor =
    counterPercent >= 80
      ? "bg-red-500"
      : counterPercent >= 60
      ? "bg-amber-500"
      : "bg-violet-500";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      <div className="flex h-full flex-col bg-[#0a0a0f]">
        {/* ── Header ── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/8 bg-[#0a0a0f] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/20">
              <Bot className="h-4 w-4 text-violet-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Document AI</p>
              {documentName && (
                <p className="text-xs text-white/35 truncate max-w-[160px]">
                  {documentName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Message counter */}
            {isAuthenticated && !isUnlimited && messageLimit !== null && (
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  limitReached
                    ? "border-red-500/25 bg-red-500/10 text-red-400"
                    : userMessageCount >= messageLimit * 0.8
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-400"
                    : "border-white/10 bg-white/5 text-white/50"
                }`}
                title={`${userMessageCount} of ${messageLimit} messages used`}
              >
                <MessageSquare className="h-3 w-3" />
                {userMessageCount} / {messageLimit}
              </div>
            )}

            {/* Clear chat */}
            {isAuthenticated && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                disabled={isClearing || isStreaming}
                title="Clear chat history"
                className="rounded-lg p-1.5 text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Progress bar ── */}
        {isAuthenticated && !isUnlimited && messageLimit !== null && (
          <div className="h-0.5 w-full bg-white/5">
            <div
              className={`h-full transition-all duration-500 ${counterColor}`}
              style={{ width: `${Math.min(100, counterPercent)}%` }}
            />
          </div>
        )}

        {/* ── Messages ── */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto px-4 py-4"
        >
          {!isAuthenticated ? (
            /* Guest CTA */
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center px-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10">
                <Lock className="h-7 w-7 text-violet-400" />
              </span>
              <div>
                <p className="text-base font-semibold text-white">
                  Login to chat with your document
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Ask questions about clauses, risks, and obligations.
                  Get instant AI-powered answers.
                </p>
              </div>
              <Link
                href="/"
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
              >
                Sign in to continue
              </Link>
            </div>
          ) : documentStatus !== "COMPLETED" ? (
            /* Document not ready */
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400/50" />
              <p className="text-sm text-white/50">
                {documentStatus === "PROCESSING"
                  ? "Analyzing document… Chat will be available once analysis is complete."
                  : "Document analysis must complete before you can chat."}
              </p>
            </div>
          ) : embeddingStatus === "checking" || embeddingStatus === "generating" ? (
            /* Preparing embeddings */
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400/50" />
              <p className="text-sm font-medium text-white/70">
                {embeddingStatus === "checking"
                  ? "Preparing document for chat…"
                  : "Indexing document content — this takes a few seconds…"}
              </p>
              <p className="text-xs text-white/30">
                This only happens once per document.
              </p>
            </div>
          ) : embeddingStatus === "error" ? (
            /* Embedding error — non-fatal, user can still try */
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
              <AlertCircle className="h-8 w-8 text-amber-400/70" />
              <p className="text-sm font-medium text-white/70">
                Could not prepare document context.
              </p>
              <p className="text-xs text-white/40">
                You can still try chatting — answers may be limited.
              </p>
            </div>
          ) : messages.length === 0 && historyLoaded ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10">
                <Sparkles className="h-7 w-7 text-violet-400" />
              </span>
              <div>
                <p className="text-base font-semibold text-white">
                  Ask anything about this document
                </p>
                <p className="mt-1 text-sm text-white/50">
                  I&apos;ll answer using only the content of this document.
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full max-w-sm space-y-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    disabled={isStreaming}
                    className="w-full rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-left text-sm text-white/60 transition-all hover:border-violet-500/25 hover:bg-violet-500/8 hover:text-white/80"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages list */
            <div className="space-y-4 pb-2">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0a0f]/90 px-3 py-1.5 text-xs text-white/60 shadow-lg backdrop-blur-sm hover:text-white transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Scroll to bottom
            </button>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400/50 hover:text-red-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Limit warning ── */}
        {isAuthenticated &&
          !isUnlimited &&
          messageLimit !== null &&
          userMessageCount >= messageLimit * 0.8 &&
          !limitReached && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/6 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <p className="text-xs text-amber-400/80">
                {messageLimit - userMessageCount} message
                {messageLimit - userMessageCount !== 1 ? "s" : ""} remaining.{" "}
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="font-semibold text-amber-400 underline underline-offset-2"
                >
                  Upgrade for unlimited
                </button>
              </p>
            </div>
          )}

        {/* ── Input area ── */}
        {isAuthenticated && documentStatus === "COMPLETED" && (
          <div className="flex-shrink-0 border-t border-white/8 bg-[#0a0a0f] px-4 py-3">
            {limitReached ? (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/8 p-4 text-center">
                <p className="mb-2 text-sm font-semibold text-violet-300">
                  Message limit reached
                </p>
                <p className="mb-3 text-xs text-white/50">
                  Upgrade to Pro for unlimited questions on every document.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all"
                >
                  Ask unlimited questions with Pro
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-2 rounded-2xl border border-white/8 bg-white/3 px-3 py-2 focus-within:border-violet-500/30 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    embeddingStatus === "checking" || embeddingStatus === "generating"
                      ? "Preparing document context…"
                      : "Ask about clauses, risks, obligations…"
                  }
                  disabled={isStreaming || embeddingStatus === "checking" || embeddingStatus === "generating"}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50"
                  style={{ minHeight: "24px", maxHeight: "120px" }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isStreaming || !input.trim() || embeddingStatus === "checking" || embeddingStatus === "generating"}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}

            {/* Quick suggestions (after history is loaded and there are messages) */}
            {!limitReached && messages.length > 0 && !isStreaming && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="flex-shrink-0 rounded-full border border-white/8 px-3 py-1 text-xs text-white/40 transition-colors hover:border-violet-500/20 hover:text-white/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

