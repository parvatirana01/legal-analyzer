import apiClient from "@/api/client";
import {
  documentResponseSchema,
  uploadDocumentResponseSchema,
  generateEmbeddingsResponseSchema,
  processDocumentResponseSchema,
  type Document,
  type UploadDocumentResponse,
  type GenerateEmbeddingsResponse,
  type ProcessDocumentResponse,
} from "@/api/schema";

// ── GET /api/documents/[id] ───────────────────────────────────────────────────

/**
 * Fetches a document's status and full analysis data.
 * Works for both authenticated users and guests (via session cookie).
 */
export async function getDocument(id: string): Promise<Document> {
  const response = await apiClient.get(`/documents/${id}`);
  const parsed = documentResponseSchema.parse(response.data);
  return parsed.document;
}

// ── DELETE /api/documents/[id]/delete ────────────────────────────────────────

/**
 * Soft-deletes the document and removes it from R2 storage.
 * Requires authenticated ownership.
 */
export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}/delete`);
}

// ── POST /api/documents/[id]/reanalyze ───────────────────────────────────────

/**
 * Re-runs AI analysis for the document, deducting one token.
 * Previous analysis data is wiped before the new run starts.
 */
export async function reanalyzeDocument(id: string): Promise<void> {
  await apiClient.post(`/documents/${id}/reanalyze`);
}

// ── POST /api/process/[id] ────────────────────────────────────────────────────

/**
 * Triggers the background AI processing pipeline for a document.
 * Used after upload when automatic processing has not yet started.
 */
export async function processDocument(id: string): Promise<ProcessDocumentResponse> {
  const response = await apiClient.post(`/process/${id}`);
  return processDocumentResponseSchema.parse(response.data);
}

// ── POST /api/documents/[id]/generate-embeddings ─────────────────────────────

/**
 * Generates and stores vector embeddings for the document's text chunks.
 * Pass `force: true` to regenerate even if embeddings already exist.
 */
export async function generateEmbeddings(
  id: string,
  force?: boolean
): Promise<GenerateEmbeddingsResponse> {
  const url = force
    ? `/documents/${id}/generate-embeddings?force=true`
    : `/documents/${id}/generate-embeddings`;

  const response = await apiClient.post(url);
  return generateEmbeddingsResponseSchema.parse(response.data);
}

// ── DELETE /api/documents/[id]/clear-chat ────────────────────────────────────

/**
 * Deletes all chat messages for the specified document.
 */
export async function clearChat(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}/clear-chat`);
}

// ── POST /api/upload ──────────────────────────────────────────────────────────

export interface UploadDocumentOptions {
  /** Called with upload progress percentage (0–100) during the XHR upload. */
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a document file via multipart/form-data.
 * Triggers immediate background AI processing after a successful upload.
 * Supports upload-progress callbacks via `options.onProgress`.
 */
export async function uploadDocument(
  file: File,
  options?: UploadDocumentOptions
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/upload", formData, {
    // Let axios set the correct multipart boundary automatically
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && options?.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    },
  });

  return uploadDocumentResponseSchema.parse(response.data);
}

