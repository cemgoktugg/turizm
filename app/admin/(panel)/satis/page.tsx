import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { FilterBar, StatBox, th, td, num, theadRow, qs } from "@/components/admin/sales/ui";
import { Badge } from "@/components/ui/badge";
import { buildSaleWhere, getPeriods, loadSales, money, moneyList, shortDate, totalsOf } from "@/lib/sales";
import { cn } from "@/lib/utils";

export const metadata = { title: "Satışlar" };

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ donem?: string; q?: string }> }) {
  const { donem = "", q = "" } = await searchParams;
  const [periods, sales, tourCount] = await Promise.all([getPeriods(), loadSales(buildSaleWhere({ donem, q })), prisma.serviceTour.count()]);
  const totals = totalsOf(sales);

  return (
    <div>
      <AdminPageHeader
        title="Satışlar"
        description="Tur kayıtları ve alacak durumu. Ödenen ve kalan tutarlar tahsilatlardan hesaplanır."
        actionLabel="Yeni Satış"
        actionHref="/admin/satis/yeni"
      />

      <FilterBar
        action="/admin/satis"
        periods={periods}
        donem={donem}
        q={q}
        searchPlaceholder="Müşteri, T.C., telefon, tur, referans veya satış no..."
        exportHref={`/api/admin/satis/export${qs({ rapor: "satislar", donem, q })}`}
      />

      {sales.length === 0 ? (
        tourCount === 0 ? (
          <EmptyState
            title="Henüz tur tanımlanmamış"
            description="Satış yapabilmek için önce görevli ve tur ekleyin."
            actionLabel="Tur Ekle"
            actionHref="/admin/satis/turlar/yeni"
          />
        ) : (
          <EmptyState title="Satış bulunamadı" actionLabel="Yeni Satış" actionHref="/admin/satis/yeni" />
        )
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Satış adedi" value={String(totals.count)} />
            <StatBox label="Toplam ücret" value={moneyList(totals.price)} />
            <StatBox label="Tahsil edilen" value={moneyList(totals.paid)} tone="green" />
            <StatBox label="Kalan alacak" value={moneyList(totals.balance)} tone="red" />
          </div>

          <AdminCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>Sıra No</th>
                    <th className={th}>Tarih</th>
                    <th className={th}>Dönem</th>
                    <th className={th}>Tur ID</th>
                    <th className={th}>Tur Adı</th>
                    <th className={th}>Müşteri ID</th>
                    <th className={th}>Müşteri Adı</th>
                    <th className={th}>Açıklama</th>
                    <th className={th}>Referans</th>
                    <th className={cn(th, "text-center")}>Oda Kişi</th>
                    <th className={cn(th, num)}>Ücret</th>
                    <th className={cn(th, num)}>Ödenen</th>
                    <th className={cn(th, num)}>Kalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map((s) => (
                    <tr key={s.id} className={cn("hover:bg-cream-50/60", s.isCancelled && "text-muted line-through decoration-slate-300")}>
                      <td className={td}>
                        <Link href={`/admin/satis/${s.id}`} className="font-bold text-brand-700 hover:text-gold-600">
                          {s.id}
                        </Link>
                      </td>
                      <td className={td}>{shortDate(s.date)}</td>
                      <td className={td}>{s.tour.period}</td>
                      <td className={td}>{s.tour.id}</td>
                      <td className={cn(td, "max-w-56 truncate")} title={s.tour.name}>
                        {s.tour.name}
                      </td>
                      <td className={td}>{s.customer.id}</td>
                      <td className={td}>
                        <Link href={`/admin/satis/${s.id}`} className="font-semibold text-brand-900 hover:text-brand-600">
                          {s.customer.fullName}
                        </Link>
                        {s.isCancelled && (
                          <Badge variant="slate" size="sm" className="ml-2 no-underline">
                            İptal
                          </Badge>
                        )}
                      </td>
                      <td className={cn(td, "max-w-48 truncate")} title={s.note ?? undefined}>
                        {s.note}
                      </td>
                      <td className={td}>{s.reference}</td>
                      <td className={cn(td, "text-center")}>{s.roomSize ?? ""}</td>
                      <td className={cn(td, num)}>{money(s.price, s.currency)}</td>
                      <td className={cn(td, num, "text-green-700")}>{money(s.paid, s.currency)}</td>
                      <td className={cn(td, num, "font-semibold", s.balance > 0 ? "text-red-600" : "text-green-700")}>
                        {money(s.balance, s.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-cream-50 font-bold text-brand-900">
                    <td className={td} colSpan={10}>
                      Toplam ({totals.count} satış{sales.length > totals.count ? `, ${sales.length - totals.count} iptal hariç` : ""})
                    </td>
                    <td className={cn(td, num)}>{moneyList(totals.price)}</td>
                    <td className={cn(td, num, "text-green-700")}>{moneyList(totals.paid)}</td>
                    <td className={cn(td, num, "text-red-600")}>{moneyList(totals.balance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
}
