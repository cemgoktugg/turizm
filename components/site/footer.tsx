import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";
import { whatsappLink, telLink } from "@/lib/settings";
import { SmartImage } from "@/components/ui/smart-image";
import { SocialIcon, type SocialName } from "@/components/site/social-icon";
import type { ContentData } from "@/lib/content/registry";
import { CookieSettingsButton } from "@/components/site/analytics";
import { NewsletterForm } from "@/components/site/newsletter-form";

const SOCIALS: { key: SocialName; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "telegram", label: "Telegram" },
];

export function Footer({
  settings,
  content,
  whatsappMessage,
  legalLinks,
  cookieSettingsLabel,
  newsletter,
}: {
  settings: SiteSettings;
  content: ContentData<"nav.footer">;
  whatsappMessage: string;
  /** KVKK, çerez politikası, iptal/iade */
  legalLinks: { href: string; label: string }[];
  /** Ölçüm araçları açıksa "Çerez tercihleri" bağlantısı */
  cookieSettingsLabel: string | null;
  /** Kampanya kayıt kutusu (başlığı boşsa gösterilmez) */
  newsletter: { texts: ContentData<"shared.newsletter">; consentText: string } | null;
}) {
  // Mevzuat gereği şirket bilgileri (boş olanlar gösterilmez)
  const companyInfo = [
    settings.companyTitle,
    settings.tursabNo && `${content.tursabLabel}: ${settings.tursabNo}`,
    settings.mersisNo && `${content.mersisLabel}: ${settings.mersisNo}`,
    settings.taxInfo && `${content.taxLabel}: ${settings.taxInfo}`,
  ].filter(Boolean);
  const socials = SOCIALS.map((s) => ({ ...s, href: settings[s.key] })).filter((s) => s.href);
  // Adı boş bırakılan bağlantılar / sütunlar sitede gösterilmez
  const columns = content.columns
    .map((c) => ({ ...c, links: c.links.filter((l) => l.label.trim()) }))
    .filter((c) => c.title || c.links.length);

  return (
    <footer className="bg-brand-950 text-cream-200">
      {/* CTA şeridi */}
      <div className="border-b border-white/10">
        <div className="container-tr flex flex-col items-center justify-between gap-6 py-10 text-center md:flex-row md:text-left">
          <div>
            <h3 className="font-serif text-2xl font-bold text-white">{content.ctaTitle}</h3>
            {content.ctaText && <p className="mt-2 text-sm text-cream-200/70">{content.ctaText}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {content.reservationButton && (
              <Link
                href="/rezervasyon"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gold-400 px-7 text-sm font-semibold text-brand-950 shadow-gold transition hover:bg-gold-300"
              >
                {content.reservationButton}
              </Link>
            )}
            {content.whatsappButton && (
              <a
                href={whatsappLink(settings.whatsapp, whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <MessageCircle className="size-4" /> {content.whatsappButton}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Ana footer */}
      <div className="container-tr grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        {/* Marka */}
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex" aria-label={settings.siteName}>
            <SmartImage
              src={settings.logoLight || settings.logo}
              alt={settings.siteName}
              className="h-16 w-auto object-contain"
            />
          </Link>
          {settings.tagline && <p className="mt-3 font-serif text-lg italic text-gold-300">{settings.tagline}</p>}
          {settings.footerNote && (
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-200/70">{settings.footerNote}</p>
          )}

          <ul className="mt-6 space-y-3 text-sm">
            {settings.address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" />
                <span className="text-cream-200/80">{settings.address}</span>
              </li>
            )}
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
            {settings.workingHours && (
              <li className="flex items-center gap-3 text-cream-200/80">
                <Clock className="size-4 shrink-0 text-gold-400" /> {settings.workingHours}
              </li>
            )}
          </ul>

          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(({ href, key, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-cream-200 transition hover:border-gold-400 hover:bg-gold-400 hover:text-brand-950"
                >
                  <SocialIcon name={key} className="size-4.5" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Bağlantı sütunları */}
        {columns.map((col, i) => (
          <div key={i}>
            <h4 className="font-serif text-base font-bold text-white">{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l, j) => (
                <li key={j}>
                  <Link href={l.href || "/"} className="text-cream-200/70 transition hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Kampanya kayıt kutusu */}
      {newsletter && (
        <div className="container-tr pb-12">
          <NewsletterForm texts={newsletter.texts} consentText={newsletter.consentText} />
        </div>
      )}

      {/* Güven rozetleri */}
      {content.trustBadges.length > 0 && (
        <div className="border-t border-white/10">
          <div className="container-tr flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6 text-xs font-semibold uppercase tracking-wider text-cream-200/50">
            {content.trustBadges.map((badge, i) => (
              <span key={i} className="flex items-center gap-8">
                {i > 0 && <span className="text-gold-400">•</span>}
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Telif, yasal bağlantılar ve şirket bilgileri */}
      <div className="border-t border-white/10 bg-brand-950">
        <div className="container-tr flex flex-col gap-3 py-5 text-xs text-cream-200/50">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p>
              © {new Date().getFullYear()} {settings.siteName}. {content.copyrightText}
            </p>
            <nav aria-label="Yasal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {legalLinks.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-gold-300">
                  {l.label}
                </Link>
              ))}
              {cookieSettingsLabel && <CookieSettingsButton label={cookieSettingsLabel} />}
            </nav>
          </div>
          {(companyInfo.length > 0 || content.bottomNote) && (
            <p className="text-center text-cream-200/40 sm:text-left">
              {companyInfo.join(" · ")}
              {content.bottomNote && <>{companyInfo.length > 0 && " · "}{content.bottomNote}</>}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
