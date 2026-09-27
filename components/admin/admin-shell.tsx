"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Plane,
  Building2,
  Newspaper,
  Inbox,
  Award,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Panel", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Turlar", href: "/admin/tours", icon: Plane },
  { label: "Oteller", href: "/admin/hotels", icon: Building2 },
  { label: "Blog", href: "/admin/blog", icon: Newspaper },
  { label: "Başvurular", href: "/admin/leads", icon: Inbox },
  { label: "Belgeler", href: "/admin/certificates", icon: Award },
  { label: "Ayarlar", href: "/admin/settings", icon: Settings },
];

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = (
    <>
      <Link href="/admin" className="flex items-center gap-3 px-2 py-1">
        <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-brand-800">
          <SmartImage src="/images/logo-mark.svg" alt="Logo" className="size-full" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-serif text-base font-bold text-white">Rotamız Huzura</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
            Yönetim Paneli
          </span>
        </span>
      </Link>

      <nav className="mt-6 flex-1 space-y-1">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gold-400 text-brand-950"
                  : "text-cream-200/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream-200/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-5" /> Siteyi Görüntüle
        </Link>
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
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 p-4 lg:flex">
        {SidebarContent}
      </aside>

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
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-950 p-4 lg:hidden"
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
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-border text-brand-800 lg:hidden"
              aria-label="Menü"
            >
              <Menu className="size-5" />
            </button>
            <PageTitle pathname={pathname} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-brand-900">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function PageTitle({ pathname }: { pathname: string }) {
  const map: Record<string, string> = {
    "/admin": "Kontrol Paneli",
    "/admin/tours": "Turlar",
    "/admin/hotels": "Oteller",
    "/admin/blog": "Blog Yazıları",
    "/admin/leads": "Başvurular",
    "/admin/certificates": "Belgeler",
    "/admin/settings": "Site Ayarları",
  };
  let title = "Yönetim";
  for (const [key, val] of Object.entries(map)) {
    if (pathname === key || pathname.startsWith(key + "/")) title = val;
  }
  return <h1 className="font-serif text-lg font-bold text-brand-900">{title}</h1>;
}
