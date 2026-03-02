/**
 * GET /api/documents/[id]/pdf
 *
 * Streams the PDF directly from R2 through the Next.js server.
 * This prevents the browser from ever touching R2 directly, which avoids
 * CORS errors when react-pdf fetches the file client-side via fetch().
 *
 * Access rules: same ownership check as all other document routes.
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { id: documentId } = await context.params;

  if (!documentId) {
    return new Response(JSON.stringify({ error: "Missing document ID." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let guestSessionId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestSessionId = cookieStore.get("guest_session_id")?.value ?? null;
  }

  // ── Ownership check ───────────────────────────────────────────────────────
  const doc = await prisma.document.findUnique({
    where: { id: documentId, deletedAt: null },
    select: { userId: true, guestSessionId: true, fileUrl: true, status: true },
  });

  if (!doc) {
    return new Response(JSON.stringify({ error: "Document not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isOwner =
    (userId && doc.userId === userId) ||
    (guestSessionId && doc.guestSessionId === guestSessionId);

  if (!isOwner) {
    return new Response(JSON.stringify({ error: "Forbidden." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only serve PDFs via this route
  const ext = doc.fileUrl.split(".").pop()?.toLowerCase() ?? "";
  if (ext !== "pdf") {
    return new Response(JSON.stringify({ error: "Not a PDF." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Fetch from R2 (server-to-server — no CORS) ────────────────────────────
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: doc.fileUrl,
    });

    const r2Response = await r2Client.send(command);

    if (!r2Response.Body) {
      throw new Error("Empty response body from R2.");
    }

    // r2Response.Body is a SdkStream — cast to ReadableStream for the Response
    const body = r2Response.Body as ReadableStream;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // inline: display in browser rather than trigger a download
        "Content-Disposition": `inline; filename="${doc.fileUrl.split("/").pop() ?? "document.pdf"}"`,
        // Cache for 5 minutes on the browser (private — per user)
        "Cache-Control": "private, max-age=300",
        ...(r2Response.ContentLength
          ? { "Content-Length": String(r2Response.ContentLength) }
          : {}),
      },
    });
  } catch (err) {
    console.error(`[pdf-proxy] Failed to stream ${documentId}:`, err);
    return new Response(
      JSON.stringify({ error: "Failed to load PDF. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

