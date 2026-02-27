import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, buildR2Key } from "@/lib/r2";
import { validateFile, MIME_TO_EXTENSION } from "@/lib/file-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@/lib/generated/prisma/enums";

// ── Constants ─────────────────────────────────────────────────────────────────

const GUEST_COOKIE = "guest_session_id";
const GUEST_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// ── POST /api/upload ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Identity resolution ───────────────────────────────────────────────
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    let userId: string | null = null;
    let guestSessionId: string | null = null;
    let role: UserRole | "GUEST" = "GUEST";

    if (isAuthenticated && session?.user) {
      userId = session.user.id;
      role = (session.user.role as UserRole) ?? "USER";
    } else {
      // Guest — retrieve or generate a session ID
      const cookieStore = await cookies();
      const existing = cookieStore.get(GUEST_COOKIE);
      guestSessionId = existing?.value ?? randomUUID();
    }

    const ownerId = userId ?? guestSessionId!;

    // ── 2. Parse FormData ────────────────────────────────────────────────────
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

    // ── 3. Server-side file validation ───────────────────────────────────────
    const validation = validateFile(file, role);
    if (!validation.valid) {
      return errorResponse(validation.error ?? "Invalid file.", 422);
    }

    // ── 4. Rate limiting ─────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, guestSessionId, role);
    if (!rateLimit.allowed) {
      return errorResponse(
        `Upload limit reached. You may upload ${rateLimit.limit} file(s) per hour. Try again later.`,
        429
      );
    }

    // ── 5. Read file buffer & compute SHA-256 checksum ───────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = createHash("sha256").update(buffer).digest("hex");

    // ── 6. Duplicate detection ───────────────────────────────────────────────
    const duplicate = await prisma.document.findFirst({
      where: {
        fileChecksum: checksum,
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

    // ── 7. Guest: enforce max 1 active document ──────────────────────────────
    if (!isAuthenticated && guestSessionId) {
      const guestDocCount = await prisma.document.count({
        where: { guestSessionId },
      });
      if (guestDocCount >= 1) {
        return errorResponse(
          "Guest accounts can only have 1 active document. Please sign in to upload more.",
          403
        );
      }
    }

    // ── 8. Build R2 key and upload ───────────────────────────────────────────
    const docId = randomUUID();
    const ext =
      validation.extension ??
      MIME_TO_EXTENSION[file.type] ??
      "pdf";

    const r2Key = buildR2Key(ownerId, docId, ext);

    // Virus scan placeholder hook — integrate ClamAV / external service here
    // await virusScan(buffer);

    await uploadToR2(r2Key, buffer, file.type);

    // ── 9. Persist Document record ───────────────────────────────────────────
    const document = await prisma.document.create({
      data: {
        id: docId,
        userId: userId ?? null,
        guestSessionId: guestSessionId ?? null,
        fileName: file.name,
        fileUrl: r2Key,          // store the R2 key, never the raw URL
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

    // ── 10. Build response — set guest cookie if needed ───────────────────────
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
    // Never expose internal errors to the client
    console.error("[upload] Unexpected error:", err);
    return errorResponse("An unexpected error occurred. Please try again.", 500);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

