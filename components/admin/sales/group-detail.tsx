import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/row-actions";
import { StatBox } from "@/components/admin/sales/ui";
import { ActionButton, GroupEditForm, GroupPaymentForm } from "@/components/admin/sales/group-client";
import { ReceiptLink } from "@/components/admin/sales/sale-detail";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { deleteGroup, deletePayment, removeFromGroup } from "@/app/actions/sales";
import { getActivityFor } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { getGroupBatches, inputDate, money, moneyList, shortDate, type GroupData } from "@/lib/sales";
import { cn, formatDateTime } from "@/lib/utils";
import { roomAndPassenger } from "@/lib/sale-pricing";

/**
 * Aile / grup ayrıntısı: kişiler ve borçları, grup tahsilatı, geçmiş.
 * Tam sayfada (/satis/gruplar/3) ve satış listesinin yan panelinde (?panel=g3).
 */
export async function GroupDetail({
  group,
  base,
  saleHref,
  addHref,
  afterDeleteHref,
}: {
  group: GroupData;
  base: string;
  /** Kişinin satışına bağlantı (panelde: listede o satışın paneli) */
  saleHref: (saleId: number) => string;
  /** "Kişi ekle": bu gruba yeni satış */
  addHref: string;
  afterDeleteHref: string;
}) {
  const [me, batches, activity] = await Promise.all([getCurrentUser(), getGroupBatches(group.id), getActivityFor("SaleGroup", group.id)]);
  const isAdmin = me?.role === "ADMIN";
  const { sales, totals } = group;

  // Grup tahsilatı tek para birimine dağıtılır: borcu olanların en çok görülen para birimi
  const debtors = sales.filter((s) => s.balance > 0);
  const currencies = [...new Set(debtors.map((s) => s.currency))];
  const payCurrency = currencies[0];
  const payMembers = debtors.filter((s) => s.currency === payCurrency).map((s) => ({ saleId: s.id, name: s.customer.fullName, balance: s.balance }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex flex-wrap items-center gap-3 font-serif text-xl font-bold text-brand-900">
            {group.name}
            <Badge variant="slate">{sales.length} kişi</Badge>
            {totals.count > 0 && Object.values(totals.balance).every((v) => v <= 0) && <Badge variant="green">Ödendi</Badge>}
          </h2>
          {group.note && <p className="mt-1 whitespace-pre-line text-sm text-muted">{group.note}</p>}
          <div className="mt-2">
            <GroupEditForm id={group.id} name={group.name} note={group.note} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={addHref} scroll={false} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <UserPlus className="size-4" /> Kişi ekle
          </Link>
          <ActionButton
            action={deleteGroup}
            id={group.id}
            label="Grubu dağıt"
            confirm={`"${group.name}" grubu dağıtılsın mı? Satışlar ve tahsilatlar olduğu gibi kalır; yalnızca gruplama kalkar.`}
            redirectTo={afterDeleteHref}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label="Toplam ücret" value={moneyList(totals.price)} />
        <StatBox label="Ödenen" value={moneyList(totals.paid)} tone="green" />
        <StatBox label="Kalan" value={moneyList(totals.balance)} tone={Object.values(totals.balance).some((v) => v > 0) ? "red" : "green"} />
      </div>

      {payMembers.length > 0 && (
        <AdminCard className="p-4 sm:p-5">
          <h3 className="mb-3 font-serif text-lg font-bold text-brand-900">Grup Tahsilatı</h3>
          {currencies.length > 1 && (
            <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Grupta farklı para birimli satışlar var; burada yalnızca {payCurrency} borçları dağıtılır. Diğerlerini kişinin satışından girin.
            </p>
          )}
          <GroupPaymentForm
            key={payMembers.map((m) => `${m.saleId}:${m.balance}`).join(",")}
            groupId={group.id}
            members={payMembers}
            currency={payCurrency}
            person={me?.name ?? ""}
            today={inputDate()}
          />
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">Kişiler</h3>
        </div>
        <ul className="divide-y divide-border text-sm">
          {sales.map((s) => (
            <li key={s.id} className={cn("flex items-center gap-3 px-5 py-3", s.isCancelled && "text-muted")}>
              <div className="min-w-0 flex-1">
                <Link href={saleHref(s.id)} scroll={false} className="font-semibold text-brand-900 hover:text-brand-600">
                  {s.customer.fullName}
                </Link>
                <span className="ml-2 text-xs text-muted">#{s.id}</span>
                {s.isCancelled && (
                  <Badge variant="slate" size="sm" className="ml-2">
                    İptal
                  </Badge>
                )}
                {s.refundDue > 0 && (
                  <Badge variant="amber" size="sm" className="ml-2">
                    İade: {money(s.refundDue, s.currency)}
                  </Badge>
                )}
                <p className="truncate text-xs text-muted">
                  {[s.tour.name, roomAndPassenger(s.roomSize, s.passenger)].filter(Boolean).join(" · ")} ·{" "}
                  {money(s.price, s.currency)}
                </p>
              </div>
              <div className="text-right tabular-nums">
                <p className={cn("font-semibold", s.balance > 0 ? "text-red-600" : "text-green-700")}>{s.isCancelled ? "—" : money(s.balance, s.currency)}</p>
                <p className="text-xs text-green-700">{money(s.paid, s.currency)} ödendi</p>
              </div>
              <ActionButton
                action={removeFromGroup}
                id={s.id}
                label="Çıkar"
                variant="link"
                confirm={`${s.customer.fullName} gruptan çıkarılsın mı? Satışı ve tahsilatları olduğu gibi kalır.`}
              />
            </li>
          ))}
        </ul>
      </AdminCard>

      {batches.length > 0 && (
        <AdminCard className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-serif text-lg font-bold text-brand-900">Grup Tahsilatları</h3>
          </div>
          <ul className="divide-y divide-border text-sm">
            {batches.map((b) => (
              <li key={b.batchId} className="flex items-start gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-green-700 tabular-nums">
                    {money(b.total, b.currency)} <span className="font-normal text-muted">{b.method}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {shortDate(b.date)} · Alan: <span className="font-semibold text-brand-900">{b.receivedByName ?? "—"}</span>
                    {b.note ? ` · ${b.note}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{b.parts.map((p) => `${p.name} ${money(p.amount, b.currency)}`).join(" · ")}</p>
                </div>
                <ReceiptLink paymentId={b.paymentId} />
                {isAdmin && <DeleteButton action={deletePayment} id={String(b.paymentId)} label="Bu grup tahsilatı tüm kişilerden silinsin mi?" />}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-bold text-brand-900">Grup Geçmişi</h3>
        </div>
        {activity.length > 0 ? (
          <ul className="divide-y divide-border text-sm">
            {activity.map((a) => (
              <li key={a.id} className="px-5 py-3">
                <p className="tabular-nums text-muted">
                  {formatDateTime(a.createdAt)} <span className="ml-2 font-semibold text-brand-900">{a.userName}</span>
                </p>
                <p className="text-brand-900">{a.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-muted">Kayıtlı işlem yok.</p>
        )}
      </AdminCard>
      <p className="text-xs text-muted">
        Grubun tüm satışları <Link href={`${base}?q=${encodeURIComponent(group.name)}`} className="font-semibold text-brand-700 hover:text-gold-600">satış listesinde</Link> de aranabilir.
      </p>
    </div>
  );
}
