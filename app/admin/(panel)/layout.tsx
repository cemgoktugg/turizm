import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli", template: "%s | Yönetim Paneli" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // Çerez var ama geçersizse (şifre değişti / kullanıcı silindi) çerezi temizletip bilgilendir
    const hasCookie = (await cookies()).has(SESSION_COOKIE);
    redirect(hasCookie ? "/admin/login?expired=1" : "/admin/login");
  }

  const [settings, newLeads] = await Promise.all([
    getSettings(),
    prisma.lead.count({ where: { status: "Yeni" } }),
  ]);

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, mustChangePassword: user.mustChangePassword }}
      brand={{ siteName: settings.siteName, logo: settings.logo }}
      newLeads={newLeads}
    >
      {children}
    </AdminShell>
  );
}
