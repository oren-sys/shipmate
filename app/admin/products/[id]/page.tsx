"use client";

import { useParams, useRouter } from "next/navigation";
import ProductForm, { type ProductData } from "@/components/admin/ProductForm";

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const isNew = productId === "new";

  // In production, fetch product from Firestore via API
  const existingProduct = isNew
    ? undefined
    : {
        titleHe: "אוזניות בלוטוס Pro",
        titleEn: "Bluetooth Earbuds Pro",
        descriptionHe: "אוזניות בלוטוס אלחוטיות באיכות שמע גבוהה עם ביטול רעשים אקטיבי",
        descriptionEn: "Wireless Bluetooth earbuds with active noise cancellation",
        costPrice: 12,
        price: 179.9,
        compareAtPrice: 239.9,
        category: "אלקטרוניקה",
        tags: ["בלוטוס", "אוזניות", "אלחוטי"],
        status: "active" as const,
        images: ["/placeholder-1.jpg", "/placeholder-2.jpg"],
        aliexpressUrl: "https://aliexpress.com/item/example",
        weight: 45,
      };

  const handleSave = async (data: ProductData) => {
    try {
      const url = isNew ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Save failed");
      router.push("/admin/products");
    } catch (err) {
      console.error("Save error:", err);
      alert("שגיאה בשמירת המוצר");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            {isNew ? "מוצר חדש" : "עריכת מוצר"}
          </h1>
          {!isNew && (
            <p className="text-sm text-gray-500 mt-0.5">
              ID: {productId}
            </p>
          )}
        </div>
      </div>

      <ProductForm
        product={existingProduct}
        onSave={handleSave}
        isNew={isNew}
      />
    </div>
  );
}
