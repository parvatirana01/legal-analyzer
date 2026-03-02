import { Upload, Sparkles, HelpCircle } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: <Upload className="h-6 w-6" />,
    title: "Upload Document",
    description:
      "Drop your PDF or Word contract. We support all standard legal document formats.",
  },
  {
    step: "02",
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI Analysis",
    description:
      "Our model reads every clause, scores risk, and extracts pros and cons in under 2 minutes.",
  },
  {
    step: "03",
    icon: <HelpCircle className="h-6 w-6" />,
    title: "Ask Questions",
    description:
      "Chat with your document. Ask anything — our AI answers based solely on your contract.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y border-white/5 bg-white/2 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-white/50">Three steps to full clarity.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="flex gap-5">
              <div className="flex-shrink-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
                  {s.icon}
                </span>
              </div>
              <div>
                <p className="mb-1 text-xs font-mono text-white/30">{s.step}</p>
                <h3 className="mb-1 font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

