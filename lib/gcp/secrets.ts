import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";

export async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${PROJECT}/secrets/${name}/versions/latest`,
  });
  return version.payload?.data?.toString() || "";
}

export async function loadAllSecrets(): Promise<Record<string, string>> {
  const secretNames = [
    "MESHULAM_API_KEY", "MESHULAM_PAGE_CODE",
    "ALIEXPRESS_APP_KEY", "ALIEXPRESS_APP_SECRET",
    "WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_ID",
    "META_PIXEL_ID", "TIKTOK_PIXEL_ID", "GOOGLE_ANALYTICS_ID",
    "NEXTAUTH_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD",
    "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN",
  ];

  const results: Record<string, string> = {};
  await Promise.all(
    secretNames.map(async (name) => {
      try {
        results[name] = await getSecret(name);
      } catch {
        results[name] = process.env[name] || "";
      }
    })
  );
  return results;
}
