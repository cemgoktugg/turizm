import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/admin/sales/print-button";
import { RoomLabels } from "@/components/admin/sales/room-labels";
import { getGuideView } from "@/lib/rooming-server";
import { getSettings } from "@/lib/settings";

// Görevli ekranından oda etiketleri (kapı / anahtar zarfı)
export const dynamic = "force-dynamic";
export const metadata = { title: "Oda Etiketleri", robots: { index: false, follow: false } };

export default async function GuideLabelsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [view, settings] = await Promise.all([getGuideView(token), getSettings()]);
  if (!view) notFound();

  return (
    <div className="min-h-dvh bg-cream-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link href={`/oda/${token}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <ArrowLeft className="size-4" /> Oda listesine dön
          </Link>
          <PrintButton label="Etiketleri yazdır" />
        </div>
        <RoomLabels brand={settings.siteName} tour={view.tour} rooms={view.rooms} people={view.people} />
      </div>
    </div>
  );
}
