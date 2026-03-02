import {
  GoogleGenerativeAI,
  GenerateContentResult,
  TaskType,
} from "@google/generative-ai";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevelValue = "LOW" | "MEDIUM" | "HIGH";

export interface Pro {
  title: string;
  description: string;
}

export interface Con {
  title: string;
  description: string;
  riskLevel: RiskLevelValue;
}

export interface ClauseAnalysis {
  title: string;
  summary: string;
  riskLevel: RiskLevelValue;
  explanation: string;
  suggestion: string;
}

export interface StructuredAnalysis {
  summary: string;
  documentType: string;
  keyParties: string[];
  pros: Pro[];
  cons: Con[];
  clauses: ClauseAnalysis[];
  overallRiskLevel: RiskLevelValue;
}

// ── Configuration ─────────────────────────────────────────────────────────────

export const GEMINI_MODEL = "gemini-2.5-pro";
// "gemini-embedding-001" is the correct model name returned by ListModels.
// It produces 3072-dimensional vectors and supports all TaskType values.
// Both "text-embedding-004" and "embedding-001" return 404 on this API key.
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

const GEMINI_TIMEOUT_MS = 120_000; // 2 minutes

const SYSTEM_INSTRUCTION = `You are a professional legal contract analyzer.

Analyze the provided legal document and respond ONLY in valid JSON format.

The JSON structure must be exactly:
{
  "summary": "Plain English summary of the document",
  "documentType": "Type of contract",
  "keyParties": ["Party A", "Party B"],
  "pros": [
    {
      "title": "",
      "description": ""
    }
  ],
  "cons": [
    {
      "title": "",
      "description": "",
      "riskLevel": "LOW | MEDIUM | HIGH"
    }
  ],
  "clauses": [
    {
      "title": "",
      "summary": "",
      "riskLevel": "LOW | MEDIUM | HIGH",
      "explanation": "",
      "suggestion": ""
    }
  ],
  "overallRiskLevel": "LOW | MEDIUM | HIGH"
}

Rules:
- Return ONLY the JSON object. No markdown fences, no explanations, no extra text.
- riskLevel values must be exactly one of: LOW, MEDIUM, or HIGH (uppercase).
- Every array must have at least one item.
- summary should be 3-5 sentences in plain English for a non-lawyer.
- Each clause should have a clear title, concise summary, and actionable suggestion.`;

// ── Client factory (lazy, singleton) ─────────────────────────────────────────

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set."
      );
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_RISK_LEVELS: ReadonlySet<string> = new Set(["LOW", "MEDIUM", "HIGH"]);

function isValidRiskLevel(value: unknown): value is RiskLevelValue {
  return typeof value === "string" && VALID_RISK_LEVELS.has(value);
}

function validatePro(item: unknown): item is Pro {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return typeof o.title === "string" && typeof o.description === "string";
}

function validateCon(item: unknown): item is Con {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    isValidRiskLevel(o.riskLevel)
  );
}

function validateClause(item: unknown): item is ClauseAnalysis {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.summary === "string" &&
    isValidRiskLevel(o.riskLevel) &&
    typeof o.explanation === "string" &&
    typeof o.suggestion === "string"
  );
}

function validateStructuredAnalysis(raw: unknown): raw is StructuredAnalysis {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;

  if (typeof o.summary !== "string") return false;
  if (typeof o.documentType !== "string") return false;
  if (!Array.isArray(o.keyParties)) return false;
  if (!Array.isArray(o.pros) || !o.pros.every(validatePro)) return false;
  if (!Array.isArray(o.cons) || !o.cons.every(validateCon)) return false;
  if (!Array.isArray(o.clauses) || !o.clauses.every(validateClause)) return false;
  if (!isValidRiskLevel(o.overallRiskLevel)) return false;

  return true;
}

// ── Core extraction ───────────────────────────────────────────────────────────

/**
 * Strip markdown code fences if Gemini wraps JSON in ```json ... ```
 */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

async function callGemini(text: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.1,         // near-deterministic for structured output
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `Analyze the following legal document:\n\n${text}`;

  // Wrap with a timeout
  const resultPromise: Promise<GenerateContentResult> =
    model.generateContent(prompt);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Gemini API call timed out after 2 minutes.")),
      GEMINI_TIMEOUT_MS
    )
  );

  const result = await Promise.race([resultPromise, timeoutPromise]);
  const response = result.response;
  return response.text();
}

function parseGeminiResponse(rawText: string): unknown {
  const cleaned = stripMarkdownFences(rawText);
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    // Attempt to extract first JSON object from the string
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as unknown;
    }
    throw new Error("Gemini response is not valid JSON.");
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyze a legal document using Gemini and return a validated
 * StructuredAnalysis object.
 *
 * Retries once on invalid JSON.
 *
 * @param text   Cleaned, extracted document text
 */
export async function analyzeDocument(
  text: string
): Promise<StructuredAnalysis> {
  if (!text.trim()) {
    throw new Error("Cannot analyze an empty document.");
  }

  // ── First attempt ──────────────────────────────────────────────────────────
  let rawText = await callGemini(text);
  let parsed = parseGeminiResponse(rawText);

  if (validateStructuredAnalysis(parsed)) {
    return parsed;
  }

  // ── Retry once ─────────────────────────────────────────────────────────────
  console.warn("[gemini] First response failed validation — retrying once…");
  rawText = await callGemini(text);
  parsed = parseGeminiResponse(rawText);

  if (validateStructuredAnalysis(parsed)) {
    return parsed;
  }

  throw new Error(
    "Gemini returned an invalid structure after two attempts. " +
      "Please try again later."
  );
}

// ── Embedding API ─────────────────────────────────────────────────────────────

/**
 * Generate a text embedding vector using the `text-embedding-004` model.
 * Returns a float[] of dimension 768.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: "user" },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return result.embedding.values;
}

/**
 * Generate an embedding for a query (slightly different task type for better
 * retrieval quality with text-embedding-004).
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: "user" },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return result.embedding.values;
}

// ── RAG chat (streaming) ──────────────────────────────────────────────────────

const RAG_SYSTEM_INSTRUCTION = `You are a helpful legal document assistant.
Answer the user's question using the provided document context as your primary source.
If the relevant information is not present in the context, let the user know in a natural, conversational way and suggest what they might look for instead.
Be clear, concise, and helpful. Do not fabricate details or reference information outside the document.`;

const CHAT_TIMEOUT_MS = 60_000;

/**
 * Stream a RAG-grounded answer from Gemini.
 * Yields string chunks as they arrive.
 */
export async function* streamRagAnswer(
  question: string,
  context: string
): AsyncGenerator<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: RAG_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });

  const prompt = `Document Context:\n${context}\n\nUser Question:\n${question}`;

  const streamPromise = model.generateContentStream(prompt);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Gemini streaming timed out after 60 seconds.")),
      CHAT_TIMEOUT_MS
    )
  );

  const { stream } = await Promise.race([streamPromise, timeoutPromise]);

  for await (const chunk of stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

