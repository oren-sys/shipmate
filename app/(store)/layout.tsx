import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import MobileNav from "@/components/store/MobileNav";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import CartDrawer from "@/components/store/CartDrawer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}
