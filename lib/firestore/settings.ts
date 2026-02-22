import { getDb } from "@/lib/firebase";
import { SiteSettings } from "./types";

const COLLECTION = "siteSettings";
const MAIN_KEY = "main";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const doc = await getDb().collection(COLLECTION).doc(MAIN_KEY).get();
  return doc.exists ? doc.data() as SiteSettings : null;
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<void> {
  await getDb().collection(COLLECTION).doc(MAIN_KEY).set(data, { merge: true });
}

export async function getSetting<K extends keyof SiteSettings>(key: K): Promise<SiteSettings[K] | null> {
  const settings = await getSiteSettings();
  return settings ? settings[key] : null;
}
