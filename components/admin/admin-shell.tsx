"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BellRing,
  Building2,
  CalendarRange,
  ChartColumn,
  CirclePlay,
  Contact,
  ExternalLink,
  FileSearch,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Plane,
  Receipt,
  Settings,
  Tags,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: typeof Plane; exact?: boolean; badgeKey?: "leads" | "reviews" };

const NAV_GROUPS: { title?: string; items: NavItem[] }[] = [
  { items: [{ label: "Kontrol Paneli", href: "/admin", icon: LayoutDashboard, exact: true }] },
  {
    title: "Müşteri",
    items: [
      { label: "Başvurular", href: "/admin/leads", icon: Inbox, badgeKey: "leads" },
      { label: "Değerlendirmeler", href: "/admin/reviews", icon: MessageSquareQuote, badgeKey: "reviews" },
      { label: "Aboneler", href: "/admin/subscribers", icon: BellRing },
    ],
  },
  {
    title: "Katalog",
    items: [
      { label: "Turlar", href: "/admin/tours", icon: Plane },
      { label: "Kategoriler", href: "/admin/categories", icon: Tags },
      { label: "Oteller", href: "/admin/hotels", icon: Building2 },
    ],
  },
  {
    title: "İçerik",
    items: [
      { label: "Hikayeler", href: "/admin/stories", icon: CirclePlay },
      { label: "Sayfa İçerikleri", href: "/admin/content", icon: LayoutTemplate },
      { label: "Blog", href: "/admin/blog", icon: Newspaper },
      { label: "SEO Sayfaları", href: "/admin/landing", icon: FileSearch },
      { label: "Belgeler", href: "/admin/certificates", icon: Award },
      { label: "Medya", href: "/admin/media", icon: Images },
    ],
  },
  {
    title: "Satış",
    items: [
      { label: "Satışlar", href: "/admin/satis", icon: Receipt },
      { label: "Turlar", href: "/admin/satis/turlar", icon: CalendarRange },
      { label: "Müşteriler", href: "/admin/satis/musteriler", icon: Contact },
      { label: "Görevliler", href: "/admin/satis/gorevliler", icon: UserCheck },
      { label: "Raporlar", href: "/admin/satis/raporlar", icon: ChartColumn },
    ],
  },
  {
    title: "Sistem",
    items: [
      { label: "Site Ayarları", href: "/admin/settings", icon: Settings },
      { label: "Kullanıcılar", href: "/admin/users", icon: Users },
      { label: "Hesabım", href: "/admin/profile", icon: UserCog },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/admin": "Kontrol Paneli",
  "/admin/tours": "Turlar",
  "/admin/categories": "Kategoriler",
  "/admin/hotels": "Oteller",
  "/admin/blog": "Blog Yazıları",
  "/admin/stories": "Hikayeler",
  "/admin/content": "Sayfa İçerikleri",
  "/admin/media": "Medya Kütüphanesi",
  "/admin/leads": "Başvurular",
  "/admin/reviews": "Değerlendirmeler",
  "/admin/subscribers": "Kampanya Aboneleri",
  "/admin/landing": "SEO Sayfaları",
  "/admin/certificates": "Belgeler",
  "/admin/satis": "Satışlar",
  "/admin/satis/turlar": "Turlar (Satış)",
  "/admin/satis/musteriler": "Müşteriler",
  "/admin/satis/gorevliler": "Görevliler",
  "/admin/satis/raporlar": "Satış Raporları",
  "/admin/settings": "Site Ayarları",
  "/admin/users": "Kullanıcılar",
  "/admin/profile": "Hesabım",
};

export function AdminShell({
  user,
  brand,
  newLeads,
  pendingReviews,
  children,
}: {
  user: { name: string; email: string; mustChangePassword: boolean };
  brand: { siteName: string; logo: string };
  newLeads: number;
  pendingReviews: number;
  children: React.ReactNode;
}) {
  const badges = { leads: newLeads, reviews: pendingReviews };
  const badgeTitles = { leads: "yeni başvuru", reviews: "onay bekleyen değerlendirme" };
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const matches = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  // İç içe adreslerde (/admin/satis ve /admin/satis/turlar) yalnızca en uzun eşleşen öğe seçili görünür
  const activeHref = NAV_GROUPS.flatMap((g) => g.items)
    .filter((i) => matches(i.href, i.exact))
    .reduce<string | null>((best, i) => (!best || i.href.length > best.length ? i.href : best), null);
  const isActive = (href: string) => href === activeHref;

  let title = "Yönetim";
  for (const [key, val] of Object.entries(TITLES)) {
    if (pathname === key || pathname.startsWith(key + "/")) title = val;
  }

  const SidebarContent = (
    <>
      <Link href="/admin" className="flex flex-col gap-1.5 px-2 py-1" onClick={() => setOpen(false)} aria-label={brand.siteName}>
        <SmartImage src={brand.logo} alt={brand.siteName} className="h-11 w-auto max-w-full object-contain object-left" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">Yönetim Paneli</span>
      </Link>

      <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-cream-200/40">{group.title}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const badge = item.badgeKey && badges[item.badgeKey] > 0 ? badges[item.badgeKey] : null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-gold-400 text-brand-950" : "text-cream-200/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badge && (
                      <span
                        className={cn(
                          "min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold",
                          active ? "bg-brand-950 text-gold-300" : "bg-red-500 text-white",
                        )}
                        title={`${badge} ${item.badgeKey ? badgeTitles[item.badgeKey] : ""}`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream-200/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-5" /> Siteyi Görüntüle
        </a>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="size-5" /> Çıkış Yap
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-cream-100">
      {/* Masaüstü sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 p-4 lg:flex">{SidebarContent}</aside>

      {/* Mobil sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-brand-950/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-950 p-4 lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* İçerik */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative grid size-10 place-items-center rounded-xl border border-border text-brand-800 lg:hidden"
              aria-label="Menü"
            >
              <Menu className="size-5" />
              {newLeads > 0 && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            <h1 className="font-serif text-lg font-bold text-brand-900">{title}</h1>
          </div>
          <Link href="/admin/profile" className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-cream-100">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-brand-900">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {user.name.charAt(0).toLocaleUpperCase("tr")}
            </span>
          </Link>
        </header>

        {user.mustChangePassword && !pathname.startsWith("/admin/profile") && (
          <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-8">
            <AlertTriangle className="size-5 shrink-0" />
            <span className="flex-1">
              <strong>Güvenlik uyarısı:</strong> Hesabınız hâlâ ilk verilen şifreyle kullanılıyor. Lütfen şifrenizi değiştirin.
            </span>
            <Link href="/admin/profile" className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
              Şifreyi Değiştir
            </Link>
          </div>
        )}

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
