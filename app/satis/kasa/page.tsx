import { Download } from "lucide-react";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/row-actions";
import { HandoverForm } from "@/components/admin/sales/handover-form";
import { StatBox, th, td, num, theadRow } from "@/components/admin/sales/ui";
import { deleteHandover } from "@/app/actions/sales";
import { getCurrentUser } from "@/lib/auth";
import { KASA, UNKNOWN_PERSON, addMoney, getCashRows, getHandovers, inputDate, money, moneyList, shortDate, type Money } from "@/lib/sales";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Kasa" };

const exportHref = "/api/admin/satis/export?rapor=kasa";

export default async function CashPage() {
  const [me, rows, handovers] = await Promise.all([getCurrentUser(), getCashRows(), getHandovers()]);
  const isAdmin = me?.role === "ADMIN";

  const people = rows.filter((r) => r.person !== KASA);
  // Kasaya giren: doğrudan kasaya alınan nakit (iadeler düşülür) + personelin teslim ettiği
  const inCash: Money = {};
  const onPeople: Money = {};
  for (const r of rows) {
    if (r.person === KASA) addMoney(inCash, r.currency, r.held);
    else {
      addMoney(onPeople, r.currency, r.held);
      addMoney(inCash, "USD", r.handedOver);
    }
  }
  const canHandOver = people.filter((r) => r.currency === "USD" && r.held > 0 && r.person !== UNKNOWN_PERSON);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kasa"
        description="Personelin aldığı nakit ve kasaya teslim ettiği tutarlar. Havale ve kart doğrudan hesaba girdiği için burada sayılmaz."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatBox label="Personelde bekleyen nakit" value={moneyList(onPeople)} tone="red" />
        <StatBox label="Kasaya giren nakit" value={moneyList(inCash)} tone="green" />
      </div>

      {isAdmin && canHandOver.length > 0 && (
        <AdminCard className="p-5">
          <h3 className="mb-3 font-serif text-lg font-bold text-brand-900">Kasaya Teslim Al</h3>
          <HandoverForm people={canHandOver.map((r) => ({ name: r.person, label: `${r.person} (${money(r.held, r.currency)})` }))} today={inputDate()} />
        </AdminCard>
      )}

      {people.length === 0 ? (
        <EmptyState title="Personelin aldığı nakit tahsilat yok" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-serif text-lg font-bold text-brand-900">Kişilerin Elindeki Nakit</h3>
            <a href={exportHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-gold-600">
              <Download className="size-4" /> Excel
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Kişi</th>
                  <th className={cn(th, num)}>Alınan Nakit</th>
                  <th className={cn(th, num)}>Nakit İade</th>
                  <th className={cn(th, num)}>Kasaya Teslim</th>
                  <th className={cn(th, num)}>Elinde Kalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {people.map((r) => (
                  <tr key={`${r.person}|${r.currency}`} className={cn("hover:bg-cream-50/60", r.person === UNKNOWN_PERSON && "text-muted")}>
                    <td className={cn(td, "font-semibold")}>{r.person}</td>
                    <td className={cn(td, num)}>{money(r.received, r.currency)}</td>
                    <td className={cn(td, num)}>{money(r.refunded, r.currency)}</td>
                    <td className={cn(td, num)}>{money(r.handedOver, r.currency)}</td>
                    <td className={cn(td, num, "font-bold", r.held > 0 ? "text-red-600" : "text-green-700")}>{money(r.held, r.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">Kasa Teslimleri</h3>
        </div>
        {handovers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">Henüz kasa teslimi yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Tarih</th>
                  <th className={th}>Teslim Eden</th>
                  <th className={cn(th, num)}>Tutar</th>
                  <th className={th}>Açıklama</th>
                  <th className={th}>Kaydeden</th>
                  {isAdmin && <th className={cn(th, "text-right")}>İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {handovers.map((h) => (
                  <tr key={h.id} className="hover:bg-cream-50/60">
                    <td className={td}>{shortDate(h.date)}</td>
                    <td className={cn(td, "font-semibold")}>{h.fromName}</td>
                    <td className={cn(td, num, "font-semibold")}>{money(h.amount, "USD")}</td>
                    <td className={cn(td, "whitespace-normal")}>{h.note}</td>
                    <td className={td}>
                      <p className="font-semibold">{h.createdByName}</p>
                      <p className="text-xs text-muted tabular-nums">{formatDateTime(h.createdAt)}</p>
                    </td>
                    {isAdmin && (
                      <td className={cn(td, "text-right")}>
                        <DeleteButton action={deleteHandover} id={String(h.id)} label="Bu kasa teslimini silmek istediğinize emin misiniz?" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
