import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, requireOwnPassword, SESSION_COOKIE } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { canManageSite } from "@/lib/roles";
import { SalesShell } from "@/components/admin/sales/sales-shell";

/*
 * Satış Programı (/satis): satış ve alacak takibi ekranları, yönetim panelinden
 * ayrı bir çerçevede. Aynı sayfalar geçiş dönemi için /admin/satis altında da
 * açılır (bkz. app/admin/(panel)/satis ve lib/sales-base.ts).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Satış Programı", template: "%s | Satış Programı" },
  robots: { index: false, follow: false },
  // Bilgisayara / telefona uygulama olarak kurulabilir (tarayıcı: "Uygulamayı yükle" / "Ana ekrana ekle").
  // Bildirim dosyası /satis dışında durur: tarayıcı onu oturum çerezi olmadan ister.
  manifest: "/satis.webmanifest",
  appleWebApp: { capable: true, title: "Satış", statusBarStyle: "black" },
  icons: { icon: "/images/satis-app-192.png", apple: "/images/satis-app-192.png" },
};

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // Çerez var ama geçersizse (şifre değişti / kullanıcı silindi) çerezi temizletip bilgilendir
    const hasCookie = (await cookies()).has(SESSION_COOKIE);
    redirect(hasCookie ? "/admin/login?expired=1&next=/satis" : "/admin/login?next=/satis");
  }
  // Geçici şifreyle giren kullanıcı önce kendi şifresini belirler
  await requireOwnPassword(user, "/satis/hesabim");
  const settings = await getSettings();

  return (
    <SalesShell
      user={{ name: user.name, email: user.email, mustChangePassword: user.mustChangePassword, canManageSite: canManageSite(user.role) }}
      brand={{ siteName: settings.siteName, logo: settings.logoLight || settings.logo }}
    >
      {children}
    </SalesShell>
  );
}
