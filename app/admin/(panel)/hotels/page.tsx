import { Star } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { EditLink, DeleteButton, FlagToggle, ViewLink } from "@/components/admin/row-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { parseImages } from "@/lib/utils";
import { deleteHotel, toggleHotelFlag } from "@/app/actions/hotels";

export const metadata = { title: "Oteller" };

export default async function AdminHotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ sehir?: string; q?: string }>;
}) {
  const { sehir = "", q = "" } = await searchParams;
  const city = sehir === "Mekke" || sehir === "Medine" ? sehir : "";
  const term = q.trim();
  const where: Prisma.HotelWhereInput = {
    ...(city ? { city } : {}),
    ...(term ? { OR: [{ name: { contains: term } }, { region: { contains: term } }] } : {}),
  };

  const [hotels, all, mekke, medine] = await Promise.all([
    prisma.hotel.findMany({ where, orderBy: [{ city: "asc" }, { stars: "desc" }, { name: "asc" }] }),
    prisma.hotel.count(),
    prisma.hotel.count({ where: { city: "Mekke" } }),
    prisma.hotel.count({ where: { city: "Medine" } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Oteller"
        description="Oteller Mekke / Medine sayfalarında ve ana sayfada gösterilir; tur formunda otel önerisi olarak da çıkar."
        actionLabel="Yeni Otel"
        actionHref="/admin/hotels/new"
      />

      <ListToolbar
        basePath="/admin/hotels"
        tabParam="sehir"
        tabs={[
          { value: "", label: "Tümü", count: all },
          { value: "Mekke", label: "Mekke", count: mekke },
          { value: "Medine", label: "Medine", count: medine },
        ]}
        activeTab={city}
        query={term}
        searchPlaceholder="Otel veya bölge ara..."
      />

      {hotels.length === 0 ? (
        <EmptyState title="Otel bulunamadı" actionLabel="Yeni Otel" actionHref="/admin/hotels/new" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Otel</th>
                  <th className="px-4 py-3 font-semibold">Şehir</th>
                  <th className="px-4 py-3 font-semibold">Mesafe</th>
                  <th className="px-4 py-3 font-semibold">Görsel</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hotels.map((h) => {
                  const images = parseImages(h.images);
                  return (
                    <tr key={h.id} className="hover:bg-cream-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                            <SmartImage src={images[0]} alt={h.name} className="size-full" />
                          </span>
                          <div>
                            <p className="font-semibold text-brand-900">{h.name}</p>
                            <p className="flex items-center gap-0.5">
                              {Array.from({ length: h.stars ?? 0 }).map((_, i) => (
                                <Star key={i} className="size-3 fill-gold-400 text-gold-400" />
                              ))}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={h.city === "Mekke" ? "gold" : "brand"} size="sm">
                          {h.city}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-brand-800">{h.distance || "—"}</td>
                      <td className="px-4 py-3 text-brand-800">{images.length}</td>
                      <td className="px-4 py-3">
                        <FlagToggle action={toggleHotelFlag} id={h.id} field="isPublished" value={h.isPublished} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ViewLink href={h.city === "Mekke" ? "/oteller/mekke" : "/oteller/medine"} disabled={!h.isPublished} />
                          <EditLink href={`/admin/hotels/${h.id}/edit`} />
                          <DeleteButton action={deleteHotel} id={h.id} label="Bu oteli silmek istediğinize emin misiniz?" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
