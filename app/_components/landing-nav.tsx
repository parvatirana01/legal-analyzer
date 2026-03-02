import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";

export function LandingNav() {
  return (
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
  );
}

