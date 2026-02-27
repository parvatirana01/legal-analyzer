import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/lib/r2";

const BUCKET = process.env.R2_BUCKET_NAME ?? "";

/** Signed URL expiration in seconds (5 minutes) */
const EXPIRY_SECONDS = 5 * 60;

/**
 * Generate a presigned GET URL for a private R2 object.
 * The URL expires in 5 minutes.
 *
 * @param key  The R2 storage key, e.g. "documents/user-id/uuid.pdf"
 */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn: EXPIRY_SECONDS });
}

