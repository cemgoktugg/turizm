"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, CalendarRange, ChartColumn, Contact, LayoutDashboard, LogOut, Plus, Receipt, UserCheck, UsersRound, Wallet } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { SmartImage } from "@/components/ui/smart-image";
import { InstallButton } from "./install-button";
import { SALES_BASE } from "@/lib/sales-base";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Satışlar", href: SALES_BASE, icon: Receipt },
  { label: "Gruplar", href: `${SALES_BASE}/gruplar`, icon: UsersRound },
  { label: "Turlar", href: `${SALES_BASE}/turlar`, icon: CalendarRange },
  { label: "Müşteriler", href: `${SALES_BASE}/musteriler`, icon: Contact },
  { label: "Görevliler", href: `${SALES_BASE}/gorevliler`, icon: UserCheck },
  { label: "Kasa", href: `${SALES_BASE}/kasa`, icon: Wallet },
  { label: "Raporlar", href: `${SALES_BASE}/raporlar`, icon: ChartColumn },
];

const PROFILE_HREF = `${SALES_BASE}/hesabim`;

/**
 * Satış Programı çerçevesi: yönetim panelinden ayrı, yalnızca satış ekranları.
 * Satış personeli (SALES) yalnızca burayı görür; site yetkisi olanlar üstteki
 * bağlantıyla yönetim paneline geçebilir.
 */
export function SalesShell({
  user,
  brand,
  children,
}: {
  user: { name: string; email: string; mustChangePassword: boolean; canManageSite: boolean };
  brand: { siteName: string; logo: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const matches = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // /satis/turlar hem "Satışlar" hem "Turlar" ile eşleşir; en uzun eşleşen seçili görünür
  const activeHref = TABS.filter((t) => matches(t.href)).reduce<string | null>(
    (best, t) => (!best || t.href.length > best.length ? t.href : best),
    null,
  );

  return (
    <div className="min-h-dvh bg-cream-100 print:min-h-0 print:bg-white">
      {/* Yazdırırken (ör. makbuz) yalnızca sayfa içeriği basılır */}
      <div className="sticky top-0 z-30 shadow-sm print:hidden">
        <header className="flex h-14 items-center gap-3 bg-brand-950 px-4 lg:px-8">
          <Link href={SALES_BASE} className="flex min-w-0 items-center gap-3" aria-label={`${brand.siteName} Satış Programı`}>
            <SmartImage src={brand.logo} alt={brand.siteName} loading="eager" className="h-8 w-auto max-w-28 object-contain object-left" />
            <span className="hidden border-l border-white/15 pl-3 text-xs font-bold uppercase tracking-widest text-gold-400 sm:inline">
              Satış Programı
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link
              href={`${SALES_BASE}?panel=yeni`}
              scroll={false}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gold-400 px-3 text-sm font-bold text-brand-950 transition hover:bg-gold-300 sm:px-4"
            >
              <Plus className="size-4" /> <span>Yeni Satış</span>
            </Link>
            <InstallButton />
            {user.canManageSite && (
              <Link
                href="/admin"
                className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-cream-200/80 transition hover:bg-white/10 hover:text-white md:inline-flex"
                title="Site içeriği ve diğer yönetim ekranları"
              >
                <LayoutDashboard className="size-4" /> Yönetim Paneli
              </Link>
            )}
            <Link
              href={PROFILE_HREF}
              className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-white/10"
              title={`${user.name} · ${user.email} — Hesabım`}
            >
              <span className="hidden text-sm font-semibold text-white lg:inline">{user.name}</span>
              <span className="grid size-8 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {user.name.charAt(0).toLocaleUpperCase("tr")}
              </span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="grid size-9 place-items-center rounded-xl text-red-300 transition hover:bg-red-500/15"
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-white px-2 lg:px-6" aria-label="Satış Programı">
          {TABS.map((t) => {
            const active = t.href === activeHref;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                  active ? "border-gold-500 text-brand-900" : "border-transparent text-muted hover:text-brand-800",
                )}
              >
                <t.icon className="size-4" /> {t.label}
              </Link>
            );
          })}
          {user.canManageSite && (
            <Link href="/admin" className="flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold text-muted hover:text-brand-800 md:hidden">
              <LayoutDashboard className="size-4" /> Yönetim Paneli
            </Link>
          )}
        </nav>
      </div>

      {user.mustChangePassword && !pathname.startsWith(PROFILE_HREF) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-8 print:hidden">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="flex-1">
            <strong>Güvenlik uyarısı:</strong> Hesabınız hâlâ ilk verilen şifreyle kullanılıyor. Lütfen şifrenizi değiştirin.
          </span>
          <Link href={PROFILE_HREF} className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
            Şifreyi Değiştir
          </Link>
        </div>
      )}

      <main className="p-4 lg:p-8 print:p-0">{children}</main>
    </div>
  );
}
