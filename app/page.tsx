import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";
import {
  ShieldCheck,
  ListChecks,
  MessageSquareText,
  Upload,
  Sparkles,
  HelpCircle,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────
// Landing Page (Server Component)
// ─────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── NAV ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            Contract<span className="text-violet-400">IQ</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
            >
              Dashboard
            </Link>
            <SignInButton />
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-violet-700/20 blur-[120px]" />
        </div>

        {/* Badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
          <Sparkles className="h-3 w-3" />
          AI-Powered Legal Analysis
        </span>

        <h1 className="relative max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Understand Your Contract
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            in 2 Minutes
          </span>
        </h1>

        <p className="relative mt-6 max-w-xl text-lg text-white/60 leading-relaxed">
          AI-powered legal risk analysis for freelancers, startups, and
          businesses. Know what you&apos;re signing before you sign it.
        </p>

        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-violet-800/50 active:scale-95"
          >
            Analyze Free
          </Link>
          <SignInButton />
        </div>

        {/* Subtle scroll cue */}
        <div className="relative mt-20 flex flex-col items-center gap-1 text-white/20 text-xs">
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/20" />
          scroll to explore
        </div>
      </section>

      {/* ── FEATURES ── */}
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
          {[
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
              icon: (
                <MessageSquareText className="h-6 w-6 text-sky-400" />
              ),
              title: "Chat With Your Document",
              description:
                "Ask questions directly about your contract. Get precise answers grounded in the actual document text.",
            },
          ].map((f) => (
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

      {/* ── HOW IT WORKS ── */}
      <section className="border-y border-white/5 bg-white/2 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-white/50">Three steps to full clarity.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
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
            ].map((s) => (
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

      {/* ── PRICING ── */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 text-white/50">
            Start for free. Scale as you grow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              plan: "Free",
              price: "$0",
              period: "forever",
              highlight: false,
              features: [
                "3 contract analyses",
                "Risk score",
                "Pros & cons",
                "Chat (10 messages)",
              ],
            },
            {
              plan: "Pro",
              price: "$19",
              period: "/ month",
              highlight: true,
              features: [
                "Unlimited analyses",
                "Priority processing",
                "Full chat history",
                "Export reports",
                "Email support",
              ],
            },
            {
              plan: "Enterprise",
              price: "Custom",
              period: "",
              highlight: false,
              features: [
                "Everything in Pro",
                "Team accounts",
                "API access",
                "Custom integrations",
                "Dedicated support",
              ],
            },
          ].map((p) => (
            <div
              key={p.plan}
              className={`relative rounded-2xl border p-8 ${
                p.highlight
                  ? "border-violet-500/50 bg-gradient-to-b from-violet-950/60 to-violet-900/20 shadow-xl shadow-violet-900/30"
                  : "border-white/8 bg-white/3"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <p className="text-sm font-medium text-white/60">{p.plan}</p>
              <p className="mt-2 text-4xl font-bold">
                {p.price}
                <span className="text-base font-normal text-white/40">
                  {p.period}
                </span>
              </p>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-violet-400" />
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  p.highlight
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                }`}
              >
                {p.plan === "Enterprise" ? "Contact Us" : "Get Started"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="text-sm font-semibold">
            Contract<span className="text-violet-400">IQ</span>
          </span>

          <p className="max-w-sm text-xs text-white/30 leading-relaxed">
            This tool does not provide legal advice. Always consult a qualified
            attorney for matters requiring legal counsel.
          </p>

          <div className="flex gap-5 text-xs text-white/40">
            <Link href="/terms" className="transition-colors hover:text-white/70">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-white/70"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
