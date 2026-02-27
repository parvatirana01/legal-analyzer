import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { ShieldCheck, Coins } from "lucide-react";
import Image from "next/image";
import { UploadDocument } from "@/components/upload-document";

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400 border-red-500/20",
  SUBSCRIBER: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  USER: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  GUEST: "bg-white/10 text-white/50 border-white/10",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { user } = session;
  const roleBadgeStyle =
    ROLE_STYLES[user.role ?? "USER"] ?? ROLE_STYLES["USER"];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── TOPBAR ── */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            Contract<span className="text-violet-400">IQ</span>
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome card */}
        <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/8 bg-white/3 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "Avatar"}
                width={56}
                height={56}
                className="rounded-full ring-2 ring-violet-500/30"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 text-xl font-bold text-violet-400">
                {user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p className="text-xs text-white/40">Welcome back</p>
              <h1 className="text-2xl font-bold">{user.name ?? user.email}</h1>
              <p className="mt-0.5 text-sm text-white/50">{user.email}</p>
            </div>
          </div>

          <span
            className={`self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider sm:self-auto ${roleBadgeStyle}`}
          >
            {user.role ?? "USER"}
          </span>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-6">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600/20">
              <Coins className="h-5 w-5 text-violet-400" />
            </span>
            <div>
              <p className="text-xs text-white/40">Tokens Remaining</p>
              <p className="text-3xl font-bold">{user.tokensRemaining ?? 0}</p>
              <p className="text-xs text-white/30">resets every 30 days</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-6">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-600/20">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </span>
            <div>
              <p className="text-xs text-white/40">Plan</p>
              <p className="text-xl font-bold capitalize">
                {user.role === "SUBSCRIBER" ? "Pro" : "Free"}
              </p>
              <p className="text-xs text-white/30">
                {user.role === "SUBSCRIBER"
                  ? "Unlimited analyses"
                  : "3 analyses / month"}
              </p>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="mb-1 text-lg font-semibold">Upload a Contract</h2>
          <p className="mb-6 text-sm text-white/50">
            PDF or Word document · Get an AI risk analysis, pros &amp; cons breakdown, and chat access.
          </p>
          <UploadDocument role={user.role} />
        </div>
      </main>
    </div>
  );
}

