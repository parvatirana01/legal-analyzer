import { AlertCircle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";
import { type Pro, type Con, RISK_STYLES } from "./shared";

interface ProsConsSectionProps {
  pros: Pro[];
  cons: Con[];
}

export function ProsConsSection({ pros, cons }: ProsConsSectionProps) {
  return (
    <div className="mb-6 grid gap-6 md:grid-cols-2">
      {/* Pros */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400/70">
            Favourable Terms
          </h2>
        </div>
        {pros.length === 0 ? (
          <p className="text-sm text-white/40">No notable pros identified.</p>
        ) : (
          <ul className="space-y-3">
            {pros.map((pro, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">{pro.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{pro.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cons */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400/70">
            Risks &amp; Concerns
          </h2>
        </div>
        {cons.length === 0 ? (
          <p className="text-sm text-white/40">No notable concerns identified.</p>
        ) : (
          <ul className="space-y-3">
            {cons.map((con, i) => {
              const c = RISK_STYLES[con.riskLevel];
              return (
                <li key={i} className="flex gap-3">
                  <AlertCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${c.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{con.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.color}`}
                      >
                        {con.riskLevel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/50">{con.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

