import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ── Client ────────────────────────────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  // Warn at import time in non-test environments
  if (process.env.NODE_ENV !== "test") {
    console.warn("[r2] Missing R2 environment variables — uploads will fail.");
  }
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: R2_SECRET_ACCESS_KEY ?? "",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Upload a buffer to R2.
 * @param key       Storage path, e.g. "documents/user-id/uuid.pdf"
 * @param body      File contents as Buffer
 * @param contentType  MIME type string
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Never allow public access via S3 ACL
    ACL: undefined,
  });

  await r2Client.send(command);
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Build the R2 storage key for a document.
 * Format: documents/{ownerId}/{uuid}.{ext}
 */
export function buildR2Key(
  ownerId: string,
  uuid: string,
  extension: string
): string {
  // Normalise extension — always lowercase, strip leading dot
  const ext = extension.replace(/^\./, "").toLowerCase();
  return `documents/${ownerId}/${uuid}.${ext}`;
}

