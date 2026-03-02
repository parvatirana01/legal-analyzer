"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, ChevronRight, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NavbarUser {
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  tokensRemaining: number;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface NavbarProps {
  /**
   * User data pre-fetched by a Server Component.
   * When provided, the navbar skips the /api/user/me fetch on mount.
   */
  initialUser?: NavbarUser | null;
  /**
   * Overrides the token count for real-time updates (e.g. after re-analyze)
   * without triggering a full re-fetch.
   */
  tokensOverride?: number | null;
  breadcrumbs?: Breadcrumb[];
}

// ── Token badge config ────────────────────────────────────────────────────────

function tokenStyle(count: number) {
  if (count === 0)
    return {
      bg: "bg-red-500/15",
      border: "border-red-500/25",
      text: "text-red-400",
      icon: "text-red-400",
    };
  if (count === 1)
    return {
      bg: "bg-amber-500/15",
      border: "border-amber-500/25",
      text: "text-amber-400",
      icon: "text-amber-400",
    };
  return {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
    icon: "text-emerald-400",
  };
}

const ROLE_PILL: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400",
  SUBSCRIBER: "bg-violet-500/15 text-violet-400",
  USER: "bg-sky-500/15 text-sky-400",
  GUEST: "bg-white/10 text-white/40",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Navbar({
  initialUser,
  tokensOverride,
  breadcrumbs = [],
}: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<NavbarUser | null>(initialUser ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Effective token count: override > fetched user > null
  const tokens =
    tokensOverride !== undefined && tokensOverride !== null
      ? tokensOverride
      : (user?.tokensRemaining ?? null);

  // Fetch user data if not supplied by SSR (client-side pages)
  useEffect(() => {
    if (initialUser !== undefined) return; // SSR data provided — trust it
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data: { user?: NavbarUser }) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [initialUser]);

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  };

  const tokStyle = tokens !== null ? tokenStyle(tokens) : null;
  const rolePill =
    ROLE_PILL[user?.role ?? "USER"] ?? ROLE_PILL["USER"];

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        {/* ── Logo ── */}
        <Link
          href="/dashboard"
          className="flex-shrink-0 text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Contract<span className="text-violet-400">IQ</span>
        </Link>

        {/* ── Breadcrumbs ── */}
        {breadcrumbs.length > 0 && (
          <nav className="hidden items-center gap-1 sm:flex">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="max-w-[180px] truncate text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="max-w-[200px] truncate text-sm text-white/60">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {/* ── Right section (desktop) ── */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* Token badge */}
          {tokens !== null && tokStyle && (
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tokStyle.bg} ${tokStyle.border}`}
              title={
                tokens === 0
                  ? "No tokens remaining — resets in 30 days"
                  : `${tokens} analysis token${tokens !== 1 ? "s" : ""} remaining`
              }
            >
              <Coins className={`h-3.5 w-3.5 ${tokStyle.icon}`} />
              <span className={tokStyle.text}>
                {tokens} token{tokens !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Role pill */}
          {user?.role && user.role !== "USER" && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${rolePill}`}
            >
              {user.role}
            </span>
          )}

          {/* User avatar */}
          {user && (
            <div className="flex items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={32}
                  height={32}
                  className="rounded-full ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/30 text-sm font-bold text-violet-300">
                  {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-white leading-none">
                  {user.name ?? user.email}
                </p>
                {user.name && (
                  <p className="mt-0.5 text-xs text-white/40 leading-none">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:border-white/15 hover:text-white/80"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>

        {/* ── Mobile menu toggle ── */}
        <button
          className="sm:hidden rounded-lg border border-white/10 p-1.5 text-white/50 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="border-t border-white/5 bg-[#0a0a0f] px-6 py-4 sm:hidden">
          {/* Breadcrumbs on mobile */}
          {breadcrumbs.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-white/20" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-sm text-white/40 hover:text-white/70"
                      onClick={() => setMobileOpen(false)}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-sm text-white/60">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Token badge mobile */}
            {tokens !== null && tokStyle && (
              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tokStyle.bg} ${tokStyle.border}`}
              >
                <Coins className={`h-3.5 w-3.5 ${tokStyle.icon}`} />
                <span className={tokStyle.text}>
                  {tokens} token{tokens !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={28}
                    height={28}
                    className="rounded-full ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600/30 text-xs font-bold text-violet-300">
                    {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-sm text-white/70">
                  {user.name ?? user.email}
                </span>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

