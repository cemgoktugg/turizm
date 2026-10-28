import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { EditLink, DeleteButton } from "@/components/admin/row-actions";
import { th, td, num, theadRow } from "@/components/admin/sales/ui";
import { deleteCustomer } from "@/app/actions/sales";
import { addMoney, loadSales, moneyList, type Money } from "@/lib/sales";
import { cn } from "@/lib/utils";

export const metadata = { title: "Müşteriler" };

const LIMIT = 300;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ filtre?: string; q?: string }> }) {
  const { filtre = "", q = "" } = await searchParams;
  const onlyDebtors = filtre === "borclu";
  const term = q.trim();

  // Bakiye: iptal edilmemiş satışlardaki kalanların toplamı (para birimi bazında)
  const sales = await loadSales({ isCancelled: false });
  const balances = new Map<number, Money>();
  const saleCounts = new Map<number, number>();
  for (const s of sales) {
    saleCounts.set(s.customerId, (saleCounts.get(s.customerId) ?? 0) + 1);
    if (s.balance <= 0) continue;
    const m = balances.get(s.customerId) ?? {};
    addMoney(m, s.currency, s.balance);
    balances.set(s.customerId, m);
  }

  const where: Prisma.CustomerWhereInput = {
    ...(term
      ? {
          OR: [
            { fullName: { contains: term } },
            { tc: { contains: term } },
            { phone: { contains: term } },
            ...(/^\d{1,9}$/.test(term) ? [{ id: Number(term) }] : []),
          ],
        }
      : {}),
    ...(onlyDebtors ? { id: { in: [...balances.keys()] } } : {}),
  };
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { fullName: "asc" }, take: LIMIT }),
    prisma.customer.count({ where }),
  ]);

  return (
    <div>
      <AdminPageHeader title="Müşteriler" description="Bakiye, iptal edilmemiş satışlardaki kalan tutarların toplamıdır." actionLabel="Yeni Müşteri" actionHref="/admin/satis/musteriler/yeni" />

      <ListToolbar
        basePath="/admin/satis/musteriler"
        tabs={[
          { value: "", label: "Tümü" },
          { value: "borclu", label: "Borçlu", count: balances.size },
        ]}
        activeTab={onlyDebtors ? "borclu" : ""}
        query={term}
        searchPlaceholder="Ad, T.C., telefon veya müşteri no..."
      />

      {customers.length === 0 ? (
        <EmptyState title="Müşteri bulunamadı" actionLabel="Yeni Müşteri" actionHref="/admin/satis/musteriler/yeni" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>No</th>
                  <th className={th}>Ad Soyad</th>
                  <th className={th}>T.C.</th>
                  <th className={th}>Telefon</th>
                  <th className={cn(th, "text-center")}>Satış</th>
                  <th className={cn(th, num)}>Bakiye</th>
                  <th className={cn(th, "text-right")}>İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => {
                  const balance = balances.get(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-cream-50/60">
                      <td className={td}>{c.id}</td>
                      <td className={cn(td, "font-semibold text-brand-900")}>
                        <Link href={`/admin/satis/musteriler/${c.id}`} className="hover:text-brand-600">
                          {c.fullName}
                        </Link>
                      </td>
                      <td className={td}>{c.tc}</td>
                      <td className={td}>
                        <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-brand-600">
                          {c.phone}
                        </a>
                      </td>
                      <td className={cn(td, "text-center")}>{saleCounts.get(c.id) ?? 0}</td>
                      <td className={cn(td, num, "font-semibold", balance ? "text-red-600" : "text-muted")}>{balance ? moneyList(balance) : "—"}</td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-2">
                          <EditLink href={`/admin/satis/musteriler/${c.id}`} />
                          <DeleteButton action={deleteCustomer} id={String(c.id)} label="Bu müşteriyi silmek istediğinize emin misiniz?" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > customers.length && (
            <p className="border-t border-border px-4 py-3 text-xs text-muted">
              {total} kayıttan ilk {customers.length} tanesi gösteriliyor; aramayı daraltın.
            </p>
          )}
        </AdminCard>
      )}
    </div>
  );
}
