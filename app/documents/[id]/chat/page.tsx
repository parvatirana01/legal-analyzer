import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { Navbar } from "@/components/navbar";
import { ChatPanel } from "@/components/ChatPanel";
import { PdfViewerClient } from "@/components/PdfViewerClient";
import { ArrowLeft, FileText, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_BADGE: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  LOW: {
    label: "Low Risk",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Icon: ShieldCheck,
  },
  MEDIUM: {
    label: "Medium Risk",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Icon: Shield,
  },
  HIGH: {
    label: "High Risk",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
    Icon: ShieldAlert,
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentChatPage({ params }: PageProps) {
  const { id: documentId } = await params;

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const role = (session?.user?.role as string | undefined) ?? "GUEST";

  // Resolve guest session
  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  // Fetch document — guests can VIEW but not chat
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      fileSize: true,
      status: true,
      riskLevel: true,
      riskScore: true,
      userId: true,
      guestSessionId: true,
    },
  });

  if (!doc) notFound();

  // Ownership check
  const isOwner =
    (userId && doc.userId === userId) ||
    (guestSessionId && doc.guestSessionId === guestSessionId);

  if (!isOwner) redirect("/");

  // File type — chat only supported for PDFs
  const ext = doc.fileUrl.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";

  // Use the server-side PDF proxy route — browser never touches R2 directly
  // (avoids CORS errors from react-pdf's client-side fetch)
  const pdfUrl =
    isPdf && doc.status === "COMPLETED"
      ? `/api/documents/${documentId}/pdf`
      : null;

  // Fetch fresh user data for the Navbar
  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          image: true,
          role: true,
          tokensRemaining: true,
        },
      })
    : null;

  const navbarUser = dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image,
        role: dbUser.role,
        tokensRemaining: dbUser.tokensRemaining,
      }
    : null;

  const riskBadge = doc.riskLevel ? RISK_BADGE[doc.riskLevel] : null;

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f] text-white overflow-hidden">
      {/* ── Navbar ── */}
      <Navbar
        initialUser={navbarUser}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: doc.fileName, href: `/documents/${documentId}` },
          { label: "Chat" },
        ]}
      />

      {/* ── Sub-header: doc title + risk badge + back link ── */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/5 bg-[#0a0a0f] px-6 py-2.5">
        <Link
          href={`/documents/${documentId}`}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Analysis
        </Link>

        <div className="h-3.5 w-px bg-white/10" />

        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 flex-shrink-0 text-white/30" />
          <span className="truncate text-sm font-medium text-white/60">
            {doc.fileName}
          </span>
        </div>

        {riskBadge && (
          <div
            className={`ml-auto hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:flex ${riskBadge.className}`}
          >
            <riskBadge.Icon className="h-3 w-3" />
            {riskBadge.label}
            {doc.riskScore !== null && (
              <span className="opacity-70">· {doc.riskScore}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Split layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/*
         * Desktop: side-by-side (50/50)
         * Mobile: stacked (PDF on top, chat fills rest)
         * We use flex-col on mobile and flex-row on md+.
         */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* ── LEFT: PDF Viewer ── */}
          <div className="relative h-[40vh] flex-shrink-0 border-b border-white/8 md:h-full md:w-1/2 md:border-b-0 md:border-r md:border-white/8">
            {!isPdf ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <FileText className="h-10 w-10 text-white/20" />
                <p className="text-sm text-white/40">
                  Preview not available for .{ext} files.
                </p>
                <Link
                  href={`/api/documents/${documentId}/download`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:text-white/80 transition-colors"
                >
                  Download original
                </Link>
              </div>
            ) : doc.status !== "COMPLETED" ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-white/40">
                  PDF preview available after analysis completes.
                </p>
              </div>
            ) : pdfUrl ? (
              <PdfViewerClient
                signedUrl={pdfUrl}
                fileName={doc.fileName}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <p className="text-sm text-white/40">
                  Could not load PDF preview.
                </p>
                <Link
                  href={`/api/documents/${documentId}/download`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:text-white/80 transition-colors"
                >
                  Download original
                </Link>
              </div>
            )}
          </div>

          {/* ── RIGHT: Chat Panel ── */}
          <div className="flex-1 overflow-hidden md:w-1/2">
            <ChatPanel
              documentId={documentId}
              isAuthenticated={!!userId}
              userRole={role}
              documentStatus={doc.status}
              documentName={doc.fileName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

