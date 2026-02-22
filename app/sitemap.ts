import { MetadataRoute } from "next";
import { getDb } from "@/lib/firebase";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shipmate.store";

/**
 * Dynamic sitemap generated from Firestore products and categories.
 * Supports up to 50,000 URLs per sitemap (Google's limit).
 *
 * Static pages + dynamic product pages + category pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/search", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/cart", priority: 0.4, changeFrequency: "weekly" as const },
    { path: "/checkout", priority: 0.3, changeFrequency: "monthly" as const },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  try {
    const db = getDb();

    // Product pages
    const productsSnapshot = await db
      .collection("products")
      .where("status", "==", "active")
      .select("slug", "updatedAt")
      .get();

    for (const doc of productsSnapshot.docs) {
      const data = doc.data();
      entries.push({
        url: `${BASE_URL}/product/${data.slug || doc.id}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Category pages
    const categoriesSnapshot = await db
      .collection("categories")
      .where("active", "==", true)
      .select("slug", "updatedAt")
      .get();

    for (const doc of categoriesSnapshot.docs) {
      const data = doc.data();
      entries.push({
        url: `${BASE_URL}/category/${data.slug || doc.id}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
    // Return static pages only if Firestore fails
  }

  return entries;
}
