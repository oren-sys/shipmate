import type { Metadata } from "next";
import { Heebo, Nunito } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "ShipMate | שיפמייט - החבר שלך לקניות חכמות",
  description: "מוצרים שווים במחירים שלא תאמינו. משלוח לכל הארץ.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${nunito.variable}`}>
      <body className="font-heebo bg-cream text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
