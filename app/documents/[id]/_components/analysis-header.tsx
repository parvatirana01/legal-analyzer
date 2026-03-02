"use client";

import Link from "next/link";
import {
  Download,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { formatFileSize } from "./shared";

interface AnalysisHeaderProps {
  fileName: string;
  fileSize: number | null;
  documentType?: string;
  keyParties?: string[];
  actionError: string | null;
  elMode: boolean;
  onToggleElMode: () => void;
  documentId: string;
  isReanalyzing: boolean;
  onReanalyze: () => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export function AnalysisHeader({
  fileName,
  fileSize,
  documentType,
  keyParties = [],
  actionError,
  elMode,
  onToggleElMode,
  documentId,
  isReanalyzing,
  onReanalyze,
  isDeleting,
  onDelete,
}: AnalysisHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      {/* Left: file info + title */}
      <div>
        <div className="flex items-center gap-2 text-sm text-white/40 mb-1">
          <FileText className="h-4 w-4" />
          <span>{fileName}</span>
          {fileSize && (
            <span className="text-white/25">· {formatFileSize(fileSize)}</span>
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

      {/* Right: action buttons */}
      <div className="flex flex-wrap gap-2">
        {actionError && (
          <p className="w-full text-xs text-red-400">{actionError}</p>
        )}

        <button
          onClick={onToggleElMode}
          className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
            elMode
              ? "border-violet-500/60 bg-violet-500/20 text-violet-300"
              : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
          }`}
          title="Toggle plain-English explanations"
        >
          🧒 ELI15
        </button>

        <Link
          href={`/documents/${documentId}/chat`}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 transition-all hover:border-violet-500/50 hover:bg-violet-500/20"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </Link>

        <a
          href={`/api/documents/${documentId}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 transition-all hover:border-white/20 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>

        <button
          onClick={onReanalyze}
          disabled={isReanalyzing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 transition-all hover:border-violet-500/30 hover:text-violet-300 disabled:opacity-50"
        >
          {isReanalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Re-analyze
        </button>

        <button
          onClick={onDelete}
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

        <Link
          href={`/documents/${documentId}/chat`}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </Link>
      </div>
    </div>
  );
}
