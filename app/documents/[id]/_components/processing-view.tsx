import { FileText } from "lucide-react";

export function ProcessingView() {
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

