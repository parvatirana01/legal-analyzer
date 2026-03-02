import { Upload, Sparkles, BarChart2, ArrowRight, Cpu, FileSearch } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: Upload,
    secondaryIcon: Cpu,
    label: "Upload & Process",
    title: "Upload Document",
    description:
      "Drop your PDF or Word contract. We securely store it and kick off the AI processing pipeline immediately.",
    accentColor: "from-violet-500 to-indigo-500",
    glowColor: "rgba(139,92,246,0.4)",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/10",
    iconColor: "text-violet-400",
    ringColor: "ring-violet-500/20",
  },
  {
    step: "02",
    icon: FileSearch,
    secondaryIcon: Sparkles,
    label: "AI Analysis",
    title: "AI Analysis",
    description:
      "Our model reads every clause, scores risk, and extracts pros and cons — grounded entirely in your document.",
    accentColor: "from-fuchsia-500 to-violet-500",
    glowColor: "rgba(217,70,239,0.4)",
    borderColor: "border-fuchsia-500/30",
    bgColor: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-400",
    ringColor: "ring-fuchsia-500/20",
  },
  {
    step: "03",
    icon: BarChart2,
    secondaryIcon: Sparkles,
    label: "Insights & Review",
    title: "Ask Questions",
    description:
      "Chat with your document. Get a full risk dashboard, clause breakdown, and ask anything about your contract.",
    accentColor: "from-indigo-500 to-sky-500",
    glowColor: "rgba(99,102,241,0.4)",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    ringColor: "ring-indigo-500/20",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-white/[0.02] px-6 py-28">

      {/* ── Circuit / data-line background ── */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Horizontal traces */}
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="white" strokeWidth="1" strokeDasharray="6 12" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="6 12" />
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="white" strokeWidth="1" strokeDasharray="6 12" />
        {/* Vertical traces */}
        <line x1="20%" y1="0" x2="20%" y2="100%" stroke="white" strokeWidth="1" strokeDasharray="6 14" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="1" strokeDasharray="6 14" />
        <line x1="80%" y1="0" x2="80%" y2="100%" stroke="white" strokeWidth="1" strokeDasharray="6 14" />
        {/* Junction nodes */}
        <circle cx="20%" cy="25%" r="3" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="50%" cy="25%" r="4" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="80%" cy="25%" r="3" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="20%" cy="50%" r="3" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="50%" cy="50%" r="5" fill="white" fillOpacity="0.3" />
        <circle cx="80%" cy="50%" r="3" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="20%" cy="75%" r="3" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="50%" cy="75%" r="4" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="80%" cy="75%" r="3" fill="none" stroke="white" strokeWidth="1.5" />
      </svg>

      <div className="relative mx-auto max-w-6xl">

        {/* ── Heading ── */}
        <div className="mb-20 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-1 text-xs font-medium text-violet-400">
            <Sparkles className="h-3 w-3" />
            Simple three-step workflow
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-white/45">Three steps to full clarity.</p>
        </div>

        {/* ── Steps with connectors ── */}
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-start sm:gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex flex-1 flex-col items-stretch sm:flex-row sm:items-start">

                {/* Step card */}
                <div className="group flex-1 rounded-2xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-white/15 hover:bg-white/[0.04]">

                  {/* Step number + icon row */}
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white/20">
                      {s.step}
                    </span>
                    {/* Large icon with glow ring */}
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute inset-0 rounded-2xl blur-md"
                        style={{ background: `radial-gradient(circle, ${s.glowColor} 0%, transparent 70%)` }}
                      />
                      <div
                        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border ${s.borderColor} ${s.bgColor} ring-2 ${s.ringColor} transition-transform group-hover:scale-105`}
                      >
                        <Icon className={`h-7 w-7 ${s.iconColor}`} />
                      </div>
                    </div>
                  </div>

                  {/* Label pill */}
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${s.borderColor} ${s.bgColor} ${s.iconColor}`}
                  >
                    {s.label}
                  </span>

                  {/* Title */}
                  <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    {s.description}
                  </p>

                  {/* Gradient accent line */}
                  <div
                    className={`mt-6 h-px w-full rounded-full bg-gradient-to-r ${s.accentColor} opacity-30`}
                  />
                </div>

                {/* ── Connector arrow (between steps) ── */}
                {i < STEPS.length - 1 && (
                  <div className="flex items-center justify-center sm:mx-0 sm:w-14 sm:flex-col">
                    {/* Vertical connector on mobile */}
                    <div className="flex h-10 flex-col items-center sm:hidden">
                      <div className="flex-1 w-px bg-gradient-to-b from-white/20 to-transparent" />
                      <ArrowRight className="h-3.5 w-3.5 rotate-90 text-white/20" />
                    </div>
                    {/* Horizontal connector on desktop */}
                    <div className="hidden sm:flex items-center gap-0.5 w-full justify-center">
                      <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-white/30" />
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/30" />
                      <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-white/15" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Bottom animated data-flow line ── */}
        <div className="mt-14 flex items-center justify-center gap-3 text-xs text-white/20">
          <svg width="280" height="2" className="overflow-visible">
            <line
              x1="0" y1="1" x2="280" y2="1"
              stroke="url(#flowGrad)"
              strokeWidth="2"
              strokeDasharray="8 6"
              className="animate-flow-line"
            />
            <defs>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(139,92,246,0)" />
                <stop offset="40%" stopColor="rgba(139,92,246,0.7)" />
                <stop offset="60%" stopColor="rgba(167,139,250,0.9)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </linearGradient>
            </defs>
          </svg>
          <span>powered by Gemini</span>
          <svg width="280" height="2" className="overflow-visible">
            <line
              x1="0" y1="1" x2="280" y2="1"
              stroke="url(#flowGrad2)"
              strokeWidth="2"
              strokeDasharray="8 6"
              className="animate-flow-line"
              style={{ animationDelay: "0.9s" }}
            />
            <defs>
              <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(139,92,246,0)" />
                <stop offset="40%" stopColor="rgba(139,92,246,0.7)" />
                <stop offset="60%" stopColor="rgba(167,139,250,0.9)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

      </div>
    </section>
  );
}
