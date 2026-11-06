import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { th, td, num, theadRow } from "@/components/admin/sales/ui";
import { loadSales, moneyList, totalsOf } from "@/lib/sales";
import { cn } from "@/lib/utils";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Aile / Gruplar" };

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ q?: string; filtre?: string }> }) {
  const base = await getSalesBase();
  const { q = "", filtre = "" } = await searchParams;
  const term = q.trim();

  const [groups, sales] = await Promise.all([
    prisma.saleGroup.findMany({
      where: term ? { OR: [{ name: { contains: term } }, { sales: { some: { customer: { fullName: { contains: term } } } } }] } : {},
      orderBy: { id: "desc" },
      take: 300,
    }),
    loadSales({ groupId: { not: null } }),
  ]);
  const rows = groups
    .map((g) => {
      const members = sales.filter((s) => s.groupId === g.id);
      return { ...g, members, totals: totalsOf(members), tours: [...new Set(members.map((s) => s.tour.name))] };
    })
    .filter((g) => filtre !== "borclu" || Object.values(g.totals.balance).some((v) => v > 0));

  return (
    <div>
      <AdminPageHeader
        title="Aile / Gruplar"
        description="Birlikte kayıt olan ve birlikte ödeyen kişiler. Grup, satış listesinde satırlar seçilip “Grup yap” ile ya da Yeni Satış › Aile / Grup ile oluşturulur."
        actionLabel="Aile / Grup Satışı"
        actionHref={`${base}?panel=yeni&tip=grup`}
      />

      <form action={`${base}/gruplar`} className="mb-5 flex flex-col gap-2 rounded-2xl border border-border bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Grup adı veya kişi adı..."
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <select name="filtre" defaultValue={filtre} aria-label="Durum" className="h-10 rounded-xl border border-border bg-white px-3 text-sm shadow-sm sm:w-44">
          <option value="">Tüm gruplar</option>
          <option value="borclu">Borcu olanlar</option>
        </select>
        <button type="submit" className="h-10 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
          Listele
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Grup bulunamadı" description="Satış listesinde aynı ailenin satırlarını seçip “Grup yap” diyebilirsiniz." />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Grup</th>
                  <th className={cn(th, "text-center")}>Kişi</th>
                  <th className={th}>Tur</th>
                  <th className={cn(th, num)}>Toplam</th>
                  <th className={cn(th, num)}>Ödenen</th>
                  <th className={cn(th, num)}>Kalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((g) => (
                  <tr key={g.id} className="hover:bg-cream-50/60">
                    <td className={td}>
                      <Link href={`${base}/gruplar/${g.id}`} className="font-semibold text-brand-900 hover:text-brand-600">
                        {g.name}
                      </Link>
                      <p className="max-w-80 truncate text-xs text-muted">{g.members.map((m) => m.customer.fullName).join(", ")}</p>
                    </td>
                    <td className={cn(td, "text-center")}>{g.members.length}</td>
                    <td className={cn(td, "max-w-56 truncate")} title={g.tours.join(", ")}>
                      {g.tours.join(", ") || "—"}
                    </td>
                    <td className={cn(td, num)}>{moneyList(g.totals.price)}</td>
                    <td className={cn(td, num, "text-green-700")}>{moneyList(g.totals.paid)}</td>
                    <td className={cn(td, num, "font-semibold", Object.values(g.totals.balance).some((v) => v > 0) ? "text-red-600" : "text-green-700")}>
                      {moneyList(g.totals.balance)}
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
