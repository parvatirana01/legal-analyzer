"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/queries";
import { Navbar } from "@/components/navbar";
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { ProcessingView } from "./_components/processing-view";
import { FailedView } from "./_components/failed-view";
import { RiskScoreBadge } from "./_components/risk-score-badge";
import { AnalysisHeader } from "./_components/analysis-header";
import { ProsConsSection } from "./_components/pros-cons-section";
import { ClausesSection } from "./_components/clauses-section";
import {
  type RiskLevel,
  type DocumentData,
  type Pro,
  type Con,
} from "./_components/shared";

// ── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;
/** Stop polling after 4 minutes and show a timeout/retry state */
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const documentId = params?.id;

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [elMode, setElMode] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // ── Delete handler ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!documentId) return;
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setActionError(data.error ?? "Delete failed.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Re-analyze handler ─────────────────────────────────────────────────────

  const handleReanalyze = async () => {
    if (!documentId) return;
    if (!confirm("Re-analyze this document? This will deduct 1 token.")) return;
    setIsReanalyzing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/reanalyze`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Re-analysis failed.");
        return;
      }
      setDoc((prev) => (prev ? { ...prev, status: "PROCESSING" } : prev));
      setPollTimedOut(false);
      // Invalidate the user cache so the Navbar refetches and shows the
      // updated token count (one token was deducted server-side).
      void qc.invalidateQueries({ queryKey: queryKeys.user.me() });
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setIsReanalyzing(false);
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
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 transition-all hover:border-violet-500/30 hover:text-violet-300 disabled:opacity-50"
          >
            {isReanalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Re-analyze (new token)
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 transition-all hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
        </div>
        {actionError && (
          <p className="mt-3 text-center text-xs text-red-400">{actionError}</p>
        )}
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
      <AnalysisHeader
        fileName={doc.fileName}
        fileSize={doc.fileSize}
        documentType={documentType}
        keyParties={keyParties}
        actionError={actionError}
        elMode={elMode}
        onToggleElMode={() => setElMode((v) => !v)}
        documentId={documentId!}
        isReanalyzing={isReanalyzing}
        onReanalyze={handleReanalyze}
        isDeleting={isDeleting}
        onDelete={handleDelete}
      />

      {/* ── Top grid: score + summary ── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <RiskScoreBadge score={riskScore} level={riskLevel as RiskLevel} />

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
      <ProsConsSection pros={pros} cons={cons} />

      {/* ── Clause Breakdown ── */}
      <ClausesSection clauses={doc.clauses} />
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
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    ...(fileName ? [{ label: fileName }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar breadcrumbs={breadcrumbs} />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}

// ── ELI15 helper ──────────────────────────────────────────────────────────────

function simplifyText(text: string): string {
  if (!text) return "";
  return `🧒 In simple terms: ${text}`;
}

