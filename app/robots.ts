import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shipmate.store";

/**
 * robots.txt configuration for ShipMate
 *
 * Allows all crawlers on public pages.
 * Blocks admin panel, API routes, checkout, and cart.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/checkout",
          "/cart",
          "/order-confirmation/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
