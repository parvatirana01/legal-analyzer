import { type ClauseRecord } from "./shared";
import { ClauseAccordion } from "./clause-accordion";

interface ClausesSectionProps {
  clauses: ClauseRecord[];
}

export function ClausesSection({ clauses }: ClausesSectionProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
      <h2 className="mb-4 text-base font-semibold text-white">
        Clause Breakdown
        <span className="ml-2 text-sm font-normal text-white/40">
          ({clauses.length} clause{clauses.length !== 1 ? "s" : ""})
        </span>
      </h2>
      {clauses.length === 0 ? (
        <p className="text-sm text-white/40">No clauses were identified.</p>
      ) : (
        <div className="space-y-2">
          {clauses.map((clause) => (
            <ClauseAccordion key={clause.id} clause={clause} />
          ))}
        </div>
      )}
    </div>
  );
}

