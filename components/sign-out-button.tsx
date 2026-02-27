"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}

