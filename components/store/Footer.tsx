import Link from "next/link";
import ShipMateLogo from "@/components/icons/ShipMateLogo";
import { Package, Shield, RotateCcw, MessageCircle } from "lucide-react";

const footerLinks = {
  shop: {
    title: "חנות",
    links: [
      { href: "/category/electronics", label: "אלקטרוניקה" },
      { href: "/category/fashion", label: "אופנה" },
      { href: "/category/home", label: "בית וגן" },
      { href: "/category/beauty", label: "יופי וטיפוח" },
      { href: "/category/kids", label: "ילדים" },
      { href: "/category/gadgets", label: "גאדג׳טים" },
    ],
  },
  info: {
    title: "מידע",
    links: [
      { href: "/about", label: "אודות ShipMate" },
      { href: "/shipping", label: "מדיניות משלוחים" },
      { href: "/returns", label: "החזרות והחלפות" },
      { href: "/privacy", label: "מדיניות פרטיות" },
      { href: "/terms", label: "תנאי שימוש" },
      { href: "/contact", label: "צור קשר" },
    ],
  },
};

const trustFeatures = [
  { icon: Package, label: "משלוח לכל הארץ" },
  { icon: Shield, label: "תשלום מאובטח" },
  { icon: RotateCcw, label: "החזרה קלה" },
  { icon: MessageCircle, label: "תמיכה בעברית" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/80 pb-20 lg:pb-0">
      {/* Trust bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-3 justify-center">
                  <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-coral" />
                  </div>
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <ShipMateLogo color="white" size="md" />
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              שיפמייט — החבר שלך לקניות חכמות. מוצרים מגניבים מכל העולם,
              במחירים שלא תאמינו, עם משלוח ישירות אלייך.
            </p>
            <div className="flex gap-3 pt-2">
              {/* Social links */}
              {[
                { name: "facebook", href: "https://www.facebook.com/profile.php?id=61575641187310" },
                { name: "instagram", href: "#" },
                { name: "tiktok", href: "#" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.href !== "#" ? "_blank" : undefined}
                  rel={social.href !== "#" ? "noopener noreferrer" : undefined}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-coral/30
                           flex items-center justify-center transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="text-xs font-bold uppercase">{social.name[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-white text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-coral transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40">
            © 2026 ShipMate | שיפמייט. כל הזכויות שמורות.
          </p>
          <div className="flex gap-4">
            {/* Payment method icons — text placeholders */}
            {["Visa", "Mastercard", "PayPal", "Bit"].map((method) => (
              <span key={method} className="text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
