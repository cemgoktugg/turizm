import { CheckCircle2, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { activeTourWhere, getTourOptions } from "@/lib/queries";
import { getSettings, whatsappLink } from "@/lib/settings";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { BookingForm } from "@/components/site/booking-form";

export const generateMetadata = () => pageMetadata("page.rezervasyon");

export default async function RezervasyonPage({ searchParams }: { searchParams: Promise<{ tur?: string }> }) {
  const { tur } = await searchParams;

  const [tourOptions, settings, c, booking, wa, selected] = await Promise.all([
    getTourOptions(),
    getSettings(),
    getContent("page.rezervasyon"),
    getContent("shared.booking"),
    getContent("ui.whatsapp"),
    tur
      ? prisma.tour.findFirst({ where: activeTourWhere({ slug: tur }), select: { id: true, title: true } })
      : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      <section className="py-16 lg:py-20">
        <div className="container-tr grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <div>
            {selected ? (
              <BookingForm tourId={selected.id} tourTitle={selected.title} source="rezervasyon" texts={booking} />
            ) : (
              <BookingForm tourOptions={tourOptions} source="rezervasyon" texts={booking} />
            )}
          </div>

          {/* Yan bilgi */}
          <aside className="space-y-4">
            {c.benefits.length > 0 && (
              <div className="rounded-3xl border border-border bg-cream-50 p-6">
                <h3 className="font-serif text-lg font-bold text-brand-900">{c.benefitsTitle}</h3>
                <ul className="mt-4 space-y-3">
                  {c.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-brand-800">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-3xl border border-border bg-brand-900 p-6 text-white">
              <h3 className="font-serif text-lg font-bold">{c.whatsappTitle}</h3>
              <p className="mt-2 text-sm text-cream-100/80">{c.whatsappText}</p>
              <a
                href={whatsappLink(settings.whatsapp, wa.reservation)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1eb955]"
              >
                <MessageCircle className="size-4" /> {c.whatsappButton}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
