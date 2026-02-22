import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-coral/90 via-coral to-coral-dark" />

      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl" />
        {/* Floating package icons */}
        <div className="absolute top-1/4 left-[15%] text-white/10 text-6xl rotate-12">📦</div>
        <div className="absolute bottom-1/4 right-[20%] text-white/10 text-5xl -rotate-6">🛍️</div>
        <div className="absolute top-1/3 right-[10%] text-white/10 text-4xl rotate-45">✨</div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm
                        text-white text-sm font-medium px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            מבצעי השבוע כבר כאן! 🎉
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            מוצרים שווים
            <br />
            <span className="text-accent">במחירים שלא תאמינו</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 max-w-lg mx-auto leading-relaxed">
            אלפי מוצרים מגניבים מכל העולם, עם משלוח ישירות אלייך.
            החבר שלך לקניות חכמות 🚀
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/category/gadgets"
              className="bg-white text-coral font-bold py-3.5 px-8 rounded-xl
                       hover:bg-cream hover:shadow-xl transition-all duration-300
                       hover:-translate-y-0.5 text-lg"
            >
              בואו לגלות 🔥
            </Link>
            <Link
              href="/category/electronics"
              className="border-2 border-white/40 text-white font-bold py-3.5 px-8 rounded-xl
                       hover:bg-white/10 transition-all duration-300 text-lg"
            >
              מוצרים חמים
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 pt-4 text-white/60 text-sm">
            <span>⭐ 4.8 דירוג ממוצע</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span>🛒 10,000+ הזמנות</span>
            <span className="w-1 h-1 bg-white/30 rounded-full hidden sm:block" />
            <span className="hidden sm:inline">🚚 משלוח חינם מ-₪199</span>
          </div>
        </div>
      </div>
    </section>
  );
}
