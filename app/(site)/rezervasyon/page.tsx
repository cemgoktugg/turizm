import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Clock, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTourOptions } from "@/lib/queries";
import { getSettings, whatsappLink } from "@/lib/settings";
import { PageHero } from "@/components/site/page-hero";
import { BookingForm } from "@/components/site/booking-form";

export const metadata: Metadata = {
  title: "Rezervasyon",
  description:
    "Hac, umre veya kültür turu rezervasyon talebinizi oluşturun. Danışmanlarımız en kısa sürede sizinle iletişime geçsin.",
  alternates: { canonical: "/rezervasyon" },
};

export default async function RezervasyonPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string }>;
}) {
  const { tur } = await searchParams;

  const [tourOptions, settings] = await Promise.all([
    getTourOptions(),
    getSettings(),
  ]);

  const selected = tur
    ? await prisma.tour.findFirst({
        where: { slug: tur, isPublished: true },
        select: { id: true, title: true },
      })
    : null;

  const benefits = [
    { icon: ShieldCheck, text: "Yetkili acenta güvencesi ve sözleşmeli hizmet" },
    { icon: CheckCircle2, text: "Şeffaf fiyat, gizli ücret yok" },
    { icon: Clock, text: "24 saat içinde geri dönüş" },
  ];

  return (
    <>
      <PageHero
        title="Rezervasyon Talebi"
        description="Aşağıdaki formu doldurarak rezervasyon talebinizi iletebilirsiniz. Ödeme öncesi danışmanlarımız sizi arayarak tüm detayları paylaşır."
        image="/images/hero-1.svg"
        crumbs={[{ label: "Rezervasyon" }]}
      />

      <section className="py-16 lg:py-20">
        <div className="container-tr grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <div>
            {selected ? (
              <BookingForm tourId={selected.id} tourTitle={selected.title} />
            ) : (
              <BookingForm tourOptions={tourOptions} />
            )}
          </div>

          {/* Yan bilgi */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-cream-50 p-6">
              <h3 className="font-serif text-lg font-bold text-brand-900">
                Neden bizimle rezervasyon?
              </h3>
              <ul className="mt-4 space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-brand-800">
                    <b.icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-brand-900 p-6 text-white">
              <h3 className="font-serif text-lg font-bold">Hemen bilgi alın</h3>
              <p className="mt-2 text-sm text-cream-100/80">
                Formu doldurmak istemiyorsanız, WhatsApp üzerinden de bize
                ulaşabilirsiniz.
              </p>
              <a
                href={whatsappLink(settings.whatsapp, "Merhaba, rezervasyon için bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1eb955]"
              >
                <MessageCircle className="size-4" /> WhatsApp'tan Yazın
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
