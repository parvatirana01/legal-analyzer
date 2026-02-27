import type { UserRole } from "@/lib/generated/prisma/enums";

// ── Constants ─────────────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

/** MIME → canonical extension */
export const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const MB = 1024 * 1024;

/** Maximum file sizes in bytes per role */
export const MAX_FILE_SIZE: Record<string, number> = {
  GUEST: 5 * MB,
  USER: 10 * MB,
  SUBSCRIBER: 25 * MB,
  ADMIN: 25 * MB,
};

/** Human-readable max sizes */
export const MAX_FILE_SIZE_LABEL: Record<string, string> = {
  GUEST: "5 MB",
  USER: "10 MB",
  SUBSCRIBER: "25 MB",
  ADMIN: "25 MB",
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
  extension?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the lowercase extension from a filename (without the leading dot).
 */
export function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Format a byte count as a human-readable string (e.g. "4.2 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

// ── Main validator ────────────────────────────────────────────────────────────

/**
 * Validate a file against MIME type, extension, and size limits.
 *
 * @param file   The File object from FormData
 * @param role   The uploader's role (determines size limit)
 */
export function validateFile(
  file: File,
  role: UserRole | "GUEST"
): ValidationResult {
  // 1. MIME type check
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Only PDF and Word documents are accepted.`,
    };
  }

  // 2. Extension check (double validation — never trust the MIME alone)
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File extension ".${ext}" is not allowed. Only .pdf, .doc, and .docx are accepted.`,
    };
  }

  // 3. MIME↔extension consistency (prevents MIME spoofing)
  const expectedExt = MIME_TO_EXTENSION[file.type];
  if (expectedExt && ext !== expectedExt) {
    // .docx files may arrive with MIME for .doc — allow the reverse
    const isDocVariant =
      (ext === "doc" || ext === "docx") &&
      (file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (!isDocVariant) {
      return {
        valid: false,
        error: "File extension does not match the file's MIME type.",
      };
    }
  }

  // 4. Size check
  const roleKey = (role as string) in MAX_FILE_SIZE ? (role as string) : "GUEST";
  const maxSize = MAX_FILE_SIZE[roleKey];
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large. Maximum size for your plan is ${MAX_FILE_SIZE_LABEL[roleKey]}.`,
    };
  }

  // 5. Reject empty files
  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }

  return { valid: true, extension: ext };
}

