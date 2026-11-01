import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { activityHref } from "@/lib/activity";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { th, td, theadRow } from "@/components/admin/sales/ui";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "İşlem Geçmişi" };

const LIMIT = 300;
const control =
  "h-10 rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ kullanici?: string; q?: string }> }) {
  const { kullanici = "", q = "" } = await searchParams;
  const term = q.trim();
  const where: Prisma.ActivityLogWhereInput = {
    ...(kullanici ? { userName: kullanici } : {}),
    ...(term ? { detail: { contains: term } } : {}),
  };
  const [names, rows, total] = await Promise.all([
    prisma.activityLog.findMany({ distinct: ["userName"], select: { userName: true }, orderBy: { userName: "asc" } }),
    prisma.activityLog.findMany({ where, orderBy: { id: "desc" }, take: LIMIT }),
    prisma.activityLog.count({ where }),
  ]);

  return (
    <div>
      <AdminPageHeader title="İşlem Geçmişi" description="Panelde kimin, ne zaman, hangi işlemi yaptığı. Bu kayıtlar panelden değiştirilemez ve silinemez." />

      <form action="/admin/islem-gecmisi" className="mb-5 flex flex-col gap-2 rounded-2xl border border-border bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <select name="kullanici" defaultValue={kullanici} aria-label="Kullanıcı" className={cn(control, "sm:w-56")}>
          <option value="">Tüm kullanıcılar</option>
          {names.map((n) => (
            <option key={n.userName} value={n.userName}>
              {n.userName}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="İşlem, müşteri adı veya satış no..." className={cn(control, "w-full pl-9")} />
        </div>
        <button type="submit" className="h-10 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
          Listele
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Kayıt bulunamadı" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>Tarih ve Saat</th>
                  <th className={th}>Kullanıcı</th>
                  <th className={th}>İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const href = activityHref(r.entity, r.entityId);
                  return (
                    <tr key={r.id} className="hover:bg-cream-50/60">
                      <td className={cn(td, "tabular-nums")}>{formatDateTime(r.createdAt)}</td>
                      <td className={cn(td, "font-semibold text-brand-900")}>{r.userName}</td>
                      <td className={cn(td, "whitespace-normal")}>
                        {href ? (
                          <Link href={href} className="hover:text-brand-600 hover:underline">
                            {r.detail}
                          </Link>
                        ) : (
                          r.detail
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > rows.length && (
            <p className="border-t border-border px-5 py-3 text-xs text-muted">
              {total} kayıttan en yeni {rows.length} tanesi gösteriliyor. Daha eskiler için kullanıcı seçin veya arama yapın.
            </p>
          )}
        </AdminCard>
      )}
    </div>
  );
}
