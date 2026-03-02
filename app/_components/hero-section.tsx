import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SignInButton } from "@/components/sign-in-button";

export function HeroSection() {
  return (
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
  );
}

