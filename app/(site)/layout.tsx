import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton, MobileBottomBar } from "@/components/site/floating-actions";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

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
      <Footer settings={settings} />
      <WhatsAppButton whatsapp={settings.whatsapp} />
      <MobileBottomBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
