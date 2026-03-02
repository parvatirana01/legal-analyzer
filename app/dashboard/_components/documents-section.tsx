"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileX,
} from "lucide-react";
import { DocumentCard, type DocumentCardData } from "./document-card";

// ── Types ─────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
] as const;

interface DocumentsSectionProps {
  documents: DocumentCardData[];
  total: number;
  totalPages: number;
  currentPage: number;
  currentSearch: string;
  currentStatus: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentsSection({
  documents: initialDocuments,
  total,
  totalPages,
  currentPage,
  currentSearch,
  currentStatus,
}: DocumentsSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [docs, setDocs] = useState(initialDocuments);

  // Keep local list in sync when server re-renders (route refresh)
  // Using key on parent handles this; we also support optimistic removal.
  const handleDeleted = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "" || (key === "status" && value === "ALL")) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      // Reset to page 1 on filter/search change
      if ("search" in updates || "status" in updates) {
        next.delete("page");
      }

      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <section>
      {/* ── Section header ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Documents</h2>
          <p className="text-sm text-white/40">
            {total} document{total !== 1 ? "s" : ""} total
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="search"
              defaultValue={currentSearch}
              placeholder="Search by file name…"
              onChange={(e) =>
                updateParams({ search: e.target.value || undefined })
              }
              className="w-52 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          {/* Status filter */}
          <div className="relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-white/40" />
            <select
              defaultValue={currentStatus}
              onChange={(e) => updateParams({ status: e.target.value })}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1a2e]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Document list ── */}
      <div
        className={`space-y-3 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
      >
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <FileX className="h-7 w-7 text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/50">
              {currentSearch || currentStatus !== "ALL"
                ? "No documents match your filters."
                : "No documents yet. Upload your first contract above."}
            </p>
            {(currentSearch || currentStatus !== "ALL") && (
              <button
                onClick={() =>
                  updateParams({ search: undefined, status: "ALL" })
                }
                className="mt-3 text-xs text-violet-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDeleted={handleDeleted}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-white/40">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateParams({ page: String(currentPage - 1) })
              }
              disabled={currentPage <= 1 || isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-all hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("…");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-white/30 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => updateParams({ page: String(item) })}
                      disabled={isPending}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                        item === currentPage
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() =>
                updateParams({ page: String(currentPage + 1) })
              }
              disabled={currentPage >= totalPages || isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-all hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

