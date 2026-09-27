"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  Mail,
  Clock,
  ChevronDown,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { NAV } from "@/lib/constants";
import { whatsappLink, telLink } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  siteName: string;
  tagline: string;
  logo: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHours: string;
};

export function Navbar(props: Props) {
  const { siteName, tagline, logo, phone, whatsapp, email, workingHours } = props;
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
        <div className="container-tr flex h-10 items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <a href={telLink(phone)} className="flex items-center gap-2 transition-colors hover:text-gold-300">
              <Phone className="size-3.5" /> {phone}
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2 transition-colors hover:text-gold-300">
              <Mail className="size-3.5" /> {email}
            </a>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-cream-200/80">
              <Clock className="size-3.5" /> {workingHours}
            </span>
            <a
              href={whatsappLink(whatsapp, "Merhaba, bilgi almak istiyorum.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-gold-300 transition-colors hover:text-gold-200"
            >
              <MessageCircle className="size-3.5" /> WhatsApp Hattı
            </a>
          </div>
        </div>
      </div>

      {/* Ana navigasyon */}
      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled
            ? "border-border bg-white/95 shadow-soft backdrop-blur-md"
            : "border-transparent bg-white",
        )}
      >
        <div className="container-tr flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center overflow-hidden rounded-xl bg-brand-800 shadow-soft lg:size-12">
              <SmartImage src={logo} alt={siteName} className="size-full" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-bold text-brand-900 lg:text-xl">
                {siteName}
              </span>
              <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
                {tagline}
              </span>
            </span>
          </Link>

          {/* Masaüstü menü */}
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/rezervasyon"
              className={cn(buttonVariants({ variant: "gold", size: "md" }), "hidden sm:inline-flex")}
            >
              Rezervasyon
            </Link>
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
        pathname={pathname}
        whatsapp={whatsapp}
        phone={phone}
      />
    </header>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof NAV)[number];
  pathname: string;
}) {
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          active
            ? "bg-brand-50 text-brand-800"
            : "text-brand-800/80 hover:bg-brand-50 hover:text-brand-800",
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button
        className={cn(
          "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          active
            ? "bg-brand-50 text-brand-800"
            : "text-brand-800/80 hover:bg-brand-50 hover:text-brand-800",
        )}
      >
        {item.label}
        <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="w-72 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-card">
          {item.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block rounded-xl px-4 py-2.5 transition-colors hover:bg-cream-100"
            >
              <span className="block text-sm font-semibold text-brand-900">
                {c.label}
              </span>
              {c.desc && (
                <span className="mt-0.5 block text-xs text-muted">{c.desc}</span>
              )}
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
  pathname,
  whatsapp,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  whatsapp: string;
  phone: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

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
              {NAV.map((item) => {
                const isExp = expanded === item.href;
                if (!item.children) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "block rounded-xl px-4 py-3 font-semibold",
                        pathname === item.href
                          ? "bg-brand-50 text-brand-800"
                          : "text-brand-900",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <div key={item.href} className="rounded-xl">
                    <button
                      onClick={() => setExpanded(isExp ? null : item.href)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-semibold text-brand-900"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn("size-4 transition-transform", isExp && "rotate-180")}
                      />
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
                            {item.children.map((c) => (
                              <Link
                                key={c.href}
                                href={c.href}
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
              <a
                href={telLink(phone)}
                className={buttonVariants({ variant: "outline", size: "md" })}
              >
                <Phone className="size-4" /> Ara
              </a>
              <a
                href={whatsappLink(whatsapp, "Merhaba, bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "whatsapp", size: "md" })}
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
