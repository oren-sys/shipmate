import { z } from "zod";

const configSchema = z.object({
  GOOGLE_CLOUD_PROJECT: z.string().default("dropship-488214"),
  GCS_PRODUCTS_BUCKET: z.string().default("dropship-488214-products"),
  GCS_INVOICES_BUCKET: z.string().default("dropship-488214-invoices"),
  GCS_ASSETS_BUCKET: z.string().default("dropship-488214-assets"),
  BASE_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.string().default("development"),
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().default("dev-secret-change-me"),
  ADMIN_EMAIL: z.string().default("admin@shipmate.store"),
  ADMIN_PASSWORD: z.string().default("change-me"),
  MESHULAM_API_KEY: z.string().default("placeholder"),
  MESHULAM_PAGE_CODE: z.string().default("placeholder"),
  ALIEXPRESS_APP_KEY: z.string().default("placeholder"),
  ALIEXPRESS_APP_SECRET: z.string().default("placeholder"),
  WHATSAPP_API_TOKEN: z.string().default("placeholder"),
  WHATSAPP_PHONE_ID: z.string().default("placeholder"),
  META_PIXEL_ID: z.string().default(""),
  TIKTOK_PIXEL_ID: z.string().default(""),
  GOOGLE_ANALYTICS_ID: z.string().default(""),
  GMAIL_CLIENT_ID: z.string().default("placeholder"),
  GMAIL_CLIENT_SECRET: z.string().default("placeholder"),
  GMAIL_REFRESH_TOKEN: z.string().default("placeholder"),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  _config = configSchema.parse(process.env);
  return _config;
}

export const isProduction = () => getConfig().NODE_ENV === "production";
export const isGCP = () => !!process.env.K_SERVICE; // Cloud Run sets this
