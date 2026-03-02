import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, buildR2Key } from "@/lib/r2";
import { validateFile, MIME_TO_EXTENSION } from "@/lib/file-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { processDocument } from "@/lib/process-document";
import { deductTokenForAnalysis } from "@/lib/token-manager";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── Constants ─────────────────────────────────────────────────────────────────

const GUEST_COOKIE = "guest_session_id";
const GUEST_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// ── POST /api/upload ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Identity resolution ─────────────────────────────────────────────
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    let userId: string | null = null;
    let guestSessionId: string | null = null;
    let role: UserRole | "GUEST" = "GUEST";

    if (isAuthenticated && session?.user) {
      userId = session.user.id;
      role = (session.user.role as UserRole) ?? "USER";
    } else {
      const cookieStore = await cookies();
      const existing = cookieStore.get(GUEST_COOKIE);
      guestSessionId = existing?.value ?? randomUUID();
    }

    const ownerId = userId ?? guestSessionId!;

    // ── 2. Parse FormData ──────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return errorResponse("Invalid request — expected multipart/form-data.", 400);
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return errorResponse("No file provided.", 400);
    }

    // ── 3. Server-side file validation ─────────────────────────────────────
    const validation = validateFile(file, role);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.", 422);
    }

    // ── 4. Rate limiting ───────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, guestSessionId, role);
    if (!rateLimit.allowed) {
      return errorResponse(
        `Upload limit reached. You may upload ${rateLimit.limit} file(s) per hour. Try again later.`,
        429
      );
    }

    // ── 5. Token balance check (USER role only — fail early before upload) ─
    if (userId && role === "USER") {
      const { resetTokensIfExpired } = await import("@/lib/tokens");
      const available = await resetTokensIfExpired(userId);
      if (available <= 0) {
        return errorResponse(
          "You have no analysis tokens remaining. Your tokens reset every 30 days.",
          402
        );
      }
    }

    // ── 6. Read file buffer & compute SHA-256 checksum ─────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = createHash("sha256").update(buffer).digest("hex");

    // ── 7. Duplicate detection ─────────────────────────────────────────────
    const duplicate = await prisma.document.findFirst({
      where: {
        fileChecksum: checksum,
        deletedAt: null,
        ...(userId ? { userId } : { guestSessionId }),
      },
      select: { id: true, fileName: true },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          documentId: duplicate.id,
          message: `This file was already uploaded as "${duplicate.fileName}".`,
        },
        { status: 409 }
      );
    }

    // ── 8. Guest: enforce max 1 active document ────────────────────────────
    if (!isAuthenticated && guestSessionId) {
      const guestDocCount = await prisma.document.count({
        where: { guestSessionId, deletedAt: null },
      });
      if (guestDocCount >= 1) {
        return errorResponse(
          "Guest accounts can only have 1 active document. Please sign in to upload more.",
          403
        );
      }
    }

    // ── 9. Build R2 key and upload ─────────────────────────────────────────
    const docId = randomUUID();
    const ext =
      validation.extension ??
      MIME_TO_EXTENSION[file.type] ??
      "pdf";

    const r2Key = buildR2Key(ownerId, docId, ext);

    await uploadToR2(r2Key, buffer, file.type);

    // ── 10. Persist Document record ────────────────────────────────────────
    const document = await prisma.document.create({
      data: {
        id: docId,
        userId: userId ?? null,
        guestSessionId: guestSessionId ?? null,
        fileName: file.name,
        fileUrl: r2Key,
        fileSize: file.size,
        fileChecksum: checksum,
        status: "UPLOADED",
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        status: true,
      },
    });

    // ── 11. Deduct token atomically (USER role only) ───────────────────────
    if (userId && (role as string) === "USER") {
      const tokenResult = await deductTokenForAnalysis(
        userId,
        role as UserRole,
        docId
      );

      if (!tokenResult.allowed) {
        // Rollback: remove the document and R2 object, then report
        await prisma.document.delete({ where: { id: docId } });
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(r2Key).catch(() => {});
        return errorResponse(tokenResult.error, 402);
      }
    }

    // ── 12. Trigger background AI processing (non-blocking) ───────────────
    processDocument(docId, userId, userId ? (role as UserRole) : null).catch(
      (err: unknown) => {
        console.error("[upload] Background processing error:", err);
      }
    );

    // ── 13. Build response — set guest cookie if needed ───────────────────
    const responseBody = {
      success: true,
      documentId: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      status: document.status,
    };

    const response = NextResponse.json(responseBody, { status: 201 });

    if (!isAuthenticated && guestSessionId) {
      response.cookies.set(GUEST_COOKIE, guestSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: GUEST_COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return response;
  } catch (err: unknown) {
    console.error("[upload] Unexpected error:", err);
    return errorResponse("An unexpected error occurred. Please try again.", 500);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}
