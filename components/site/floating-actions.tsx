"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, CalendarCheck } from "lucide-react";
import { whatsappLink, telLink } from "@/lib/settings";

/** Sağ altta yüzen WhatsApp butonu (masaüstü + mobil) */
export function WhatsAppButton({ whatsapp, message }: { whatsapp: string; message: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappLink(whatsapp, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp'tan yazın"
      className={`fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-900/20 transition-all duration-300 hover:scale-105 md:bottom-6 md:right-6 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25D366] opacity-30" />
      <MessageCircle className="size-7" />
    </a>
  );
}

/** Mobilde alt sabit iletişim çubuğu */
export function MobileBottomBar({
  phone,
  whatsapp,
  message,
  labels,
}: {
  phone: string;
  whatsapp: string;
  message: string;
  labels: { call: string; whatsapp: string; reservation: string };
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
      <a href={telLink(phone)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-brand-800">
        <Phone className="size-5" /> {labels.call}
      </a>
      <a
        href={whatsappLink(whatsapp, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1 border-x border-border py-2.5 text-[11px] font-semibold text-[#1eb955]"
      >
        <MessageCircle className="size-5" /> {labels.whatsapp}
      </a>
      <Link href="/rezervasyon" className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-gold-700">
        <CalendarCheck className="size-5" /> {labels.reservation}
      </Link>
    </nav>
  );
}
