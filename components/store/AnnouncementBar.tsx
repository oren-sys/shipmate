"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-teal text-white text-center py-2 px-4 text-sm font-medium relative">
      <p className="font-heebo">
        🚚 משלוח חינם בהזמנה מעל ₪199! | קוד קופון: <span className="font-bold">WELCOME15</span> — 15% הנחה להזמנה ראשונה
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="סגור"
      >
        <X size={14} />
      </button>
    </div>
  );
}
