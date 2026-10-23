"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, Mail, Clock, ChevronDown, Menu, X, MessageCircle } from "lucide-react";
import { whatsappLink, telLink } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";
import type { ContentData } from "@/lib/content/registry";

type MenuContent = ContentData<"nav.header">;
type MenuItem = MenuContent["items"][number];

type Props = {
  siteName: string;
  /** Slogan — logonun üstündeki bilgi çubuğunda gösterilir */
  tagline: string;
  logo: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHours: string;
  menu: MenuContent;
  whatsappMessage: string;
  labels: { call: string; whatsapp: string };
};

/** Menü öğesi aktif mi? (ana sayfa yalnızca tam eşleşmede) */
function isActive(href: string, pathname: string) {
  const path = href.split("?")[0].split("#")[0];
  if (!path || path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

export function Navbar(props: Props) {
  const { siteName, tagline, logo, phone, whatsapp, email, workingHours, whatsappMessage, labels } = props;
  // Adı boş bırakılan menü öğeleri ve alt öğeler sitede gösterilmez
  const menu = {
    ...props.menu,
    items: props.menu.items
      .filter((i) => i.label.trim())
      .map((i) => ({ ...i, children: (i.children ?? []).filter((c) => c.label.trim()) })),
  };
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Üst bilgi çubuğu */}
      <div className="hidden bg-brand-900 text-cream-100 lg:block">
        <div className="container-tr relative flex h-10 items-center justify-between text-xs">
          {tagline && (
            <p className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap font-serif text-[13px] italic tracking-wide text-gold-300">
              <span className="h-px w-6 bg-gold-400/60" aria-hidden />
              {tagline}
              <span className="h-px w-6 bg-gold-400/60" aria-hidden />
            </p>
          )}
          <div className="flex items-center gap-6">
            <a href={telLink(phone)} className="flex items-center gap-2 transition-colors hover:text-gold-300">
              <Phone className="size-3.5" /> {phone}
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2 transition-colors hover:text-gold-300">
              <Mail className="size-3.5" /> {email}
            </a>
          </div>
          <div className="flex items-center gap-6">
            {workingHours && (
              <span className="flex items-center gap-2 text-cream-200/80">
                <Clock className="size-3.5" /> {workingHours}
              </span>
            )}
            {menu.topWhatsappLabel && (
              <a
                href={whatsappLink(whatsapp, whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-semibold text-gold-300 transition-colors hover:text-gold-200"
              >
                <MessageCircle className="size-3.5" /> {menu.topWhatsappLabel}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Ana navigasyon */}
      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled ? "border-border bg-white/95 shadow-soft backdrop-blur-md" : "border-transparent bg-white",
        )}
      >
        <div className="container-tr flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center" aria-label={siteName}>
            <SmartImage src={logo} alt={siteName} loading="eager" className="h-11 w-auto object-contain lg:h-14" />
          </Link>

          {/* Masaüstü menü */}
          <nav className="hidden items-center gap-0.5 xl:flex 2xl:gap-1">
            {menu.items.map((item, i) => (
              <NavLink key={`${item.href}-${i}`} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {menu.ctaLabel && menu.ctaHref && (
              <Link href={menu.ctaHref} className={cn(buttonVariants({ variant: "gold", size: "md" }), "hidden sm:inline-flex")}>
                {menu.ctaLabel}
              </Link>
            )}
            {/* Mobil menü aç/kapa */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="grid size-11 place-items-center rounded-xl border border-border text-brand-800 xl:hidden"
              aria-label="Menü"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil menü */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={menu.items}
        pathname={pathname}
        whatsapp={whatsapp}
        whatsappMessage={whatsappMessage}
        phone={phone}
        labels={labels}
      />
    </header>
  );
}

function NavLink({ item, pathname }: { item: MenuItem; pathname: string }) {
  const children = item.children ?? [];
  const active = isActive(item.href, pathname) || children.some((c) => isActive(c.href, pathname));

  if (!children.length) {
    return (
      <Link
        href={item.href || "/"}
        className={cn(
          "whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors 2xl:px-4",
          active ? "bg-brand-50 text-brand-800" : "text-brand-800/80 hover:bg-brand-50 hover:text-brand-800",
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href || children[0].href}
        className={cn(
          "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors 2xl:px-4",
          active ? "bg-brand-50 text-brand-800" : "text-brand-800/80 hover:bg-brand-50 hover:text-brand-800",
        )}
      >
        {item.label}
        <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-0 top-full pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="w-72 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-card">
          {children.map((c, i) => (
            <Link key={`${c.href}-${i}`} href={c.href || "/"} className="block rounded-xl px-4 py-2.5 transition-colors hover:bg-cream-100">
              <span className="block text-sm font-semibold text-brand-900">{c.label}</span>
              {c.desc && <span className="mt-0.5 block text-xs text-muted">{c.desc}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  items,
  pathname,
  whatsapp,
  whatsappMessage,
  phone,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  pathname: string;
  whatsapp: string;
  whatsappMessage: string;
  phone: string;
  labels: { call: string; whatsapp: string };
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 top-16 z-40 bg-brand-950/40 backdrop-blur-sm xl:hidden"
          />
          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-16 z-50 flex h-[calc(100dvh-4rem)] w-[86%] max-w-sm flex-col overflow-y-auto border-l border-border bg-white p-4 xl:hidden"
          >
            <div className="flex-1 space-y-1">
              {items.map((item, i) => {
                const children = item.children ?? [];
                if (!children.length) {
                  return (
                    <Link
                      key={i}
                      href={item.href || "/"}
                      onClick={onClose}
                      className={cn(
                        "block rounded-xl px-4 py-3 font-semibold",
                        isActive(item.href, pathname) ? "bg-brand-50 text-brand-800" : "text-brand-900",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                }
                const isExp = expanded === i;
                return (
                  <div key={i} className="rounded-xl">
                    <button
                      type="button"
                      onClick={() => setExpanded(isExp ? null : i)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-semibold text-brand-900"
                    >
                      {item.label}
                      <ChevronDown className={cn("size-4 transition-transform", isExp && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-0.5 pb-2 pl-3">
                            {children.map((c, j) => (
                              <Link
                                key={j}
                                href={c.href || "/"}
                                onClick={onClose}
                                className="block rounded-lg px-4 py-2.5 text-sm text-brand-700 hover:bg-cream-100"
                              >
                                {c.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
              <a href={telLink(phone)} className={buttonVariants({ variant: "outline", size: "md" })}>
                <Phone className="size-4" /> {labels.call}
              </a>
              <a
                href={whatsappLink(whatsapp, whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "whatsapp", size: "md" })}
              >
                <MessageCircle className="size-4" /> {labels.whatsapp}
              </a>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
