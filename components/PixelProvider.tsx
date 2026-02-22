"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView, setAnalyticsConsent } from "@/lib/analytics/pixels";

/**
 * PixelProvider — Wraps the app to handle analytics consent and page tracking.
 *
 * Usage: Place in root layout or store layout.
 *
 * Consent flow:
 * 1. On mount, check localStorage for previous consent
 * 2. If consent was granted, initialize pixels
 * 3. Track page views on route changes
 */

export default function PixelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize consent from localStorage
  useEffect(() => {
    const consent = localStorage.getItem("shipmate-analytics-consent");
    if (consent === "granted") {
      setAnalyticsConsent(true);
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
