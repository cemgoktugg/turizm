import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";
import { whatsappLink, telLink } from "@/lib/settings";
import { SmartImage } from "@/components/ui/smart-image";
import { SocialIcon } from "@/components/site/social-icon";

const COLUMNS = [
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Gerekli Bilgiler", href: "/gerekli-bilgiler" },
      { label: "Blog", href: "/blog" },
      { label: "Rezervasyon", href: "/rezervasyon" },
    ],
  },
  {
    title: "Hac & Umre",
    links: [
      { label: "Hac Programları", href: "/hac/programlari" },
      { label: "Tüm Umre Turları", href: "/umre" },
      { label: "Lüks Umre", href: "/umre/luks-umre" },
      { label: "Ramazan Umresi", href: "/umre/ramazan-umresi" },
      { label: "Kesin Tarihli Turlar", href: "/umre/kesin-tarihli-turlar" },
    ],
  },
  {
    title: "Turlar & Oteller",
    links: [
      { label: "Tüm Turlar", href: "/turlar" },
      { label: "Kültür Turları", href: "/turlar?kategori=kultur-turlari" },
      { label: "Mekke Otelleri", href: "/oteller/mekke" },
      { label: "Medine Otelleri", href: "/oteller/medine" },
      { label: "Dua ve Vazifeler", href: "/umre/dua-ve-vazifeler" },
    ],
  },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  const socials = [
    { href: settings.facebook, name: "facebook" as const },
    { href: settings.instagram, name: "instagram" as const },
    { href: settings.youtube, name: "youtube" as const },
    { href: settings.twitter, name: "twitter" as const },
  ].filter((s) => s.href);

  return (
    <footer className="bg-brand-950 text-cream-200">
      {/* CTA şeridi */}
      <div className="border-b border-white/10">
        <div className="container-tr flex flex-col items-center justify-between gap-6 py-10 text-center md:flex-row md:text-left">
          <div>
            <h3 className="font-serif text-2xl font-bold text-white">
              Kutsal yolculuğunuz için hazır mısınız?
            </h3>
            <p className="mt-2 text-sm text-cream-200/70">
              Uzman danışmanlarımız size en uygun programı bulmak için hazır.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/rezervasyon"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gold-400 px-7 text-sm font-semibold text-brand-950 shadow-gold transition hover:bg-gold-300"
            >
              Rezervasyon Yap
            </Link>
            <a
              href={whatsappLink(settings.whatsapp, "Merhaba, bilgi almak istiyorum.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Ana footer */}
      <div className="container-tr grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        {/* Marka */}
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-12 place-items-center overflow-hidden rounded-xl bg-white/10">
              <SmartImage src={settings.logo} alt={settings.siteName} className="size-full" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-xl font-bold text-white">
                {settings.siteName}
              </span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">
                {settings.tagline}
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-200/70">
            {settings.footerNote ||
              "Yetkili acenta güvencesiyle hac, umre ve kültür turları düzenliyoruz."}
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" />
              <span className="text-cream-200/80">{settings.address}</span>
            </li>
            <li>
              <a href={telLink(settings.phone)} className="flex items-center gap-3 text-cream-200/80 transition hover:text-gold-300">
                <Phone className="size-4 shrink-0 text-gold-400" /> {settings.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-cream-200/80 transition hover:text-gold-300">
                <Mail className="size-4 shrink-0 text-gold-400" /> {settings.email}
              </a>
            </li>
            <li className="flex items-center gap-3 text-cream-200/80">
              <Clock className="size-4 shrink-0 text-gold-400" /> {settings.workingHours}
            </li>
          </ul>

          {socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socials.map(({ href, name }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-cream-200 transition hover:border-gold-400 hover:bg-gold-400 hover:text-brand-950"
                >
                  <SocialIcon name={name} className="size-4.5" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Bağlantı sütunları */}
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-serif text-base font-bold text-white">{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-cream-200/70 transition hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Güven rozetleri */}
      <div className="border-t border-white/10">
        <div className="container-tr flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6 text-xs font-semibold uppercase tracking-wider text-cream-200/50">
          <span>TÜRSAB A Grubu Belge</span>
          <span className="text-gold-400">•</span>
          <span>Diyanet Yetki Belgeli</span>
          <span className="text-gold-400">•</span>
          <span>IATA Üyesi</span>
          <span className="text-gold-400">•</span>
          <span>Güvenli Ödeme</span>
        </div>
      </div>

      {/* Telif */}
      <div className="border-t border-white/10 bg-brand-950">
        <div className="container-tr flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream-200/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.siteName}. Tüm hakları saklıdır.</p>
          <p>
            Bu bir demo projedir · SQLite &amp; Next.js ile geliştirilmiştir
          </p>
        </div>
      </div>
    </footer>
  );
}
