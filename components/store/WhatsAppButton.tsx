"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/972000000000?text=שלום! אשמח לעזרה"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 lg:bottom-6 left-4 z-50
                 w-14 h-14 bg-[#25D366] hover:bg-[#1EBE57]
                 rounded-2xl shadow-lg hover:shadow-xl
                 flex items-center justify-center
                 transition-all duration-300 hover:scale-110
                 group"
      aria-label="WhatsApp צור קשר"
    >
      <MessageCircle size={26} className="text-white" fill="white" />
      {/* Tooltip */}
      <span className="absolute right-16 bg-charcoal text-white text-xs py-2 px-3 rounded-xl
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200
                       whitespace-nowrap pointer-events-none font-heebo">
        צריכים עזרה? 💬
      </span>
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-2xl bg-[#25D366] animate-ping opacity-20" />
    </a>
  );
}
