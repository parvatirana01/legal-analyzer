import mammoth from "mammoth";

// pdf-parse is a CommonJS module; require() bypasses the ESM resolver issue
// that occurs with moduleResolution: "bundler"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number; info: Record<string, unknown> }>;

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum extracted character count sent to Gemini (~50k chars ≈ ~12k tokens) */
const MAX_TEXT_LENGTH = 50_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExtractionResult {
  text: string;
  truncated: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Collapse runs of blank lines / excess whitespace while preserving paragraph
 * structure.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")           // normalise line endings
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")          // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")       // max two consecutive newlines
    .trim();
}

/**
 * Safely truncate text at the nearest word boundary below `maxLength`.
 */
function truncateSafely(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.9 ? truncated.slice(0, lastSpace) : truncated).trimEnd();
}

// ── PDF extraction ────────────────────────────────────────────────────────────

async function extractFromPdf(buffer: Buffer): Promise<string> {
  let data: { text: string; numpages: number; info: Record<string, unknown> };

  try {
    data = await pdfParse(buffer);
  } catch (err) {
    throw new Error(
      `PDF parsing failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const text = cleanText(data.text);
  if (!text) {
    throw new Error(
      "No readable text could be extracted from the PDF. " +
        "The file may be image-based or encrypted."
    );
  }

  return text;
}

// ── DOCX / DOC extraction ─────────────────────────────────────────────────────

async function extractFromDocx(buffer: Buffer): Promise<string> {
  let result: Awaited<ReturnType<typeof mammoth.extractRawText>>;

  try {
    result = await mammoth.extractRawText({ buffer });
  } catch (err) {
    throw new Error(
      `DOCX parsing failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const text = cleanText(result.value);
  if (!text) {
    throw new Error(
      "No readable text could be extracted from the Word document. " +
        "The file may be empty or in an unsupported format."
    );
  }

  return text;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extract plain text from a PDF or DOCX/DOC buffer.
 *
 * @param buffer       Raw file bytes
 * @param mimeType     MIME type string from the uploaded file
 * @returns            Cleaned text and a flag indicating if it was truncated
 *
 * @throws             If the file is corrupted, empty, or an unsupported format
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  let rawText: string;

  if (mimeType === "application/pdf") {
    rawText = await extractFromPdf(buffer);
  } else if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    rawText = await extractFromDocx(buffer);
  } else {
    throw new Error(
      `Unsupported file type: "${mimeType}". Only PDF and Word documents are supported.`
    );
  }

  const truncated = rawText.length > MAX_TEXT_LENGTH;
  const text = truncated ? truncateSafely(rawText, MAX_TEXT_LENGTH) : rawText;

  return { text, truncated };
}

