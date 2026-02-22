import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const features = [
  { icon: Truck, label: "משלוח לכל הארץ", desc: "ישירות עד הדלת" },
  { icon: ShieldCheck, label: "תשלום מאובטח", desc: "הצפנה מלאה" },
  { icon: RotateCcw, label: "החזרה קלה", desc: "30 יום להחזרה" },
  { icon: Headphones, label: "תמיכה בעברית", desc: "וואטסאפ + מייל" },
];

export default function TrustBar() {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="flex items-center gap-3 group cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center
                               flex-shrink-0 group-hover:bg-teal/20 transition-colors duration-300">
                  <Icon size={22} className="text-teal" />
                </div>
                <div>
                  <p className="font-bold text-sm text-charcoal">{feature.label}</p>
                  <p className="text-xs text-charcoal-light">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
