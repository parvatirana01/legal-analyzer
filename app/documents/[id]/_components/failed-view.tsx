"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface FailedViewProps {
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export function FailedView({ error, onRetry, isRetrying }: FailedViewProps) {
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

