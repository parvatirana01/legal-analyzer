"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type DocumentStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface ClauseRecord {
  id: string;
  title: string | null;
  content: string;
  riskLevel: RiskLevel | null;
  explanation: string | null;
  suggestion: string | null;
}

interface Pro {
  title: string;
  description: string;
}

interface Con {
  title: string;
  description: string;
  riskLevel: RiskLevel;
}

interface DocumentData {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: DocumentStatus;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  summary: string | null;
  pros: Pro[] | null;
  cons: Con[] | null;
  overallAnalysis: {
    documentType?: string;
    keyParties?: string[];
    error?: string;
  } | null;
  clauses: ClauseRecord[];
  updatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;
/** Stop polling after 4 minutes and show a timeout/retry state */
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  LOW: {
    label: "Low Risk",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: ShieldCheck,
  },
  MEDIUM: {
    label: "Medium Risk",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Shield,
  },
  HIGH: {
    label: "High Risk",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: ShieldAlert,
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProcessingView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Animated ring */}
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full border-4 border-violet-500/20" />
        <div className="absolute inset-0 h-24 w-24 animate-spin rounded-full border-4 border-transparent border-t-violet-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="h-8 w-8 text-violet-400" />
        </div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Analyzing Document…</h2>
      <p className="max-w-sm text-sm text-white/50">
        Our AI is reviewing your contract for risks, key clauses, and important terms.
        This usually takes 30–60 seconds.
      </p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-6 rounded-full bg-violet-500/40 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function FailedView({
  error,
  onRetry,
  isRetrying,
}: {
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
        <AlertCircle className="h-10 w-10 text-red-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Analysis Failed</h2>
      <p className="mb-8 max-w-sm text-sm text-white/50">{error}</p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
      >
        <RotateCcw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
        {isRetrying ? "Retrying…" : "Retry Analysis"}
      </button>
    </div>
  );
}

function RiskScoreBadge({ score, level }: { score: number; level: RiskLevel }) {
  const config = RISK_CONFIG[level];
  const Icon = config.icon;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className={`rounded-2xl border p-6 ${config.border} ${config.bg} flex flex-col items-center`}>
      <div className="relative mb-4">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            strokeWidth="8"
            className="stroke-white/10"
          />
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              level === "LOW"
                ? "stroke-emerald-400"
                : level === "MEDIUM"
                ? "stroke-amber-400"
                : "stroke-red-400"
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${config.color}`}>{score}</span>
          <span className="text-xs text-white/40">/ 100</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </div>
      <p className="mt-1 text-xs text-white/40">Smart Risk Score</p>
    </div>
  );
}

function ClauseAccordion({ clause }: { clause: ClauseRecord }) {
  const [open, setOpen] = useState(false);
  const level = clause.riskLevel ?? "LOW";
  const config = RISK_CONFIG[level];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${config.bg}`}
          >
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          </span>
          <span className="font-medium text-white truncate">
            {clause.title ?? "Unnamed Clause"}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.color}`}
          >
            {config.label}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white/40" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">
              Summary
            </p>
            <p className="text-sm text-white/70">{clause.content}</p>
          </div>
          {clause.explanation && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">
                Why it matters
              </p>
              <p className="text-sm text-white/70">{clause.explanation}</p>
            </div>
          )}
          {clause.suggestion && (
            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/70 mb-1">
                💡 Suggestion
              </p>
              <p className="text-sm text-violet-300/80">{clause.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const documentId = params?.id;

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [elMode, setElMode] = useState(false); // "Explain Like I'm 15"
  const [pollTimedOut, setPollTimedOut] = useState(false);

  // ── Polling ────────────────────────────────────────────────────────────────

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to load document.");
        return null;
      }
      const data = (await res.json()) as { document: DocumentData };
      setDoc(data.document);
      return data.document.status;
    } catch {
      setError("Network error. Please refresh.");
      return null;
    }
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    let timer: ReturnType<typeof setTimeout>;
    const pollStarted = Date.now();
    let processingTriggered = false;

    const triggerProcessing = async () => {
      try {
        await fetch(`/api/process/${documentId}`, { method: "POST" });
      } catch {
        // ignore — pipeline will mark as FAILED on its own
      }
    };

    const poll = async () => {
      const status = await fetchDoc();

      // If document is UPLOADED (not yet picked up), kick off processing
      if (status === "UPLOADED" && !processingTriggered) {
        processingTriggered = true;
        void triggerProcessing();
      }

      if (status === "PROCESSING" || status === "UPLOADED") {
        if (Date.now() - pollStarted >= POLL_TIMEOUT_MS) {
          // Stuck — stop polling and show the timeout/retry UI
          setPollTimedOut(true);
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();
    return () => clearTimeout(timer);
  }, [documentId, fetchDoc]);

  // ── Retry handler ──────────────────────────────────────────────────────────

  const handleRetry = async () => {
    if (!documentId) return;
    setIsRetrying(true);
    setPollTimedOut(false);
    try {
      const res = await fetch(`/api/process/${documentId}`, { method: "POST" });
      if (!res.ok && res.status !== 202) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to start retry.");
        return;
      }
      setDoc((prev) => prev ? { ...prev, status: "PROCESSING" } : prev);
      // Resume polling with a fresh timeout window
      const retryStart = Date.now();
      const poll = async () => {
        const status = await fetchDoc();
        if (status === "PROCESSING" || status === "UPLOADED") {
          if (Date.now() - retryStart >= POLL_TIMEOUT_MS) {
            setPollTimedOut(true);
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };
      setTimeout(poll, POLL_INTERVAL_MS);
    } catch {
      setError("Failed to retry. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-white">Something went wrong</h2>
          <p className="mb-6 text-sm text-white/50">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
          >
            Back to Dashboard
          </button>
        </div>
      </PageShell>
    );
  }

  if (!doc) {
    return (
      <PageShell>
        <ProcessingView />
      </PageShell>
    );
  }

  if (doc.status === "UPLOADED" || doc.status === "PROCESSING") {
    if (pollTimedOut) {
      return (
        <PageShell fileName={doc.fileName}>
          <FailedView
            error="Analysis is taking longer than expected. This can happen after a server restart. Click Retry to re-run the analysis."
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        </PageShell>
      );
    }
    return (
      <PageShell fileName={doc.fileName}>
        <ProcessingView />
      </PageShell>
    );
  }

  if (doc.status === "FAILED") {
    const errMsg =
      (doc.overallAnalysis?.error as string | undefined) ??
      "Analysis could not be completed. Please try again.";
    return (
      <PageShell fileName={doc.fileName}>
        <FailedView error={errMsg} onRetry={handleRetry} isRetrying={isRetrying} />
      </PageShell>
    );
  }

  // ── COMPLETED ──────────────────────────────────────────────────────────────

  const pros = (doc.pros as Pro[] | null) ?? [];
  const cons = (doc.cons as Con[] | null) ?? [];
  const riskLevel = doc.riskLevel ?? "HIGH";
  const riskScore = doc.riskScore ?? 0;
  const documentType = doc.overallAnalysis?.documentType;
  const keyParties = doc.overallAnalysis?.keyParties ?? [];
  const highClauses = doc.clauses.filter((c) => c.riskLevel === "HIGH").length;
  const mediumClauses = doc.clauses.filter((c) => c.riskLevel === "MEDIUM").length;

  return (
    <PageShell fileName={doc.fileName}>
      {/* ── Header row ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-white/40 mb-1">
            <FileText className="h-4 w-4" />
            <span>{doc.fileName}</span>
            {doc.fileSize && (
              <span className="text-white/25">· {formatFileSize(doc.fileSize)}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {documentType ?? "Legal Document"} Analysis
          </h1>
          {keyParties.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
              <Users className="h-4 w-4" />
              <span>{keyParties.join(" · ")}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setElMode((v) => !v)}
            className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
              elMode
                ? "border-violet-500/60 bg-violet-500/20 text-violet-300"
                : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
            }`}
            title="Toggle plain-English explanations"
          >
            🧒 ELI15
          </button>
          <button
            onClick={() => router.push(`/documents/${documentId}/chat`)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            Chat With Document
          </button>
        </div>
      </div>

      {/* ── Top grid: score + summary ── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <RiskScoreBadge score={riskScore} level={riskLevel} />

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Document Summary
            </h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            {elMode
              ? simplifyText(doc.summary ?? "")
              : (doc.summary ?? "No summary available.")}
          </p>

          {/* Clause stats */}
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-white/50">{highClauses} High risk</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-white/50">{mediumClauses} Medium risk</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-white/50">
                {doc.clauses.length - highClauses - mediumClauses} Low risk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pros & Cons ── */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* Pros */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400/70">
              Favourable Terms
            </h2>
          </div>
          {pros.length === 0 ? (
            <p className="text-sm text-white/40">No notable pros identified.</p>
          ) : (
            <ul className="space-y-3">
              {pros.map((pro, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{pro.title}</p>
                    <p className="mt-0.5 text-xs text-white/50">{pro.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cons */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400/70">
              Risks & Concerns
            </h2>
          </div>
          {cons.length === 0 ? (
            <p className="text-sm text-white/40">No notable concerns identified.</p>
          ) : (
            <ul className="space-y-3">
              {cons.map((con, i) => {
                const c = RISK_CONFIG[con.riskLevel];
                return (
                  <li key={i} className="flex gap-3">
                    <AlertCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${c.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{con.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.color}`}
                        >
                          {con.riskLevel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">{con.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Clause Breakdown ── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">
          Clause Breakdown
          <span className="ml-2 text-sm font-normal text-white/40">
            ({doc.clauses.length} clause{doc.clauses.length !== 1 ? "s" : ""})
          </span>
        </h2>
        {doc.clauses.length === 0 ? (
          <p className="text-sm text-white/40">No clauses were identified.</p>
        ) : (
          <div className="space-y-2">
            {doc.clauses.map((clause) => (
              <ClauseAccordion key={clause.id} clause={clause} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Shell wrapper ─────────────────────────────────────────────────────────────

function PageShell({
  children,
  fileName,
}: {
  children: React.ReactNode;
  fileName?: string;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Contract<span className="text-violet-400">IQ</span>
          </button>
          {fileName && (
            <p className="hidden text-sm text-white/40 sm:block truncate max-w-sm">
              {fileName}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

// ── ELI15 helper ──────────────────────────────────────────────────────────────

/**
 * Very lightweight "simplify" pass — wraps the summary in a framing sentence.
 * A real implementation would call a second Gemini prompt stored in the DB.
 */
function simplifyText(text: string): string {
  if (!text) return "";
  return `🧒 In simple terms: ${text}`;
}

