import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { EditLink, DeleteButton, FlagToggle, DuplicateButton, ViewLink } from "@/components/admin/row-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, formatPrice } from "@/lib/utils";
import { activeTourWhere, isPastTour, startOfToday } from "@/lib/queries";
import { deleteTour, duplicateTour, toggleTourFlag } from "@/app/actions/tours";

export const metadata = { title: "Turlar" };

const FILTERS: Record<string, { label: string; where: () => Prisma.TourWhereInput }> = {
  "": { label: "Tümü", where: () => ({}) },
  aktif: { label: "Sitede listelenen", where: () => activeTourWhere() },
  gecmis: { label: "Tarihi geçen", where: () => ({ departureDate: { lt: startOfToday() } }) },
  taslak: { label: "Taslak", where: () => ({ isPublished: false }) },
  one: { label: "Öne çıkan", where: () => ({ isFeatured: true }) },
};

export default async function AdminToursPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; q?: string }>;
}) {
  const { filtre = "", q = "" } = await searchParams;
  const filter = FILTERS[filtre] ? filtre : "";
  const term = q.trim();

  const where: Prisma.TourWhereInput = {
    AND: [FILTERS[filter].where(), term ? { OR: [{ title: { contains: term } }, { slug: { contains: term } }] } : {}],
  };

  const [tours, counts] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: { category: true, _count: { select: { leads: true } } },
      orderBy: [{ departureDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    Promise.all(Object.entries(FILTERS).map(async ([k, f]) => [k, await prisma.tour.count({ where: f.where() })] as const)),
  ]);
  const countMap = Object.fromEntries(counts);

  return (
    <div>
      <AdminPageHeader
        title="Turlar"
        description="Tarihi geçen turlar sitedeki listelerden otomatik kalkar. Yeni sezon için 'Kopyala' ile hızla yeni tur oluşturabilirsiniz."
        actionLabel="Yeni Tur"
        actionHref="/admin/tours/new"
      />

      <ListToolbar
        basePath="/admin/tours"
        tabs={Object.entries(FILTERS).map(([value, f]) => ({ value, label: f.label, count: countMap[value] }))}
        activeTab={filter}
        query={term}
        searchPlaceholder="Tur adı ara..."
      />

      {tours.length === 0 ? (
        <EmptyState
          title={term || filter ? "Sonuç bulunamadı" : "Henüz tur eklenmemiş"}
          description={term || filter ? "Filtreyi veya aramayı değiştirin." : "İlk turunuzu ekleyerek başlayın."}
          actionLabel="Yeni Tur"
          actionHref="/admin/tours/new"
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Tur</th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 font-semibold">Fiyat</th>
                  <th className="px-4 py-3 font-semibold">Başvuru</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tours.map((t) => {
                  const past = isPastTour(t.departureDate);
                  return (
                    <tr key={t.id} className="hover:bg-cream-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                            <SmartImage src={t.coverImage} alt={t.title} className="size-full" />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[280px] truncate font-semibold text-brand-900">{t.title}</p>
                            <Badge variant="cream" size="sm">{t.category?.name}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-brand-800">{formatDateRange(t.departureDate, t.returnDate) ?? "Açık tarih"}</p>
                        {past && <Badge variant="red" size="sm">Tarihi geçti</Badge>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-800">{formatPrice(t.startingPrice, t.currency)}</td>
                      <td className="px-4 py-3 text-brand-800">{t._count.leads}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <FlagToggle action={toggleTourFlag} id={t.id} field="isPublished" value={t.isPublished} />
                          <FlagToggle action={toggleTourFlag} id={t.id} field="isFeatured" value={t.isFeatured} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ViewLink href={`/turlar/${t.slug}`} disabled={!t.isPublished} />
                          <DuplicateButton action={duplicateTour} id={t.id} editBase="/admin/tours" />
                          <EditLink href={`/admin/tours/${t.id}/edit`} />
                          <DeleteButton action={deleteTour} id={t.id} label="Bu turu silmek istediğinize emin misiniz? Başvurular korunur." />
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
