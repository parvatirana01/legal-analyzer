import { ShieldCheck, Shield, ShieldAlert } from "lucide-react";
import { type RiskLevel, RISK_STYLES } from "./shared";

const ICONS: Record<RiskLevel, React.ComponentType<{ className?: string }>> = {
  LOW: ShieldCheck,
  MEDIUM: Shield,
  HIGH: ShieldAlert,
};

interface RiskScoreBadgeProps {
  score: number;
  level: RiskLevel;
}

export function RiskScoreBadge({ score, level }: RiskScoreBadgeProps) {
  const styles = RISK_STYLES[level];
  const Icon = ICONS[level];
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className={`rounded-2xl border p-6 ${styles.border} ${styles.bg} flex flex-col items-center`}>
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
          <span className={`text-3xl font-bold ${styles.color}`}>{score}</span>
          <span className="text-xs text-white/40">/ 100</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${styles.color}`}>
        <Icon className="h-4 w-4" />
        {styles.label}
      </div>
      <p className="mt-1 text-xs text-white/40">Smart Risk Score</p>
    </div>
  );
}

