import type { ClauseAnalysis, RiskLevelValue } from "@/lib/gemini";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Points deducted per clause risk level */
const CLAUSE_RISK_POINTS: Record<RiskLevelValue, number> = {
  HIGH: 20,
  MEDIUM: 10,
  LOW: 5,
};

/** Minimum possible score */
const MIN_SCORE = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RiskScoreResult {
  /** 10–100 numeric score (higher = safer) */
  score: number;
  /** Derived risk level based on score thresholds */
  level: RiskLevelValue;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreToLevel(score: number): RiskLevelValue {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  return "HIGH";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Calculate a smart risk score from the clause breakdown returned by Gemini.
 *
 * Scoring:
 *   HIGH clause   → deduct 20 pts
 *   MEDIUM clause → deduct 10 pts
 *   LOW clause    → deduct  5 pts
 *
 * Final score = max(100 − totalDeduction, MIN_SCORE)
 *
 * Thresholds:
 *   80–100 → LOW risk
 *   60–79  → MEDIUM risk
 *   <60    → HIGH risk
 */
export function calculateRiskScore(clauses: ClauseAnalysis[]): RiskScoreResult {
  const totalDeduction = clauses.reduce(
    (sum, clause) => sum + (CLAUSE_RISK_POINTS[clause.riskLevel] ?? 0),
    0
  );

  const score = Math.max(100 - totalDeduction, MIN_SCORE);
  const level = scoreToLevel(score);

  return { score, level };
}

