import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/row-actions";
import { BackLink, StatBox, th, td, num, theadRow } from "@/components/admin/sales/ui";
import { PaymentForm } from "@/components/admin/sales/payment-form";
import { SaleCancelButton } from "@/components/admin/sales/sale-cancel-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deletePayment, deleteSale } from "@/app/actions/sales";
import { getActivityFor } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { getCashPeople, getSale, inputDate, money, shortDate } from "@/lib/sales";
import { cn, currencySymbol, formatDateTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Satış #${id}` };
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = Number.isInteger(Number(id)) ? await getSale(Number(id)) : null;
  if (!sale) notFound();
  const { tour, customer } = sale;
  const [activity, me, people] = await Promise.all([getActivityFor("Sale", sale.id), getCurrentUser(), getCashPeople()]);
  const isAdmin = me?.role === "ADMIN";

  const info: [string, React.ReactNode][] = [
    [
      "Müşteri",
      <Link key="c" href={`/admin/satis/musteriler/${customer.id}`} className="font-semibold text-brand-700 hover:text-gold-600">
        #{customer.id} {customer.fullName}
      </Link>,
    ],
    ["T.C. / Telefon", `${customer.tc} · ${customer.phone}`],
    [
      "Tur",
      <Link key="t" href={`/admin/satis/turlar/${tour.id}`} className="font-semibold text-brand-700 hover:text-gold-600">
        #{tour.id} {tour.name}
      </Link>,
    ],
    ["Dönem", tour.period],
    ["Gidiş – Dönüş", `${shortDate(tour.departureDate)} – ${shortDate(tour.returnDate)} (${tour.days} gün)`],
    ["Görevliler", [tour.guide1.fullName, tour.guide2?.fullName].filter(Boolean).join(", ")],
    ["Satış Tarihi", shortDate(sale.date)],
    ["Oda Kişi Sayısı", sale.roomSize ? `${sale.roomSize} kişilik oda` : "—"],
    ["Referans", sale.reference || "—"],
    ["Açıklama", sale.note || "—"],
    ["Kaydeden", `${sale.createdByName ?? "—"} · ${formatDateTime(sale.createdAt)}`],
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/satis" label="Satışlara Dön" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-3 font-serif text-2xl font-bold text-brand-900">
            Satış #{sale.id}
            {sale.isCancelled && <Badge variant="slate">İptal edildi</Badge>}
            {sale.refundDue > 0 && <Badge variant="amber">İade bekliyor</Badge>}
            {!sale.isCancelled && sale.balance <= 0 && <Badge variant="green">Ödendi</Badge>}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/satis/${sale.id}/duzenle`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="size-4" /> Düzenle
            </Link>
            <SaleCancelButton id={sale.id} isCancelled={sale.isCancelled} />
            {sale.payments.length === 0 && (
              <DeleteButton action={deleteSale} id={String(sale.id)} label="Bu satışı silmek istediğinize emin misiniz?" redirectTo="/admin/satis" />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label="Ücret" value={money(sale.price, sale.currency)} />
        <StatBox label="Ödenen" value={money(sale.paid, sale.currency)} tone="green" />
        {sale.isCancelled ? (
          <StatBox label="İade bekleyen" value={money(sale.refundDue, sale.currency)} tone={sale.refundDue > 0 ? "red" : "green"} />
        ) : (
          <StatBox label="Kalan" value={money(sale.balance, sale.currency)} tone={sale.balance > 0 ? "red" : "green"} />
        )}
      </div>

      <AdminCard className="p-5 sm:p-6">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {info.map(([label, value]) => (
            <div key={label} className="flex gap-3 border-b border-border/60 pb-2">
              <dt className="w-32 shrink-0 text-muted">{label}</dt>
              <dd className="min-w-0 text-brand-900">{value}</dd>
            </div>
          ))}
        </dl>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">Tahsilat ve İadeler</h3>
        </div>
        {sale.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Sıra No</th>
                  <th className={th}>Tarih</th>
                  <th className={cn(th, num)}>Tutar</th>
                  <th className={th}>Ödeme Şekli</th>
                  <th className={th}>Parayı Alan / Veren</th>
                  <th className={th}>Açıklama</th>
                  <th className={th}>Kaydeden</th>
                  <th className={cn(th, "text-right")}>İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sale.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/60">
                    <td className={td}>{p.id}</td>
                    <td className={td}>{shortDate(p.date)}</td>
                    <td className={cn(td, num, "font-semibold", p.amount < 0 ? "text-red-600" : "text-green-700")}>
                      {money(p.amount, sale.currency)}
                      {p.amount < 0 && (
                        <Badge variant="slate" size="sm" className="ml-2">
                          İade
                        </Badge>
                      )}
                    </td>
                    <td className={td}>{p.method}</td>
                    <td className={cn(td, "font-semibold")}>{p.receivedByName ?? "—"}</td>
                    <td className={cn(td, "whitespace-normal")}>{p.note}</td>
                    <td className={td}>
                      <p className="font-semibold">{p.createdByName ?? "—"}</p>
                      <p className="text-xs text-muted tabular-nums">{formatDateTime(p.createdAt)}</p>
                    </td>
                    <td className={cn(td, "text-right")}>
                      {isAdmin && <DeleteButton action={deletePayment} id={String(p.id)} label={p.amount < 0 ? "Bu iadeyi silmek istediğinize emin misiniz?" : "Bu tahsilatı silmek istediğinize emin misiniz?"} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-muted">Henüz tahsilat yok.</p>
        )}
        {!sale.isCancelled && sale.balance > 0 && (
          <div className="border-t border-border bg-cream-50/60 px-5 py-4">
            <PaymentForm
              key={sale.paid}
              saleId={sale.id}
              amount={sale.balance}
              today={inputDate()}
              currencyLabel={currencySymbol(sale.currency).trim() || sale.currency}
              people={people}
              person={me?.name ?? ""}
            />
          </div>
        )}
        {sale.refundDue > 0 && (
          <div className="border-t border-border bg-amber-50/60 px-5 py-4">
            <p className="mb-3 text-sm font-semibold text-amber-900">
              Satış iptal edildi; müşteriye {money(sale.refundDue, sale.currency)} iade edilecek.
            </p>
            <PaymentForm
              key={sale.paid}
              refund
              saleId={sale.id}
              amount={sale.refundDue}
              today={inputDate()}
              currencyLabel={currencySymbol(sale.currency).trim() || sale.currency}
              people={people}
              person={me?.name ?? ""}
            />
          </div>
        )}
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">İşlem Geçmişi</h3>
        </div>
        {activity.length > 0 ? (
          <ul className="divide-y divide-border text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-4">
                <span className="shrink-0 tabular-nums text-muted sm:w-36">{formatDateTime(a.createdAt)}</span>
                <span className="shrink-0 font-semibold text-brand-900 sm:w-32">{a.userName}</span>
                <span className="min-w-0 text-brand-900">{a.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-muted">Bu satış için kayıtlı işlem yok.</p>
        )}
      </AdminCard>
    </div>
  );
}
