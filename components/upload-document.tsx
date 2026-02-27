"use client";

import { useCallback, useRef, useState } from "react";
import {
  FileText,
  FileType,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { formatFileSize, MAX_FILE_SIZE_LABEL } from "@/lib/file-validation";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UploadDocumentProps {
  /** The current user's role, used to display the correct size limit. */
  role?: UserRole | "GUEST";
}

type UploadState =
  | { phase: "idle" }
  | { phase: "selected"; file: File }
  | { phase: "uploading"; file: File; progress: number }
  | { phase: "success"; documentId: string; fileName: string; fileSize: number }
  | { phase: "duplicate"; documentId: string; fileName: string }
  | { phase: "error"; message: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx";

// ── Component ─────────────────────────────────────────────────────────────────

export function UploadDocument({ role = "GUEST" }: UploadDocumentProps) {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const roleKey = (role as string) in MAX_FILE_SIZE_LABEL ? (role as string) : "GUEST";
  const maxSizeLabel = MAX_FILE_SIZE_LABEL[roleKey];

  // ── File selection ─────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    setState({ phase: "selected", file });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected after an error
    e.target.value = "";
  };

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Upload via XHR for real progress events ────────────────────────────────

  const handleUpload = () => {
    if (state.phase !== "selected") return;
    const { file } = state;

    setState({ phase: "uploading", file, progress: 0 });

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setState((prev) =>
          prev.phase === "uploading" ? { ...prev, progress } : prev
        );
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          success?: boolean;
          duplicate?: boolean;
          documentId?: string;
          fileName?: string;
          fileSize?: number;
          error?: string;
          message?: string;
        };

        if (xhr.status === 409 && data.duplicate) {
          setState({
            phase: "duplicate",
            documentId: data.documentId ?? "",
            fileName: data.message ?? file.name,
          });
          return;
        }

        if (!data.success || xhr.status >= 400) {
          setState({
            phase: "error",
            message: data.error ?? "Upload failed. Please try again.",
          });
          return;
        }

        setState({
          phase: "success",
          documentId: data.documentId ?? "",
          fileName: data.fileName ?? file.name,
          fileSize: data.fileSize ?? file.size,
        });
      } catch {
        setState({ phase: "error", message: "Unexpected server response." });
      }
    });

    xhr.addEventListener("error", () => {
      setState({ phase: "error", message: "Network error. Please try again." });
    });

    xhr.addEventListener("abort", () => {
      setState({ phase: "idle" });
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  };

  const reset = () => {
    setState({ phase: "idle" });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isUploading = state.phase === "uploading";

  return (
    <div className="w-full">
      {/* ── SUCCESS ── */}
      {state.phase === "success" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-white">
            Upload Successful
          </h3>
          <p className="mb-1 text-sm text-white/60">{state.fileName}</p>
          <p className="mb-6 text-xs text-white/40">
            {formatFileSize(state.fileSize)}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-95"
              onClick={() => {
                // Navigate to analysis page when implemented
                window.location.href = `/dashboard/documents/${state.phase === "success" ? state.documentId : ""}`;
              }}
            >
              Start Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={reset}
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {/* ── DUPLICATE ── */}
      {state.phase === "duplicate" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
            <AlertCircle className="h-7 w-7 text-amber-400" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-white">
            Duplicate File
          </h3>
          <p className="mb-6 text-sm text-white/60">{state.fileName}</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-500"
              onClick={() => {
                window.location.href = `/dashboard/documents/${state.documentId}`;
              }}
            >
              Open Existing
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={reset}
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Upload different file
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {state.phase === "error" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-400">Upload failed</p>
              <p className="mt-0.5 text-sm text-white/60">{state.message}</p>
            </div>
            <button onClick={reset} className="text-white/30 hover:text-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── IDLE / SELECTED / UPLOADING ── */}
      {(state.phase === "idle" ||
        state.phase === "selected" ||
        state.phase === "uploading") && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && inputRef.current?.click()}
            className={`relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all
              ${isUploading ? "cursor-default" : ""}
              ${isDragging
                ? "border-violet-400 bg-violet-500/10"
                : state.phase === "selected"
                ? "border-violet-500/50 bg-violet-500/5"
                : "border-white/10 bg-white/2 hover:border-violet-500/30 hover:bg-violet-500/5"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={`${ACCEPTED_TYPES},${ACCEPTED_EXTENSIONS}`}
              className="hidden"
              onChange={handleInputChange}
              disabled={isUploading}
            />

            {/* Icon */}
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors
                ${state.phase === "selected" || isUploading
                  ? "bg-violet-600/20"
                  : "bg-white/5"
                }`}
            >
              {isUploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
              ) : state.phase === "selected" ? (
                <FileIcon fileName={state.file.name} />
              ) : (
                <Upload className="h-7 w-7 text-white/30" />
              )}
            </div>

            {/* File info / prompt */}
            {state.phase === "selected" || isUploading ? (
              <div>
                <p className="font-medium text-white">
                  {state.file.name}
                </p>
                <p className="mt-0.5 text-sm text-white/50">
                  {formatFileSize(state.file.size)}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-white/80">
                  Drag & drop your contract
                </p>
                <p className="mt-1 text-sm text-white/40">
                  or <span className="text-violet-400">browse files</span>
                </p>
                <p className="mt-2 text-xs text-white/25">
                  PDF, DOC, DOCX · max {maxSizeLabel}
                </p>
              </div>
            )}

            {/* Progress bar */}
            {isUploading && (
              <div className="w-full max-w-xs">
                <div className="mb-1 flex justify-between text-xs text-white/40">
                  <span>Uploading…</span>
                  <span>{state.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-200"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {state.phase === "selected" && (
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-95"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </button>
              <button
                onClick={reset}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/50 transition-all hover:border-white/20 hover:text-white/70"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── File type icon ────────────────────────────────────────────────────────────

function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") {
    return <FileText className="h-7 w-7 text-red-400" />;
  }
  return <FileType className="h-7 w-7 text-blue-400" />;
}

