import { notFound } from "next/navigation";
import { GuideRooms } from "@/components/guide/guide-rooms";
import { SmartImage } from "@/components/ui/smart-image";
import { getGuideView } from "@/lib/rooming-server";
import { shortDate } from "@/lib/sales";
import { getSettings } from "@/lib/settings";

// Görevli ekranı: giriş yok, gizli bağlantı (ServiceTour.guideToken). Arama motorlarına kapalı.
export const dynamic = "force-dynamic";
export const metadata = { title: "Oda Listesi", robots: { index: false, follow: false } };

export default async function GuideRoomsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [view, settings] = await Promise.all([getGuideView(token), getSettings()]);
  if (!view) notFound();
  const { tour, rooms, people } = view;

  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="bg-brand-950 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <SmartImage src={settings.logoLight || settings.logo} alt={settings.siteName} loading="eager" className="h-8 w-auto max-w-24 object-contain object-left" />
          <div className="min-w-0 border-l border-white/15 pl-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold-400">Oda Listesi · Görevli</p>
            <h1 className="truncate font-serif text-lg font-bold">{tour.name}</h1>
            <p className="truncate text-xs text-cream-200/80">
              {shortDate(tour.departureDate)} – {shortDate(tour.returnDate)} · {tour.days} gün
              {tour.accommodation ? ` · ${tour.accommodation}` : ""}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-10">
        <GuideRooms token={token} rooms={rooms} people={people} />
      </main>
    </div>
  );
}
