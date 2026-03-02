import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserDocuments } from "@/lib/document-service";
import { Navbar } from "@/components/navbar";
import { UploadDocument } from "@/app/dashboard/_components/upload-document";
import { DocumentsSection } from "@/app/dashboard/_components/documents-section";
import { ShieldCheck, Coins, FileText } from "lucide-react";
import Image from "next/image";

// ── Constants ─────────────────────────────────────────────────────────────────

const DOCS_PER_PAGE = 10;

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { user: sessionUser } = session;

  // ── Fresh DB data (bypasses stale JWT token count) ─────────────────────────
  const [dbUser, docsResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
        tokensRemaining: true,
        tokensResetDate: true,
      },
    }),
    (async () => {
      const params = await searchParams;
      const page = Math.max(1, parseInt(params.page ?? "1", 10));
      const search = params.search?.trim() ?? "";
      const status = params.status ?? "ALL";
      return {
        ...(await getUserDocuments(sessionUser.id, {
          page,
          limit: DOCS_PER_PAGE,
          search: search || undefined,
          status,
        })),
        page,
        search,
        status,
      };
    })(),
  ]);

  const tokensRemaining = dbUser?.tokensRemaining ?? 0;
  const isSubscriber = sessionUser.role === "SUBSCRIBER";

  const navbarUser = {
    name: dbUser?.name ?? sessionUser.name ?? null,
    email: dbUser?.email ?? sessionUser.email ?? null,
    image: dbUser?.image ?? sessionUser.image ?? null,
    role: sessionUser.role ?? "USER",
    tokensRemaining,
  };

  const { documents, total, totalPages } = docsResult;
  const { page, search, status } = docsResult;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── NAVBAR ── */}
      <Navbar
        initialUser={navbarUser}
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome card */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {navbarUser.image ? (
              <Image
                src={navbarUser.image}
                alt={navbarUser.name ?? "Avatar"}
                width={52}
                height={52}
                className="rounded-full ring-2 ring-violet-500/30"
              />
            ) : (
              <div className="flex h-13 w-13 items-center justify-center rounded-full bg-violet-600/20 text-xl font-bold text-violet-400">
                {navbarUser.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p className="text-xs text-white/40">Welcome back</p>
              <h1 className="text-xl font-bold">
                {navbarUser.name ?? navbarUser.email}
              </h1>
              <p className="mt-0.5 text-sm text-white/50">{navbarUser.email}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {/* Tokens */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                tokensRemaining === 0
                  ? "bg-red-500/15"
                  : tokensRemaining === 1
                  ? "bg-amber-500/15"
                  : "bg-violet-600/20"
              }`}
            >
              <Coins
                className={`h-5 w-5 ${
                  tokensRemaining === 0
                    ? "text-red-400"
                    : tokensRemaining === 1
                    ? "text-amber-400"
                    : "text-violet-400"
                }`}
              />
            </span>
            <div>
              <p className="text-xs text-white/40">Tokens Remaining</p>
              <p
                className={`text-3xl font-bold ${
                  tokensRemaining === 0
                    ? "text-red-400"
                    : tokensRemaining === 1
                    ? "text-amber-400"
                    : "text-white"
                }`}
              >
                {tokensRemaining}
              </p>
              <p className="text-xs text-white/30">resets every 30 days</p>
            </div>
          </div>

          {/* Plan */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-600/20">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </span>
            <div>
              <p className="text-xs text-white/40">Plan</p>
              <p className="text-xl font-bold">
                {isSubscriber ? "Pro" : "Free"}
              </p>
              <p className="text-xs text-white/30">
                {isSubscriber ? "Unlimited analyses" : "3 analyses / month"}
              </p>
            </div>
          </div>

          {/* Total docs */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600/20">
              <FileText className="h-5 w-5 text-emerald-400" />
            </span>
            <div>
              <p className="text-xs text-white/40">Total Documents</p>
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-xs text-white/30">across all statuses</p>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="mb-8 rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold">Upload a Contract</h2>
            {tokensRemaining === 0 && !isSubscriber && (
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                No tokens — resets in 30 days
              </span>
            )}
          </div>
          <p className="mb-5 text-sm text-white/50">
            PDF or Word document · AI risk analysis, pros &amp; cons, clause
            breakdown.
          </p>
          <UploadDocument role={sessionUser.role} />
        </div>

        {/* Documents section */}
        <DocumentsSection
          documents={documents.map((d) => ({
            ...d,
            status: d.status as "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED",
            riskLevel: d.riskLevel as "LOW" | "MEDIUM" | "HIGH" | null,
            createdAt: d.createdAt.toISOString(),
          }))}
          total={total}
          totalPages={totalPages}
          currentPage={page}
          currentSearch={search}
          currentStatus={status}
        />
      </main>
    </div>
  );
}
