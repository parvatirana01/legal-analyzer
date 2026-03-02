"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ShieldCheck, Shield, ShieldAlert } from "lucide-react";
import { type RiskLevel, type ClauseRecord, RISK_STYLES } from "./shared";

const ICONS: Record<RiskLevel, React.ComponentType<{ className?: string }>> = {
  LOW: ShieldCheck,
  MEDIUM: Shield,
  HIGH: ShieldAlert,
};

interface ClauseAccordionProps {
  clause: ClauseRecord;
}

export function ClauseAccordion({ clause }: ClauseAccordionProps) {
  const [open, setOpen] = useState(false);
  const level = clause.riskLevel ?? "LOW";
  const styles = RISK_STYLES[level];
  const Icon = ICONS[level];

  return (
    <div className={`rounded-xl border ${styles.border} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${styles.bg}`}
          >
            <Icon className={`h-3.5 w-3.5 ${styles.color}`} />
          </span>
          <span className="font-medium text-white truncate">
            {clause.title ?? "Unnamed Clause"}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.bg} ${styles.color}`}
          >
            {styles.label}
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

