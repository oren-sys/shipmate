"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "promo-bar-dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION_MS) {
        // Still within the 24-hour dismiss window
        setVisible(false);
        return;
      }
      // 24 hours have passed — clear and show again
      localStorage.removeItem(DISMISS_KEY);
    }
    setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-teal text-white text-center py-2 px-4 text-sm font-medium relative">
      <p className="font-heebo">
        🚚 משלוח חינם בהזמנה מעל ₪199! | קוד קופון: <span className="font-bold">WELCOME15</span> — 15% הנחה להזמנה ראשונה
      </p>
      <button
        onClick={handleDismiss}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="סגור"
      >
        <X size={14} />
      </button>
    </div>
  );
}
