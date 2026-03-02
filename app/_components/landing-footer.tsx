import Link from "next/link";

export function LandingFooter() {
  return (
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
  );
}

