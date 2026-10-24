import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton, MobileBottomBar } from "@/components/site/floating-actions";
import { Analytics } from "@/components/site/analytics";
import { getSettings } from "@/lib/settings";
import { getContent } from "@/lib/content";

// Sayfalar her istekte canlı veritabanından üretilir: panel değişiklikleri ve
// tarihi geçen turlar anında yansır; sunucuya yeni sürüm gönderildiğinde
// derleme anındaki eski içerik görünmez. (SQLite aynı sunucuda, sorgular çok hızlı.)
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, header, footer, ui, wa, cookies, kvkk, cookiePolicy, cancellation] = await Promise.all([
    getSettings(),
    getContent("nav.header"),
    getContent("nav.footer"),
    getContent("ui.general"),
    getContent("ui.whatsapp"),
    getContent("ui.cookies"),
    getContent("legal.kvkk"),
    getContent("legal.cookies"),
    getContent("legal.cancellation"),
  ]);
  const analyticsEnabled = Boolean(settings.gaId || settings.metaPixelId);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        siteName={settings.siteName}
        tagline={settings.tagline}
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
      <Footer
        settings={settings}
        content={footer}
        whatsappMessage={wa.general}
        legalLinks={[
          { href: "/kvkk", label: kvkk.title },
          { href: "/cerez-politikasi", label: cookiePolicy.title },
          { href: "/iptal-ve-iade", label: cancellation.title },
        ]}
        cookieSettingsLabel={analyticsEnabled ? cookies.settingsLabel : null}
      />
      <Analytics gaId={settings.gaId} pixelId={settings.metaPixelId} texts={cookies} />
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
