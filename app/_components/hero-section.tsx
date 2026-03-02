import Link from "next/link";
import { Sparkles, Shield, Zap } from "lucide-react";
import { SignInButton } from "@/components/sign-in-button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-24 pb-20">
      {/* ── Background atmosphere ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/[0.18] blur-[160px]" />
        <div className="absolute right-1/4 top-1/4 h-[350px] w-[350px] rounded-full bg-indigo-700/[0.12] blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-6">

        {/* ── LEFT: Text ── */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
            <Sparkles className="h-3 w-3" />
            AI-Powered Legal Analysis
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-[4rem]">
            Understand Your
            <br />
            Contract{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              in 2 Minutes
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/55">
            AI-powered legal risk analysis for freelancers, startups, and
            businesses. Know what you&apos;re signing before you sign it.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-violet-800/50 active:scale-95"
            >
              Analyze Free
            </Link>
            <SignInButton />
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-white/35">
              <Shield className="h-4 w-4 text-violet-400/70" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-sm text-white/35">
              <Zap className="h-4 w-4 text-violet-400/70" />
              Results in under 2 minutes
            </div>
          </div>
        </div>

        {/* ── RIGHT: 3D Document Stack ── */}
        <div className="hidden lg:flex items-center justify-center">
          <DocumentStackVisual />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="relative mt-20 hidden flex-col items-center gap-1 text-white/20 text-xs lg:flex">
        <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/20" />
        scroll to explore
      </div>
    </section>
  );
}

// ── 3D document stack visual ──────────────────────────────────────────────────

function DocumentStackVisual() {
  return (
    <div className="relative h-[520px] w-[480px]">

      {/* Ambient violet glow behind the stack */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-3xl bg-violet-600/25 blur-[70px]"
        style={{ inset: "40px 80px 60px 80px" }}
      />

      {/* ── Layer: back document ── */}
      <div
        className="absolute rounded-2xl border border-white/[0.07] bg-gradient-to-b from-slate-800/40 to-slate-900/50"
        style={{
          inset: "0 70px 40px 70px",
          transform: "rotate(6deg) translateY(30px) translateX(18px)",
        }}
      />

      {/* ── Layer: middle document ── */}
      <div
        className="absolute rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/65 to-slate-900/70"
        style={{
          inset: "0 70px 40px 70px",
          transform: "rotate(3deg) translateY(15px) translateX(9px)",
        }}
      />

      {/* ── Layer: front document (active — being scanned by AI) ── */}
      <div
        className="animate-float absolute overflow-hidden rounded-2xl border border-violet-500/35 bg-gradient-to-b from-[#12111a] to-[#0d0c14] shadow-2xl shadow-violet-900/50"
        style={{ inset: "0 70px 40px 70px" }}
      >
        {/* Window title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/55" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/55" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/55" />
          <span className="ml-3 text-[11px] font-medium text-white/30">
            Standard Contract.pdf
          </span>
          <span className="ml-auto rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-400">
            ● ANALYZING
          </span>
        </div>

        {/* Document body */}
        <div className="relative px-5 py-4">
          <p className="mb-3.5 text-[9px] font-bold uppercase tracking-[0.2em] text-violet-400/75">
            Standard Contract
          </p>

          <div className="space-y-2">
            <div className="h-1.5 w-full rounded-full bg-white/[0.09]" />
            <div className="h-1.5 w-5/6 rounded-full bg-white/[0.09]" />
            <div className="h-1.5 w-4/6 rounded-full bg-white/[0.09]" />

            {/* Clause 4 — Medium risk */}
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400">
                  Clause 4 · Medium Risk
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-amber-500/[0.18]" />
                <div className="h-1.5 w-4/5 rounded-full bg-amber-500/[0.18]" />
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-white/[0.09]" />
            <div className="h-1.5 w-3/4 rounded-full bg-white/[0.09]" />

            {/* Clause 7 — High risk */}
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-red-400">
                  Clause 7 · High Risk
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-red-500/[0.18]" />
                <div className="h-1.5 w-5/6 rounded-full bg-red-500/[0.18]" />
                <div className="h-1.5 w-3/5 rounded-full bg-red-500/[0.18]" />
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-white/[0.09]" />

            {/* Clause 12 — Low risk */}
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                  Clause 12 · Low Risk
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-emerald-500/[0.15]" />
                <div className="h-1.5 w-2/3 rounded-full bg-emerald-500/[0.15]" />
              </div>
            </div>
          </div>

          {/* ── AI scan beam (glow area) ── */}
          <div
            className="animate-scan-beam pointer-events-none absolute inset-x-0 h-10"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.08) 30%, rgba(139,92,246,0.18) 50%, rgba(139,92,246,0.08) 70%, transparent 100%)",
            }}
          />
          {/* ── AI scan beam (sharp line) ── */}
          <div
            className="animate-scan-beam pointer-events-none absolute inset-x-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 5%, rgba(139,92,246,0.9) 30%, rgba(167,139,250,1) 50%, rgba(139,92,246,0.9) 70%, transparent 95%)",
              boxShadow: "0 0 8px 2px rgba(139,92,246,0.6)",
            }}
          />
        </div>

        {/* Bottom risk summary bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/[0.07] bg-slate-900/70 px-4 py-2.5">
          <span className="text-[10px] text-white/30">14 clauses</span>
          <div className="flex gap-1.5">
            <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
              2 HIGH
            </span>
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
              5 MED
            </span>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              7 LOW
            </span>
          </div>
        </div>
      </div>

      {/* ── Floating card: Risk Score ── */}
      <div className="absolute right-0 top-[55px] rounded-2xl border border-white/10 bg-[#0d0c14]/90 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-md">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/30">
          Risk Score
        </p>
        <p className="mt-0.5 text-3xl font-bold text-red-400">72</p>
        <p className="text-[9px] font-medium text-red-400/55">HIGH RISK</p>
      </div>

      {/* ── Floating card: Clauses Analyzed ── */}
      <div className="absolute left-0 bottom-[90px] rounded-2xl border border-white/10 bg-[#0d0c14]/90 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-md">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/30">
          Analyzed
        </p>
        <p className="mt-0.5 text-3xl font-bold text-white">14</p>
        <p className="text-[9px] text-white/30">clauses</p>
      </div>

      {/* ── Floating card: Processing time ── */}
      <div className="absolute right-[4px] bottom-[120px] rounded-xl border border-violet-500/20 bg-violet-950/60 px-3 py-2 shadow-lg backdrop-blur-md">
        <p className="text-[9px] text-violet-300/50">Completed in</p>
        <p className="text-sm font-bold text-violet-300">1m 43s</p>
      </div>
    </div>
  );
}
