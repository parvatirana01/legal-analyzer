"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileType,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Trash2,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  Cpu,
} from "lucide-react";
import { formatFileSize } from "@/lib/file-validation";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocumentStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface DocumentCardData {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: DocumentStatus;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  processingTimeMs: number | null;
  aiModelUsed: string | null;
  createdAt: string | Date;
}

interface DocumentCardProps {
  document: DocumentCardData;
  onDeleted?: (id: string) => void;
}

// ── Config maps ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  UPLOADED: {
    label: "Uploaded",
    color: "text-sky-400",
    bg: "bg-sky-500/15",
    icon: Upload,
  },
  PROCESSING: {
    label: "Processing",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    icon: Cpu,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-500/15",
    icon: AlertCircle,
  },
};

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  LOW: {
    label: "Low Risk",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    icon: ShieldCheck,
  },
  MEDIUM: {
    label: "Medium Risk",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    icon: Shield,
  },
  HIGH: {
    label: "High Risk",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    icon: ShieldAlert,
  },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentCard({ document: doc, onDeleted }: DocumentCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[doc.status];
  const StatusIcon = statusCfg.icon;
  const riskCfg = doc.riskLevel ? RISK_CONFIG[doc.riskLevel] : null;
  const RiskIcon = riskCfg?.icon;

  const fileExt = doc.fileName.split(".").pop()?.toLowerCase();
  const isPdf = fileExt === "pdf";

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/documents/${doc.id}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setDeleteError(data.error ?? "Delete failed.");
        return;
      }

      onDeleted?.(doc.id);
      router.refresh();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/3 p-5 transition-all hover:border-white/12 hover:bg-white/4 sm:flex-row sm:items-center">
      {/* ── File icon ── */}
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
          isPdf ? "bg-red-500/10" : "bg-blue-500/10"
        }`}
      >
        {isPdf ? (
          <FileText className="h-5 w-5 text-red-400" />
        ) : (
          <FileType className="h-5 w-5 text-blue-400" />
        )}
      </div>

      {/* ── File info ── */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white" title={doc.fileName}>
          {doc.fileName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
          {doc.fileSize !== null && (
            <span>{formatFileSize(doc.fileSize)}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(doc.createdAt)}
          </span>
          {doc.processingTimeMs !== null && (
            <span>{(doc.processingTimeMs / 1000).toFixed(1)}s analysis</span>
          )}
        </div>
      </div>

      {/* ── Status badge ── */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}
        >
          {doc.status === "PROCESSING" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <StatusIcon className="h-3 w-3" />
          )}
          {statusCfg.label}
        </span>

        {riskCfg && RiskIcon && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${riskCfg.bg} ${riskCfg.color} ${riskCfg.border}`}
          >
            <RiskIcon className="h-3 w-3" />
            {doc.riskScore !== null ? `${doc.riskScore} · ` : ""}
            {riskCfg.label}
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          onClick={() => router.push(`/documents/${doc.id}`)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-all hover:bg-violet-600/30"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/40 transition-all hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
          title="Delete document"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ── Delete error ── */}
      {deleteError && (
        <div className="absolute bottom-2 left-4 right-4 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-400">
          {deleteError}
        </div>
      )}
    </div>
  );
}

