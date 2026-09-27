import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton, MobileBottomBar } from "@/components/site/floating-actions";
import { getSettings } from "@/lib/settings";
import { getContent } from "@/lib/content";

// Admin değişiklikleri anında yansır (revalidatePath). Ayrıca tarihi geçen
// turların listelerden düşmesi için sayfalar en geç saatte bir yenilenir.
export const revalidate = 3600;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, footer] = await Promise.all([getSettings(), getContent("shared.footer")]);

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
      />
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <Footer settings={settings} content={footer} />
      <WhatsAppButton whatsapp={settings.whatsapp} />
      <MobileBottomBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
