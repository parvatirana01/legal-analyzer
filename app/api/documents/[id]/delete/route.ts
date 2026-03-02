import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { softDeleteDocument } from "@/lib/document-service";

// ── DELETE /api/documents/[id]/delete ────────────────────────────────────────
//
// Soft-deletes the document (sets deletedAt) and removes the file from R2.
// Requires authenticated ownership. Tokens are NOT refunded by design.

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: documentId } = await context.params;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await softDeleteDocument(documentId, userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete document.";
    const status = message === "Forbidden." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

