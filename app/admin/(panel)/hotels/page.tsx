import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { EditLink, DeleteButton } from "@/components/admin/row-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { parseImages } from "@/lib/utils";
import { deleteHotel } from "@/app/actions/hotels";

export const metadata = { title: "Oteller" };
export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const hotels = await prisma.hotel.findMany({ orderBy: [{ city: "asc" }, { stars: "desc" }] });

  return (
    <div>
      <AdminPageHeader
        title="Oteller"
        description={`Toplam ${hotels.length} otel`}
        actionLabel="Yeni Otel"
        actionHref="/admin/hotels/new"
      />

      {hotels.length === 0 ? (
        <EmptyState title="Henüz otel eklenmemiş" actionLabel="Yeni Otel" actionHref="/admin/hotels/new" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Otel</th>
                  <th className="px-4 py-3 font-semibold">Şehir</th>
                  <th className="px-4 py-3 font-semibold">Mesafe</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hotels.map((h) => (
                  <tr key={h.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                          <SmartImage src={parseImages(h.images)[0]} alt={h.name} className="size-full" />
                        </span>
                        <div>
                          <p className="font-semibold text-brand-900">{h.name}</p>
                          <p className="flex items-center gap-0.5 text-xs text-gold-500">
                            {Array.from({ length: h.stars ?? 0 }).map((_, i) => (
                              <Star key={i} className="size-3 fill-gold-400 text-gold-400" />
                            ))}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={h.city === "Mekke" ? "gold" : "brand"} size="sm">{h.city}</Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-800">{h.distance || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={h.isPublished ? "green" : "slate"} size="sm">
                        {h.isPublished ? "Yayında" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <EditLink href={`/admin/hotels/${h.id}/edit`} />
                        <DeleteButton action={deleteHotel} id={h.id} label="Bu oteli silmek istediğinize emin misiniz?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
