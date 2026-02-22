"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, MapPin, CreditCard, ChevronLeft, ChevronRight,
  Truck, Tag, Loader2, AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";

// Israeli cities for dropdown
const CITIES = [
  "תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה",
  "אשדוד", "נתניה", "באר שבע", "בני ברק", "חולון",
  "רמת גן", "אשקלון", "רחובות", "בת ים", "הרצליה",
  "כפר סבא", "מודיעין", "חדרה", "רעננה", "לוד",
  "נצרת", "עכו", "רמלה", "אילת", "קריית גת",
  "אחר",
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  street: string;
  apartment: string;
  zipCode: string;
  notes: string;
  couponCode: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, label: "פרטים אישיים", icon: User },
  { id: 2, label: "כתובת למשלוח", icon: MapPin },
  { id: 3, label: "סיכום ותשלום", icon: CreditCard },
];

export default function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, getShippingCost, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    street: "",
    apartment: "",
    zipCode: "",
    notes: "",
    couponCode: "",
    agreeToTerms: false,
  });

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal() - couponDiscount;

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Israeli phone validation: 05X-XXXXXXX or 05XXXXXXXX
  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/[-\s()]/g, "");
    return /^05\d{8}$/.test(cleaned);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!form.firstName.trim()) newErrors.firstName = "שם פרטי נדרש";
      if (!form.lastName.trim()) newErrors.lastName = "שם משפחה נדרש";
      if (!form.email.trim()) {
        newErrors.email = "אימייל נדרש";
      } else if (!isValidEmail(form.email)) {
        newErrors.email = "כתובת אימייל לא תקינה";
      }
      if (!form.phone.trim()) {
        newErrors.phone = "טלפון נדרש";
      } else if (!isValidPhone(form.phone)) {
        newErrors.phone = "מספר טלפון ישראלי לא תקין (05X-XXXXXXX)";
      }
    }

    if (currentStep === 2) {
      if (!form.city) newErrors.city = "עיר נדרשת";
      if (!form.street.trim()) newErrors.street = "רחוב נדרש";
    }

    if (currentStep === 3) {
      if (!form.agreeToTerms) newErrors.agreeToTerms = "יש לאשר את תנאי השימוש";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleApplyCoupon = async () => {
    if (!form.couponCode.trim()) return;
    setCouponError("");
    // TODO: Validate coupon via API
    // For now, simulate a 10% discount for code "SHIP10"
    if (form.couponCode.toUpperCase() === "SHIP10") {
      const discount = +(subtotal * 0.1).toFixed(2);
      setCouponDiscount(discount);
      setCouponApplied(true);
    } else {
      setCouponError("קוד קופון לא תקין");
      setCouponApplied(false);
      setCouponDiscount(0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          },
          shippingAddress: {
            city: form.city,
            street: form.street,
            apartment: form.apartment,
            zipCode: form.zipCode,
            notes: form.notes,
          },
          items: items.map((i) => ({
            productId: i.productId,
            titleHe: i.titleHe,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          couponCode: couponApplied ? form.couponCode : undefined,
          couponDiscount,
          subtotal,
          shippingCost: shipping,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה ביצירת ההזמנה");
      }

      // If payment URL is provided, redirect to Meshulam
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // Otherwise go to confirmation page
      clearCart();
      router.push(`/order-confirmation/${data.orderId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "שגיאה לא צפויה";
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isCompleted) setStep(s.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200 ${
                    isActive
                      ? "bg-coral text-white shadow-md"
                      : isCompleted
                        ? "bg-mint/15 text-mint cursor-pointer hover:bg-mint/25"
                        : "bg-cream text-charcoal-light"
                  }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronLeft size={16} className="text-charcoal-light/50" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Personal info */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <User size={20} className="text-coral" />
            פרטים אישיים
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">שם פרטי *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.firstName ? "border-coral bg-coral/5" : "border-cream-dark/30"
                } focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm`}
                placeholder="ישראל"
              />
              {errors.firstName && (
                <p className="text-coral text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">שם משפחה *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.lastName ? "border-coral bg-coral/5" : "border-cream-dark/30"
                } focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm`}
                placeholder="ישראלי"
              />
              {errors.lastName && (
                <p className="text-coral text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">אימייל *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.email ? "border-coral bg-coral/5" : "border-cream-dark/30"
              } focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm`}
              placeholder="israel@example.com"
              dir="ltr"
            />
            {errors.email && (
              <p className="text-coral text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">טלפון *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.phone ? "border-coral bg-coral/5" : "border-cream-dark/30"
              } focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm`}
              placeholder="050-1234567"
              dir="ltr"
            />
            {errors.phone && (
              <p className="text-coral text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.phone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Address */}
      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MapPin size={20} className="text-coral" />
            כתובת למשלוח
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">עיר *</label>
            <select
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.city ? "border-coral bg-coral/5" : "border-cream-dark/30"
              } focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm bg-white`}
            >
              <option value="">בחר עיר...</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="text-coral text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">רחוב ומספר *</label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => updateField("street", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.street ? "border-coral bg-coral/5" : "border-cream-dark/30"
              } focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm`}
              placeholder="הרצל 1"
            />
            {errors.street && (
              <p className="text-coral text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.street}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">דירה / קומה</label>
              <input
                type="text"
                value={form.apartment}
                onChange={(e) => updateField("apartment", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-dark/30
                          focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm"
                placeholder="דירה 5, קומה 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">מיקוד</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={(e) => updateField("zipCode", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-dark/30
                          focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm"
                placeholder="1234567"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">הערות למשלוח</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-cream-dark/30
                        focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm resize-none"
              rows={3}
              placeholder="הנחיות מיוחדות לשליח..."
            />
          </div>

          {/* Shipping estimate */}
          <div className="bg-teal/5 rounded-xl p-4 flex items-center gap-3">
            <Truck size={20} className="text-teal flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">משלוח סטנדרטי</span>
              <span className="text-charcoal-light"> — הגעה תוך 10-21 ימי עסקים</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Payment */}
      {step === 3 && (
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-coral" />
            סיכום ותשלום
          </h2>

          {/* Order items summary */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-cream text-charcoal-light text-xs font-bold w-6 h-6 rounded-lg
                                   flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="line-clamp-1">{item.titleHe}</span>
                </div>
                <span className="font-medium">₪{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Coupon code */}
          <div className="border-t border-cream-dark/30 pt-4">
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
              <Tag size={14} />
              קוד קופון
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.couponCode}
                onChange={(e) => {
                  updateField("couponCode", e.target.value);
                  setCouponError("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-cream-dark/30
                          focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm"
                placeholder="הזן קוד קופון"
                dir="ltr"
                disabled={couponApplied}
              />
              {couponApplied ? (
                <button
                  onClick={() => {
                    setCouponApplied(false);
                    setCouponDiscount(0);
                    updateField("couponCode", "");
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-coral hover:bg-coral/5
                            rounded-xl transition-colors"
                >
                  הסר
                </button>
              ) : (
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-teal text-white text-sm font-bold rounded-xl
                            hover:bg-teal-dark transition-colors"
                >
                  החל
                </button>
              )}
            </div>
            {couponError && (
              <p className="text-coral text-xs mt-1">{couponError}</p>
            )}
            {couponApplied && (
              <p className="text-mint text-xs mt-1 font-medium">
                ✓ קופון הוחל — חיסכון של ₪{couponDiscount.toFixed(0)}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-cream-dark/30 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-light">סה״כ מוצרים</span>
              <span>₪{subtotal.toFixed(0)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-mint">
                <span>הנחת קופון</span>
                <span>-₪{couponDiscount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-charcoal-light">משלוח</span>
              <span className={shipping === 0 ? "text-mint font-medium" : ""}>
                {shipping === 0 ? "חינם! 🎉" : `₪${shipping.toFixed(0)}`}
              </span>
            </div>
            <div className="border-t border-cream-dark/30 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-lg">סה״כ לתשלום</span>
              <span className="text-2xl font-extrabold text-coral">₪{total.toFixed(0)}</span>
            </div>
          </div>

          {/* Delivery summary */}
          <div className="bg-cream rounded-xl p-4 text-sm space-y-1">
            <p>
              <span className="font-medium">נשלח ל: </span>
              {form.firstName} {form.lastName}
            </p>
            <p className="text-charcoal-light">
              {form.street}, {form.city}
              {form.apartment ? ` • ${form.apartment}` : ""}
            </p>
            <p className="text-charcoal-light">{form.phone} • {form.email}</p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={(e) => updateField("agreeToTerms", e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-cream-dark/30 text-coral focus:ring-coral/30"
            />
            <span className="text-sm text-charcoal-light">
              אני מאשר/ת את{" "}
              <a href="/terms" className="text-teal hover:underline" target="_blank">
                תנאי השימוש
              </a>{" "}
              ו
              <a href="/privacy" className="text-teal hover:underline" target="_blank">
                מדיניות הפרטיות
              </a>
              .
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-coral text-xs flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.agreeToTerms}
            </p>
          )}

          {errors.submit && (
            <div className="bg-coral/10 text-coral rounded-xl p-3 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {errors.submit}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-charcoal-light
                      hover:text-charcoal rounded-xl hover:bg-cream transition-colors"
          >
            <ChevronRight size={16} />
            חזרה
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-1.5"
          >
            המשך
            <ChevronLeft size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                מעבד...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                בצע הזמנה — ₪{total.toFixed(0)}
              </>
            )}
          </button>
        )}
      </div>

      {/* Security note */}
      <p className="text-center text-xs text-charcoal-light">
        🔒 התשלום מאובטח בהצפנת SSL | כל הזכויות שמורות
      </p>
    </div>
  );
}
