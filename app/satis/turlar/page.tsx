import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { EditLink, DeleteButton } from "@/components/admin/row-actions";
import { FilterBar, th, td, num, theadRow, qs } from "@/components/admin/sales/ui";
import { ToggleButton } from "@/components/admin/sales/toggle-button";
import { SeatBar } from "@/components/admin/sales/seat-hint";
import { deleteServiceTour, toggleServiceTour } from "@/app/actions/sales";
import { getPeriods, money, shortDate } from "@/lib/sales";
import { cn } from "@/lib/utils";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Turlar (Satış)" };

export default async function ServiceToursPage({ searchParams }: { searchParams: Promise<{ donem?: string; q?: string }> }) {
  const base = await getSalesBase();
  const { donem = "", q = "" } = await searchParams;
  const term = q.trim();
  const where: Prisma.ServiceTourWhereInput = {
    ...(donem ? { period: donem } : {}),
    ...(term ? { OR: [{ name: { contains: term } }, { accommodation: { contains: term } }] } : {}),
  };
  const [periods, tours] = await Promise.all([
    getPeriods(),
    prisma.serviceTour.findMany({
      where,
      orderBy: [{ departureDate: "desc" }, { id: "desc" }],
      include: {
        guide1: { select: { fullName: true } },
        guide2: { select: { fullName: true } },
        _count: { select: { sales: { where: { isCancelled: false } } } },
      },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Turlar"
        description="Satışı yapılan tur hizmetleri. Pasif turlar yeni satışta listelenmez, kontenjanı dolan turlar seçilemez."
        actionLabel="Yeni Tur"
        actionHref={`${base}/turlar/yeni`}
      />
      <FilterBar action={`${base}/turlar`} periods={periods} donem={donem} q={q} searchPlaceholder="Tur adı veya konaklama..." />

      {tours.length === 0 ? (
        <EmptyState title="Tur bulunamadı" actionLabel="Yeni Tur" actionHref={`${base}/turlar/yeni`} />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>No</th>
                  <th className={th}>Tur Adı</th>
                  <th className={th}>Dönem</th>
                  <th className={th}>Gidiş – Dönüş</th>
                  <th className={cn(th, "text-center")}>Gün</th>
                  <th className={cn(th, num)}>Kişi Başı (2 / 3 / 4)</th>
                  <th className={th}>Görevliler</th>
                  <th className={cn(th, "text-center")} title="İptal edilmemiş satış / kontenjan">
                    Doluluk
                  </th>
                  <th className={th}>Durum</th>
                  <th className={cn(th, "text-right")}>İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tours.map((t) => (
                  <tr key={t.id} className="hover:bg-cream-50/60">
                    <td className={td}>{t.id}</td>
                    <td className={cn(td, "font-semibold text-brand-900")}>
                      <Link href={`${base}/turlar/${t.id}`} className="hover:text-brand-600">
                        {t.name}
                      </Link>
                      {t.accommodation && <p className="text-xs font-normal text-muted">{t.accommodation}</p>}
                    </td>
                    <td className={td}>{t.period}</td>
                    <td className={td}>
                      {shortDate(t.departureDate)} – {shortDate(t.returnDate)}
                    </td>
                    <td className={cn(td, "text-center")}>{t.days}</td>
                    <td className={cn(td, num)}>
                      {[t.price2, t.price3, t.price4].map((p) => (p == null ? "—" : money(p, t.currency))).join(" / ")}
                    </td>
                    <td className={td}>{[t.guide1.fullName, t.guide2?.fullName].filter(Boolean).join(", ")}</td>
                    <td className={cn(td, "text-center")}>
                      <Link href={`${base}${qs({ donem: t.period, q: t.name })}`} className="font-semibold text-brand-700 hover:text-gold-600">
                        {t._count.sales}
                        {t.capacity != null && <span className="font-normal text-muted"> / {t.capacity}</span>}
                      </Link>
                      {t.capacity != null && <SeatBar capacity={t.capacity} sold={t._count.sales} />}
                    </td>
                    <td className={td}>
                      <ToggleButton
                        action={toggleServiceTour}
                        id={t.id}
                        on={t.isActive}
                        labels={{ on: "Aktif", off: "Pasif" }}
                        titles={{ on: "Pasif yapmak için tıklayın", off: "Aktif yapmak için tıklayın" }}
                      />
                    </td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-2">
                        <EditLink href={`${base}/turlar/${t.id}`} />
                        <DeleteButton action={deleteServiceTour} id={String(t.id)} label="Bu turu silmek istediğinize emin misiniz?" />
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
