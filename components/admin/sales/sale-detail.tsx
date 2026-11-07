import Link from "next/link";
import { Pencil, UsersRound } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/row-actions";
import { StatBox, th, td, num, theadRow } from "@/components/admin/sales/ui";
import { PaymentForm } from "@/components/admin/sales/payment-form";
import { SaleCancelButton } from "@/components/admin/sales/sale-cancel-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deletePayment, deleteSale } from "@/app/actions/sales";
import { getActivityFor } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { getCashPeople, getGroup, inputDate, money, moneyList, shortDate, type getSale } from "@/lib/sales";
import { cn, currencySymbol, formatDateTime } from "@/lib/utils";
import { discountOf, percent } from "@/lib/sale-pricing";

export type SaleDetailData = NonNullable<Awaited<ReturnType<typeof getSale>>>;

/**
 * Satış detayı: tam sayfada (/satis/12) ve satış listesindeki yan panelde
 * (/satis?panel=12) aynı içerik. compact: yan panelin dar düzeni.
 */
export async function SaleDetail({
  sale,
  base,
  compact = false,
  afterDeleteHref,
  groupHref,
}: {
  sale: SaleDetailData;
  base: string;
  compact?: boolean;
  /** Satış silinince gidilecek adres */
  afterDeleteHref: string;
  /** Satış bir aile / grupta ise grubun sayfası / paneli */
  groupHref?: string;
}) {
  const { tour, customer } = sale;
  const [activity, me, people, group] = await Promise.all([
    getActivityFor("Sale", sale.id),
    getCurrentUser(),
    getCashPeople(),
    sale.group ? getGroup(sale.group.id) : null,
  ]);
  const isAdmin = me?.role === "ADMIN";
  const currencyLabel = currencySymbol(sale.currency).trim() || sale.currency;
  const discount = discountOf(sale.listPrice, sale.price);

  const info: [string, React.ReactNode][] = [
    [
      "Müşteri",
      <Link key="c" href={`${base}/musteriler/${customer.id}`} className="font-semibold text-brand-700 hover:text-gold-600">
        #{customer.id} {customer.fullName}
      </Link>,
    ],
    [
      "T.C. / Telefon",
      <span key="p">
        {customer.tc ?? "—"}
        {" · "}
        {customer.phone ? (
          <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="hover:text-brand-600">
            {customer.phone}
          </a>
        ) : (
          "—"
        )}
      </span>,
    ],
    [
      "Tur",
      <Link key="t" href={`${base}/turlar/${tour.id}`} className="font-semibold text-brand-700 hover:text-gold-600">
        #{tour.id} {tour.name}
      </Link>,
    ],
    ["Dönem", tour.period],
    ["Gidiş – Dönüş", `${shortDate(tour.departureDate)} – ${shortDate(tour.returnDate)} (${tour.days} gün)`],
    ["Görevliler", [tour.guide1.fullName, tour.guide2?.fullName].filter(Boolean).join(", ")],
    ["Satış Tarihi", shortDate(sale.date)],
    ["Oda Kişi Sayısı", sale.roomSize ? `${sale.roomSize} kişilik oda` : "—"],
    [
      "Liste Fiyatı",
      sale.listPrice == null ? (
        "—"
      ) : (
        <span key="lp">
          {money(sale.listPrice, sale.currency)}
          {discount ? (
            <span className={cn("ml-2 text-xs font-semibold", discount.warn ? "text-amber-700" : "text-muted")}>
              İndirim {money(discount.amount, sale.currency)} ({percent(discount.rate)})
            </span>
          ) : (
            <span className="ml-2 text-xs text-muted">İndirim yok</span>
          )}
        </span>
      ),
    ],
    ["Referans", sale.reference || "—"],
    ["Açıklama", sale.note || "—"],
    ["Kaydeden", `${sale.createdByName ?? "—"} · ${formatDateTime(sale.createdAt)}`],
  ];

  const deleteLabel = (amount: number, batchId?: string | null) =>
    batchId
      ? "Bu grup tahsilatının parçası; silinirse gruptaki tüm kişilerden silinir. Emin misiniz?"
      : amount < 0
        ? "Bu iadeyi silmek istediğinize emin misiniz?"
        : "Bu tahsilatı silmek istediğinize emin misiniz?";

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={cn("flex flex-wrap items-center gap-3 font-serif font-bold text-brand-900", compact ? "text-xl" : "text-2xl")}>
          Satış #{sale.id}
          {sale.isCancelled && <Badge variant="slate">İptal edildi</Badge>}
          {sale.refundDue > 0 && <Badge variant="amber">İade bekliyor</Badge>}
          {!sale.isCancelled && sale.balance <= 0 && <Badge variant="green">Ödendi</Badge>}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${base}/${sale.id}/duzenle`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil className="size-4" /> Düzenle
          </Link>
          <SaleCancelButton id={sale.id} isCancelled={sale.isCancelled} />
          {sale.payments.length === 0 && (
            <DeleteButton action={deleteSale} id={String(sale.id)} label="Bu satışı silmek istediğinize emin misiniz?" redirectTo={afterDeleteHref} />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label={discount ? "Anlaşılan Ücret" : "Ücret"} value={money(sale.price, sale.currency)} />
        <StatBox label="Ödenen" value={money(sale.paid, sale.currency)} tone="green" />
        {sale.isCancelled ? (
          <StatBox label="İade bekleyen" value={money(sale.refundDue, sale.currency)} tone={sale.refundDue > 0 ? "red" : "green"} />
        ) : (
          <StatBox label="Kalan" value={money(sale.balance, sale.currency)} tone={sale.balance > 0 ? "red" : "green"} />
        )}
      </div>

      {group && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm">
          <UsersRound className="size-5 shrink-0 text-brand-700" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-900">
              {group.name} <span className="font-normal text-muted">· {group.sales.length} kişi</span>
            </p>
            <p className="text-xs text-muted">
              Grubun toplam kalanı: <span className="font-semibold text-red-600">{moneyList(group.totals.balance)}</span> · Ödeme birlikte yapılıyorsa grup tahsilatını kullanın.
            </p>
          </div>
          {groupHref && (
            <Link href={groupHref} scroll={false} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Grubu aç
            </Link>
          )}
        </div>
      )}

      {/* Ödeme formu yan panelde en üstte: en sık yapılan iş */}
      {compact && <PaymentForms sale={sale} people={people} person={me?.name ?? ""} currencyLabel={currencyLabel} />}

      <AdminCard className={compact ? "p-4" : "p-5 sm:p-6"}>
        <dl className={cn("grid gap-x-8 gap-y-3 text-sm", !compact && "sm:grid-cols-2")}>
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
        {sale.payments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">Henüz tahsilat yok.</p>
        ) : compact ? (
          <ul className="divide-y divide-border text-sm">
            {sale.payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("font-semibold tabular-nums", p.amount < 0 ? "text-red-600" : "text-green-700")}>
                    {money(p.amount, sale.currency)}
                    {p.amount < 0 && (
                      <Badge variant="slate" size="sm" className="ml-2">
                        İade
                      </Badge>
                    )}
                    {p.batchId && (
                      <Badge variant="brand" size="sm" className="ml-2" title="Grup tahsilatından pay; silinirse tüm kişilerden silinir">
                        Grup
                      </Badge>
                    )}
                    <span className="ml-2 font-normal text-muted">{p.method}</span>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {shortDate(p.date)} · {p.amount < 0 ? "Veren" : "Alan"}: <span className="font-semibold text-brand-900">{p.receivedByName ?? "—"}</span>
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                {isAdmin && <DeleteButton action={deletePayment} id={String(p.id)} label={deleteLabel(p.amount, p.batchId)} />}
              </li>
            ))}
          </ul>
        ) : (
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
                      {p.batchId && (
                        <Badge variant="brand" size="sm" className="ml-2" title="Grup tahsilatından pay; silinirse tüm kişilerden silinir">
                          Grup
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
                      {isAdmin && <DeleteButton action={deletePayment} id={String(p.id)} label={deleteLabel(p.amount, p.batchId)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!compact && <PaymentForms sale={sale} people={people} person={me?.name ?? ""} currencyLabel={currencyLabel} bordered />}
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">İşlem Geçmişi</h3>
        </div>
        {activity.length > 0 ? (
          <ul className="divide-y divide-border text-sm">
            {activity.map((a) => (
              <li key={a.id} className={cn("flex flex-col gap-1 px-5 py-3", !compact && "sm:flex-row sm:gap-4")}>
                <span className={cn("shrink-0 tabular-nums text-muted", !compact && "sm:w-36")}>
                  {formatDateTime(a.createdAt)}
                  {compact && <span className="ml-2 font-semibold text-brand-900">{a.userName}</span>}
                </span>
                {!compact && <span className="shrink-0 font-semibold text-brand-900 sm:w-32">{a.userName}</span>}
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

/** Tahsilat (kalan varsa) ve iade (iptal edilmiş, iade bekleyen satışta) formları */
function PaymentForms({
  sale,
  people,
  person,
  currencyLabel,
  bordered = false,
}: {
  sale: SaleDetailData;
  people: string[];
  person: string;
  currencyLabel: string;
  bordered?: boolean;
}) {
  const box = (tone: string) => cn("px-5 py-4", bordered ? `border-t border-border ${tone}` : `rounded-2xl border border-border shadow-soft ${tone}`);
  return (
    <>
      {!sale.isCancelled && sale.balance > 0 && (
        <div className={box("bg-cream-50/60")}>
          <PaymentForm
            key={sale.paid}
            saleId={sale.id}
            amount={sale.balance}
            today={inputDate()}
            currencyLabel={currencyLabel}
            people={people}
            person={person}
          />
        </div>
      )}
      {sale.refundDue > 0 && (
        <div className={box("bg-amber-50/60")}>
          <p className="mb-3 text-sm font-semibold text-amber-900">
            Satış iptal edildi; müşteriye {money(sale.refundDue, sale.currency)} iade edilecek.
          </p>
          <PaymentForm
            key={sale.paid}
            refund
            saleId={sale.id}
            amount={sale.refundDue}
            today={inputDate()}
            currencyLabel={currencyLabel}
            people={people}
            person={person}
          />
        </div>
      )}
    </>
  );
}
