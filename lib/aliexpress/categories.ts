/* ── AliExpress category IDs mapping ── */
/* Uses Dropshipping API feed names (aliexpress.ds.recommend.feed.get) */
/* Priority: high-volume feeds with popular products for Israel market */
export const AE_CATEGORIES: Record<string, { id: string; feedName: string; nameEn: string; nameHe: string }> = {
  electronics: { id: "44", feedName: "DS_ConsumerElectronics_bestsellers", nameEn: "Consumer Electronics", nameHe: "אלקטרוניקה" },
  fashion: { id: "3", feedName: "DS_Global_topsellers", nameEn: "Apparel & Accessories", nameHe: "אופנה" },
  home: { id: "15", feedName: "DS_Home&Kitchen_bestsellers", nameEn: "Home & Garden", nameHe: "בית וגן" },
  beauty: { id: "66", feedName: "DS_Beauty_bestsellers", nameEn: "Beauty & Health", nameHe: "יופי וטיפוח" },
  kids: { id: "1501", feedName: "DS_Global_topsellers", nameEn: "Mother & Kids", nameHe: "ילדים" },
  gadgets: { id: "509", feedName: "DS_ConsumerElectronics_bestsellers", nameEn: "Phones & Accessories", nameHe: "גאדג׳טים" },
  sports: { id: "18", feedName: "DS_Sports&Outdoors_bestsellers", nameEn: "Sports & Entertainment", nameHe: "ספורט" },
  auto: { id: "34", feedName: "DS_Automobile&Accessories_bestsellers", nameEn: "Automobiles & Motorcycles", nameHe: "רכב" },
  jewelry: { id: "36", feedName: "DS_Global_topsellers", nameEn: "Jewelry & Accessories", nameHe: "תכשיטים" },
  toys: { id: "26", feedName: "DS_Global_topsellers", nameEn: "Toys & Hobbies", nameHe: "צעצועים" },
};

/* Default feed for "all categories" scanning — 200K+ high-volume products */
export const AE_DEFAULT_FEED = "DS_Global_topsellers";
