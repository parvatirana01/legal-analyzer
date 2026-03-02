// ── Shared types & config for documents/[id]/_components ─────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type DocumentStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ClauseRecord {
  id: string;
  title: string | null;
  content: string;
  riskLevel: RiskLevel | null;
  explanation: string | null;
  suggestion: string | null;
}

export interface Pro {
  title: string;
  description: string;
}

export interface Con {
  title: string;
  description: string;
  riskLevel: RiskLevel;
}

export interface DocumentData {
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

/** Visual styles per risk level (no icon — each component supplies its own). */
export const RISK_STYLES: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  LOW: {
    label: "Low Risk",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  MEDIUM: {
    label: "Medium Risk",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  HIGH: {
    label: "High Risk",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
