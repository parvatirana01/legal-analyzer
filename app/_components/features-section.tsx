import { ShieldCheck, ListChecks, MessageSquareText } from "lucide-react";

const FEATURES = [
  {
    icon: <ShieldCheck className="h-6 w-6 text-violet-400" />,
    title: "Smart Risk Score",
    description:
      "Get an instant risk score (Low / Medium / High) with a breakdown of every risky clause found in your document.",
  },
  {
    icon: <ListChecks className="h-6 w-6 text-indigo-400" />,
    title: "Pros & Cons Breakdown",
    description:
      "Our AI highlights what's in your favour and what clauses could hurt you, in plain English.",
  },
  {
    icon: <MessageSquareText className="h-6 w-6 text-sky-400" />,
    title: "Chat With Your Document",
    description:
      "Ask questions directly about your contract. Get precise answers grounded in the actual document text.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="mb-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to review a contract
        </h2>
        <p className="mt-3 text-white/50">
          In seconds, not hours with a lawyer.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-white/8 bg-white/3 p-7 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:bg-white/5"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/8">
              {f.icon}
            </div>
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

