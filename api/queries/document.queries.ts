"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getDocument,
  deleteDocument,
  reanalyzeDocument,
  processDocument,
  generateEmbeddings,
  uploadDocument,
  type UploadDocumentOptions,
} from "@/api/services";
import { queryKeys } from "./keys";
import type {
  Document,
  GenerateEmbeddingsResponse,
  ProcessDocumentResponse,
  UploadDocumentResponse,
} from "@/api/schema";

// ── useDocument ───────────────────────────────────────────────────────────────

/**
 * Fetches a document's status and full AI analysis.
 * Works for both authenticated users and guests (session cookie is sent
 * automatically).
 *
 * Pass `options` to customise staleTime, refetchInterval, etc.
 *
 * @example
 * // Poll every 3s while document is still processing
 * const { data: doc } = useDocument(id, {
 *   refetchInterval: (q) => q.state.data?.status === "PROCESSING" ? 3000 : false,
 * });
 */
export function useDocument(
  id: string | undefined,
  options?: Partial<UseQueryOptions<Document>>
) {
  return useQuery<Document>({
    queryKey: queryKeys.document.detail(id ?? ""),
    queryFn: () => getDocument(id!),
    enabled: !!id,
    staleTime: 0,
    ...options,
  });
}

// ── useDeleteDocument ─────────────────────────────────────────────────────────

/**
 * Soft-deletes a document. On success the document is removed from the cache.
 *
 * @example
 * const { mutate: deleteDoc, isPending } = useDeleteDocument();
 * deleteDoc(documentId);
 */
export function useDeleteDocument() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: queryKeys.document.detail(id) });
    },
  });
}

// ── useReanalyzeDocument ──────────────────────────────────────────────────────

/**
 * Triggers a re-analysis of the document. Deducts one token.
 * Invalidates both the document cache (PROCESSING status) and the user cache
 * (updated tokensRemaining) on success.
 *
 * @example
 * const { mutate: reanalyze, isPending } = useReanalyzeDocument();
 * reanalyze(documentId);
 */
export function useReanalyzeDocument() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => reanalyzeDocument(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.document.detail(id) });
      // Token was deducted server-side — refresh the displayed token count
      void qc.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
}

// ── useProcessDocument ────────────────────────────────────────────────────────

/**
 * Manually triggers the AI processing pipeline for a document.
 * Invalidates the document cache on success.
 */
export function useProcessDocument() {
  const qc = useQueryClient();

  return useMutation<ProcessDocumentResponse, Error, string>({
    mutationFn: (id: string) => processDocument(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.document.detail(id) });
    },
  });
}

// ── useGenerateEmbeddings ─────────────────────────────────────────────────────

/**
 * Generates (or regenerates) vector embeddings for a document.
 *
 * @example
 * const { mutate: embed } = useGenerateEmbeddings();
 * embed({ id: documentId, force: true });
 */
export function useGenerateEmbeddings() {
  return useMutation<
    GenerateEmbeddingsResponse,
    Error,
    { id: string; force?: boolean }
  >({
    mutationFn: ({ id, force }) => generateEmbeddings(id, force),
  });
}

// ── useUploadDocument ─────────────────────────────────────────────────────────

/**
 * Uploads a document file. Accepts an optional `onProgress` callback.
 *
 * After a successful upload the user's token count is refreshed automatically
 * because the server deducts one token for USER-role accounts during upload.
 *
 * @example
 * const { mutate: upload, isPending } = useUploadDocument({
 *   onProgress: (pct) => setProgress(pct),
 * });
 * upload(selectedFile);
 */
export function useUploadDocument(uploadOptions?: UploadDocumentOptions) {
  const qc = useQueryClient();

  return useMutation<UploadDocumentResponse, Error, File>({
    mutationFn: (file: File) => uploadDocument(file, uploadOptions),
    onSuccess: (data) => {
      // Token was deducted server-side for USER role — refresh the displayed
      // token count. We always invalidate; for guests it's a no-op since
      // useCurrentUser is not mounted when unauthenticated.
      if (data.success && !data.duplicate) {
        void qc.invalidateQueries({ queryKey: queryKeys.user.me() });
      }
    },
  });
}

