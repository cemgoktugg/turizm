import Link from "next/link";
import { Download } from "lucide-react";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { StatBox, th, td, num, theadRow, qs } from "@/components/admin/sales/ui";
import { getKasa, getKasaMovements, money, moneyList, shortDate } from "@/lib/sales";
import { getSalesBase } from "@/lib/sales-base-server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kasa" };

const exportHref = "/api/admin/satis/export?rapor=kasa";

export default async function CashPage() {
  const [base, kasa, movements] = await Promise.all([getSalesBase(), getKasa(), getKasaMovements(50)]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kasa"
        description="Alınan her ödeme (nakit, havale, kredi kartı) kaydedildiği an kasaya girer; iadeler düşülür. Parayı kimin aldığı makbuzda ve Raporlar › Personel'de görünür."
      />

      {kasa.rows.length === 0 ? (
        <EmptyState title="Henüz tahsilat yok" description="Satışlara girilen tahsilatlar burada kasaya eklenir." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatBox label="Kasadaki toplam" value={moneyList(kasa.total)} tone="green" />
            <StatBox label="Bugün giren" value={moneyList(kasa.today)} />
            <StatBox label="Bu ay giren" value={moneyList(kasa.month)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kasa.methods.map((m) => (
              <StatBox key={m} label={m} value={moneyList(kasa.byMethod[m])} />
            ))}
            {Object.keys(kasa.refunded).length > 0 && <StatBox label="Yapılan iade" value={moneyList(kasa.refunded)} tone="red" />}
          </div>

          <AdminCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-serif text-lg font-bold text-brand-900">Ödeme Şekline Göre</h3>
              <a href={exportHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-gold-600">
                <Download className="size-4" /> Excel
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>Ödeme Şekli</th>
                    <th className={th}>Para Birimi</th>
                    <th className={cn(th, "text-center")}>Tahsilat Adedi</th>
                    <th className={cn(th, num)}>Alınan</th>
                    <th className={cn(th, num)}>İade</th>
                    <th className={cn(th, num)}>Kasada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kasa.rows.map((r) => (
                    <tr key={`${r.method}|${r.currency}`} className="hover:bg-cream-50/60">
                      <td className={cn(td, "font-semibold")}>{r.method}</td>
                      <td className={td}>{r.currency}</td>
                      <td className={cn(td, "text-center")}>{r.count}</td>
                      <td className={cn(td, num)}>{money(r.collected, r.currency)}</td>
                      <td className={cn(td, num, r.refunded > 0 && "text-red-600")}>{money(r.refunded, r.currency)}</td>
                      <td className={cn(td, num, "font-bold text-green-700")}>{money(r.net, r.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-cream-50 font-bold text-brand-900">
                    <td className={td} colSpan={5}>
                      Kasadaki toplam
                    </td>
                    <td className={cn(td, num, "text-green-700")}>{moneyList(kasa.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
              <h3 className="font-serif text-lg font-bold text-brand-900">Son Kasa Hareketleri</h3>
              <Link href={`${base}/raporlar${qs({ rapor: "tahsilat" })}`} className="text-sm font-semibold text-brand-800 hover:text-gold-600">
                Tarihe göre tüm liste: Raporlar › Tahsilat Listesi
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className={theadRow}>
                    <th className={th}>Tarih</th>
                    <th className={th}>Satış No</th>
                    <th className={th}>Müşteri</th>
                    <th className={th}>Tur</th>
                    <th className={th}>Ödeme Şekli</th>
                    <th className={th}>Parayı Alan / Veren</th>
                    <th className={cn(th, num)}>Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map((p) => (
                    <tr key={p.id} className="hover:bg-cream-50/60">
                      <td className={td}>{shortDate(p.date)}</td>
                      <td className={td}>
                        <Link href={`${base}${qs({ panel: String(p.sale.id) })}`} className="font-bold text-brand-700 hover:text-gold-600">
                          {p.sale.id}
                        </Link>
                      </td>
                      <td className={cn(td, "font-semibold")}>{p.sale.customer.fullName}</td>
                      <td className={cn(td, "max-w-56 truncate")} title={p.sale.tour.name}>
                        {p.sale.tour.name}
                      </td>
                      <td className={td}>{p.method}</td>
                      <td className={td}>{p.receivedByName ?? "—"}</td>
                      <td className={cn(td, num, "font-semibold", p.amount < 0 ? "text-red-600" : "text-green-700")}>
                        {p.amount < 0 ? `İade ${money(-p.amount, p.sale.tour.currency)}` : `+${money(p.amount, p.sale.tour.currency)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
}
