import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminCard } from "@/components/admin/ui";
import { CustomerForm } from "@/components/admin/sales/customer-form";
import { BackLink, StatBox, th, td, num, theadRow } from "@/components/admin/sales/ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { loadSales, money, moneyList, shortDate, totalsOf } from "@/lib/sales";
import { cn } from "@/lib/utils";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Müşteri" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const base = await getSalesBase();
  const { id } = await params;
  const customerId = Number(id);
  const customer = Number.isInteger(customerId) ? await prisma.customer.findUnique({ where: { id: customerId } }) : null;
  if (!customer) notFound();
  const sales = await loadSales({ customerId: customer.id });
  const totals = totalsOf(sales);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href={`${base}/musteriler`} label="Müşterilere Dön" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl font-bold text-brand-900">
            <span className="text-muted">#{customer.id}</span> {customer.fullName}
          </h2>
          <Link href={`${base}/yeni?musteri=${customer.id}`} className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" /> Bu Müşteriye Satış
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label="Toplam ücret" value={moneyList(totals.price)} />
        <StatBox label="Ödenen" value={moneyList(totals.paid)} tone="green" />
        <StatBox label="Bakiye" value={moneyList(totals.balance)} tone={Object.values(totals.balance).some((v) => v > 0) ? "red" : "green"} />
      </div>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">Satışlar</h3>
        </div>
        {sales.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">Bu müşteriye henüz satış yapılmadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Sıra No</th>
                  <th className={th}>Tarih</th>
                  <th className={th}>Dönem</th>
                  <th className={th}>Tur</th>
                  <th className={cn(th, num)}>Ücret</th>
                  <th className={cn(th, num)}>Ödenen</th>
                  <th className={cn(th, num)}>Kalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((s) => (
                  <tr key={s.id} className={cn("hover:bg-cream-50/60", s.isCancelled && "text-muted line-through decoration-slate-300")}>
                    <td className={td}>
                      <Link href={`${base}/${s.id}`} className="font-bold text-brand-700 hover:text-gold-600">
                        {s.id}
                      </Link>
                      {s.isCancelled && (
                        <Badge variant="slate" size="sm" className="ml-2">
                          İptal
                        </Badge>
                      )}
                    </td>
                    <td className={td}>{shortDate(s.date)}</td>
                    <td className={td}>{s.tour.period}</td>
                    <td className={td}>{s.tour.name}</td>
                    <td className={cn(td, num)}>{money(s.price, s.currency)}</td>
                    <td className={cn(td, num, "text-green-700")}>{money(s.paid, s.currency)}</td>
                    <td className={cn(td, num, "font-semibold", s.balance > 0 ? "text-red-600" : "text-green-700")}>{money(s.balance, s.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <CustomerForm
        customerId={customer.id}
        defaultValues={{ fullName: customer.fullName, tc: customer.tc ?? "", phone: customer.phone ?? "", note: customer.note ?? "" }}
      />
    </div>
  );
}
