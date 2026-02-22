/**
 * Analytics Pixel Manager
 *
 * Client-side pixels: GA4, Meta Pixel, TikTok Pixel
 * Events: page_view, view_item, add_to_cart, begin_checkout, purchase
 * Consent-aware: only fires after cookie consent
 *
 * Environment:
 * - NEXT_PUBLIC_GA4_ID: Google Analytics 4 Measurement ID (G-XXXXXXX)
 * - NEXT_PUBLIC_META_PIXEL_ID: Meta/Facebook Pixel ID
 * - NEXT_PUBLIC_TIKTOK_PIXEL_ID: TikTok Pixel ID
 */

// ---------- Types ----------

interface ProductEvent {
  id: string;
  name: string;
  price: number;
  currency?: string;
  category?: string;
  quantity?: number;
}

interface PurchaseEvent {
  orderId: string;
  total: number;
  currency?: string;
  items: ProductEvent[];
}

// ---------- Consent ----------

let consentGranted = false;

export function setAnalyticsConsent(granted: boolean) {
  consentGranted = granted;
  if (granted) {
    // Initialize pixels that were deferred
    initGA4();
    initMetaPixel();
    initTikTokPixel();
  }
}

export function hasConsent(): boolean {
  return consentGranted;
}

// ---------- Google Analytics 4 ----------

const GA4_ID = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_GA4_ID || ""
  : "";

function initGA4() {
  if (!GA4_ID || typeof window === "undefined") return;

  // Load gtag script
  if (!document.getElementById("ga4-script")) {
    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA4_ID, {
    send_page_view: false, // We send manually
  });
}

function ga4Event(eventName: string, params: Record<string, unknown> = {}) {
  if (!consentGranted || !GA4_ID || typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(["event", eventName, params]);
}

// ---------- Meta Pixel ----------

const META_PIXEL_ID = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
  : "";

function initMetaPixel() {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (window.fbq) return; // Already initialized

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  (window as { fbq?: (...args: unknown[]) => void }).fbq?.("init", META_PIXEL_ID);
}

function metaEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!consentGranted || !META_PIXEL_ID || typeof window === "undefined" || !window.fbq) return;
  window.fbq?.("track", eventName, params);
}

// ---------- TikTok Pixel ----------

const TIKTOK_PIXEL_ID = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || ""
  : "";

function initTikTokPixel() {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined") return;
  if (window.ttq) return;

  /* eslint-disable */
  (function (w: any, d: any, t: any) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off",
      "once", "ready", "alias", "group", "enableCookie", "disableCookie",
    ];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function (t: any) {
      const e = ttq._i[t] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: any, n: any) {
      const i = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = i;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      const o = d.createElement("script");
      o.type = "text/javascript";
      o.async = true;
      o.src = i + "?sdkid=" + e + "&lib=" + t;
      const a = d.getElementsByTagName("script")[0];
      a.parentNode.insertBefore(o, a);
    };
    ttq.load(TIKTOK_PIXEL_ID);
    ttq.page();
  })(window, document, "ttq");
  /* eslint-enable */
}

function tiktokEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!consentGranted || !TIKTOK_PIXEL_ID || typeof window === "undefined" || !window.ttq) return;
  window.ttq.track(eventName, params);
}

// ---------- Unified Event Dispatchers ----------

export function trackPageView(url: string) {
  ga4Event("page_view", { page_location: url });
  metaEvent("PageView");
  // TikTok auto-tracks page views
}

export function trackViewItem(product: ProductEvent) {
  const currency = product.currency || "ILS";

  ga4Event("view_item", {
    currency,
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.category }],
  });

  metaEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency,
  });

  tiktokEvent("ViewContent", {
    content_id: product.id,
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency,
  });
}

export function trackAddToCart(product: ProductEvent) {
  const currency = product.currency || "ILS";
  const quantity = product.quantity || 1;

  ga4Event("add_to_cart", {
    currency,
    value: product.price * quantity,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity }],
  });

  metaEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price * quantity,
    currency,
  });

  tiktokEvent("AddToCart", {
    content_id: product.id,
    content_name: product.name,
    content_type: "product",
    value: product.price * quantity,
    currency,
    quantity,
  });
}

export function trackBeginCheckout(items: ProductEvent[], total: number) {
  const currency = "ILS";

  ga4Event("begin_checkout", {
    currency,
    value: total,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity || 1 })),
  });

  metaEvent("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    num_items: items.length,
    value: total,
    currency,
  });

  tiktokEvent("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    value: total,
    currency,
  });
}

export function trackPurchase(purchase: PurchaseEvent) {
  const currency = "ILS";

  ga4Event("purchase", {
    transaction_id: purchase.orderId,
    value: purchase.total,
    currency,
    items: purchase.items.map((i) => ({
      item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity || 1,
    })),
  });

  metaEvent("Purchase", {
    content_ids: purchase.items.map((i) => i.id),
    content_type: "product",
    value: purchase.total,
    currency,
    num_items: purchase.items.length,
  });

  tiktokEvent("CompletePayment", {
    content_ids: purchase.items.map((i) => i.id),
    value: purchase.total,
    currency,
  });

  // Also send server-side event for iOS accuracy
  sendServerEvent("Purchase", {
    orderId: purchase.orderId,
    total: purchase.total,
    items: purchase.items,
  });
}

// ---------- Server-Side Event (Meta CAPI) ----------

async function sendServerEvent(eventName: string, data: Record<string, unknown>) {
  try {
    await fetch("/api/analytics/server-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, data }),
    });
  } catch {
    // Silently fail — analytics shouldn't break UX
  }
}

// ---------- Global Type Augmentation ----------

declare global {
  interface Window {
    dataLayer: unknown[];
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
    };
    _fbq?: unknown;
    TiktokAnalyticsObject?: string;
  }
}
