import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { getSettings, whatsappLink, telLink } from "@/lib/settings";
import { getTourOptions } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { BookingForm } from "@/components/site/booking-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Bize ulaşın. Telefon, WhatsApp, e-posta ve adres bilgilerimiz. Hac ve umre programları için danışmanlarımız hazır.",
  alternates: { canonical: "/iletisim" },
};

export default async function IletisimPage() {
  const [settings, tourOptions] = await Promise.all([
    getSettings(),
    getTourOptions(),
  ]);

  const cards = [
    { icon: Phone, title: "Telefon", value: settings.phone, href: telLink(settings.phone) },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "Hemen yazın",
      href: whatsappLink(settings.whatsapp, "Merhaba, bilgi almak istiyorum."),
    },
    { icon: Mail, title: "E-posta", value: settings.email, href: `mailto:${settings.email}` },
    { icon: Clock, title: "Çalışma Saatleri", value: settings.workingHours },
  ];

  return (
    <>
      <PageHero
        title="İletişim"
        description="Sorularınız, önerileriniz ve rezervasyon talepleriniz için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız."
        image="/images/hero-3.svg"
        crumbs={[{ label: "İletişim" }]}
      />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {/* İletişim kartları */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => {
              const inner = (
                <div className="flex h-full flex-col items-center rounded-3xl border border-border bg-white p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <c.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-serif text-base font-bold text-brand-900">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted">{c.value}</p>
                </div>
              );
              return (
                <Reveal key={c.title} delay={i}>
                  {c.href ? (
                    <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block h-full">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </Reveal>
              );
            })}
          </div>

          {/* Form + adres/harita */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                className="mb-6"
                eyebrow="Bize Yazın"
                title="Mesaj Gönderin"
                description="Formu doldurun, en kısa sürede size dönüş yapalım."
              />
              <BookingForm tourOptions={tourOptions} />
            </div>

            <div>
              <div className="rounded-3xl border border-border bg-white p-6 shadow-soft">
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-900">
                  <MapPin className="size-5 text-gold-500" /> Adresimiz
                </h3>
                <p className="mt-2 text-sm text-muted">{settings.address}</p>
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-border shadow-soft">
                {settings.mapEmbed ? (
                  <iframe
                    src={settings.mapEmbed}
                    title="Konum"
                    className="h-[360px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="grid h-[360px] place-items-center bg-cream-100 text-sm text-muted">
                    Harita bilgisi henüz eklenmemiş.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
