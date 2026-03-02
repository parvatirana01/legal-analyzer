import { z } from "zod";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const documentStatusSchema = z.enum([
  "UPLOADED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

// ── Nested shapes ─────────────────────────────────────────────────────────────

export const clauseSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  riskLevel: riskLevelSchema.nullable(),
  explanation: z.string().nullable(),
  suggestion: z.string().nullable(),
});

export const proSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const conSchema = z.object({
  title: z.string(),
  description: z.string(),
  riskLevel: riskLevelSchema,
});

export const overallAnalysisSchema = z.object({
  documentType: z.string().optional(),
  keyParties: z.array(z.string()).optional(),
  error: z.string().optional(),
});

// ── Document ──────────────────────────────────────────────────────────────────

export const documentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number().nullable(),
  status: documentStatusSchema,
  riskScore: z.number().nullable(),
  riskLevel: riskLevelSchema.nullable(),
  summary: z.string().nullable(),
  pros: z.array(proSchema).nullable(),
  cons: z.array(conSchema).nullable(),
  overallAnalysis: overallAnalysisSchema.nullable(),
  clauses: z.array(clauseSchema),
  updatedAt: z.string(),
});

// ── API response wrappers ─────────────────────────────────────────────────────

export const documentResponseSchema = z.object({
  document: documentSchema,
});

export const deleteDocumentResponseSchema = z.object({
  success: z.boolean(),
});

export const reanalyzeDocumentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  tokensRemaining: z.number().optional(),
});

export const uploadDocumentResponseSchema = z.object({
  success: z.boolean(),
  documentId: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().nullable().optional(),
  status: z.string().optional(),
  /** true when the file is a duplicate of an existing document */
  duplicate: z.boolean().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const generateEmbeddingsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  count: z.number().optional(),
});

export const processDocumentResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type Clause = z.infer<typeof clauseSchema>;
export type Pro = z.infer<typeof proSchema>;
export type Con = z.infer<typeof conSchema>;
export type OverallAnalysis = z.infer<typeof overallAnalysisSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
export type UploadDocumentResponse = z.infer<typeof uploadDocumentResponseSchema>;
export type GenerateEmbeddingsResponse = z.infer<typeof generateEmbeddingsResponseSchema>;
export type ProcessDocumentResponse = z.infer<typeof processDocumentResponseSchema>;

