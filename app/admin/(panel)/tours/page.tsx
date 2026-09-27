import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { EditLink, DeleteButton, FlagToggle } from "@/components/admin/row-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { deleteTour, toggleTourFlag } from "@/app/actions/tours";

export const metadata = { title: "Turlar" };
export const dynamic = "force-dynamic";

export default async function AdminToursPage() {
  const tours = await prisma.tour.findMany({
    include: { category: true, _count: { select: { leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminPageHeader
        title="Turlar"
        description={`Toplam ${tours.length} tur`}
        actionLabel="Yeni Tur"
        actionHref="/admin/tours/new"
      />

      {tours.length === 0 ? (
        <EmptyState
          title="Henüz tur eklenmemiş"
          description="İlk turunuzu ekleyerek başlayın."
          actionLabel="Yeni Tur"
          actionHref="/admin/tours/new"
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Tur</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Fiyat</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tours.map((t) => (
                  <tr key={t.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                          <SmartImage src={t.coverImage} alt={t.title} className="size-full" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-brand-900">{t.title}</p>
                          <p className="truncate text-xs text-muted">/{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="cream" size="sm">{t.category?.name}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-800">
                      {formatPrice(t.startingPrice, t.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <FlagToggle action={toggleTourFlag} id={t.id} field="isPublished" value={t.isPublished} />
                        <FlagToggle action={toggleTourFlag} id={t.id} field="isFeatured" value={t.isFeatured} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <EditLink href={`/admin/tours/${t.id}/edit`} />
                        <DeleteButton action={deleteTour} id={t.id} label="Bu turu silmek istediğinize emin misiniz?" />
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
