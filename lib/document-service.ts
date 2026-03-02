import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";
import type { DocumentStatus } from "@/lib/generated/prisma/enums";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentListItem {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: string;
  riskScore: number | null;
  riskLevel: string | null;
  processingTimeMs: number | null;
  aiModelUsed: string | null;
  createdAt: Date;
}

export interface GetDocumentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  /** "ALL" or a DocumentStatus string */
  status?: string;
}

export interface GetDocumentsResult {
  documents: DocumentListItem[];
  total: number;
  totalPages: number;
  page: number;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Paginated list of non-deleted documents for a user.
 * Supports full-text search on fileName and status filter.
 */
export async function getUserDocuments(
  userId: string,
  opts: GetDocumentsOptions = {}
): Promise<GetDocumentsResult> {
  const { page = 1, limit = 10, search, status } = opts;
  const skip = (page - 1) * limit;

  const validStatuses = new Set<string>(["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"]);
  const statusFilter =
    status && status !== "ALL" && validStatuses.has(status)
      ? (status as DocumentStatus)
      : undefined;

  const where = {
    userId,
    deletedAt: null,
    ...(search
      ? { fileName: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        status: true,
        riskScore: true,
        riskLevel: true,
        processingTimeMs: true,
        aiModelUsed: true,
        createdAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Soft-delete a document owned by `userId`.
 * Sets deletedAt and removes the file from R2 (best-effort).
 * Does NOT refund tokens — by design.
 */
export async function softDeleteDocument(
  documentId: string,
  userId: string
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { userId: true, fileUrl: true, deletedAt: true },
  });

  if (!doc) {
    throw new Error("Document not found.");
  }
  if (doc.userId !== userId) {
    throw new Error("Forbidden.");
  }
  if (doc.deletedAt !== null) {
    throw new Error("Document is already deleted.");
  }

  // Soft delete in DB first
  await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });

  // Remove file from R2 — best-effort (don't fail the delete if R2 is unreachable)
  try {
    await deleteFromR2(doc.fileUrl);
  } catch (err) {
    console.error(
      `[document-service] R2 delete failed for key "${doc.fileUrl}":`,
      err
    );
  }
}

