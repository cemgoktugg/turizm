import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton, MobileBottomBar } from "@/components/site/floating-actions";
import { getSettings } from "@/lib/settings";
import { getContent } from "@/lib/content";

// Sayfalar her istekte canlı veritabanından üretilir: panel değişiklikleri ve
// tarihi geçen turlar anında yansır; sunucuya yeni sürüm gönderildiğinde
// derleme anındaki eski içerik görünmez. (SQLite aynı sunucuda, sorgular çok hızlı.)
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, header, footer, ui, wa] = await Promise.all([
    getSettings(),
    getContent("nav.header"),
    getContent("nav.footer"),
    getContent("ui.general"),
    getContent("ui.whatsapp"),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        siteName={settings.siteName}
        logo={settings.logo}
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        email={settings.email}
        workingHours={settings.workingHours}
        menu={header}
        whatsappMessage={wa.general}
        labels={{ call: ui.mobileCall, whatsapp: ui.mobileWhatsapp }}
      />
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <Footer settings={settings} content={footer} whatsappMessage={wa.general} />
      <WhatsAppButton whatsapp={settings.whatsapp} message={wa.floating} />
      <MobileBottomBar
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        message={wa.general}
        labels={{ call: ui.mobileCall, whatsapp: ui.mobileWhatsapp, reservation: ui.mobileReservation }}
      />
    </div>
  );
}
