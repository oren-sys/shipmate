import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";

export async function uploadFile(
  bucket: string,
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const file = storage.bucket(bucket).file(filePath);
  await file.save(buffer, { contentType, resumable: false });
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}

export async function getSignedUrl(bucket: string, filePath: string, expiresInDays = 30): Promise<string> {
  const [url] = await storage.bucket(bucket).file(filePath).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  });
  return url;
}

export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  await storage.bucket(bucket).file(filePath).delete().catch(() => {});
}

export function getPublicUrl(bucket: string, filePath: string): string {
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}

export const BUCKETS = {
  products: `${PROJECT}-products`,
  invoices: `${PROJECT}-invoices`,
  assets: `${PROJECT}-assets`,
};
