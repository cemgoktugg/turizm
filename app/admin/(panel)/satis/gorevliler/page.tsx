import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { EditLink, DeleteButton } from "@/components/admin/row-actions";
import { th, td, theadRow } from "@/components/admin/sales/ui";
import { deleteStaff } from "@/app/actions/sales";
import { cn } from "@/lib/utils";

export const metadata = { title: "Görevliler" };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const staff = await prisma.staff.findMany({
    where: term ? { OR: [{ fullName: { contains: term } }, { phone: { contains: term } }, { tc: { contains: term } }] } : {},
    orderBy: { fullName: "asc" },
    include: { _count: { select: { tours1: true, tours2: true } } },
  });

  return (
    <div>
      <AdminPageHeader title="Görevliler" description="Turlarda Görevli 1 / Görevli 2 olarak seçilen rehber ve kafile başkanları." actionLabel="Yeni Görevli" actionHref="/admin/satis/gorevliler/yeni" />

      <form action="/admin/satis/gorevliler" className="relative mb-5 sm:w-80">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Ad, telefon veya T.C. ara..."
          className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </form>

      {staff.length === 0 ? (
        <EmptyState title="Görevli bulunamadı" actionLabel="Yeni Görevli" actionHref="/admin/satis/gorevliler/yeni" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className={theadRow}>
                  <th className={th}>No</th>
                  <th className={th}>Ad Soyad</th>
                  <th className={th}>T.C.</th>
                  <th className={th}>Telefon</th>
                  <th className={th}>Açıklama</th>
                  <th className={cn(th, "text-center")}>Tur</th>
                  <th className={cn(th, "text-right")}>İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50/60">
                    <td className={td}>{s.id}</td>
                    <td className={cn(td, "font-semibold text-brand-900")}>
                      <Link href={`/admin/satis/gorevliler/${s.id}`} className="hover:text-brand-600">
                        {s.fullName}
                      </Link>
                    </td>
                    <td className={td}>{s.tc}</td>
                    <td className={td}>
                      <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-brand-600">
                        {s.phone}
                      </a>
                    </td>
                    <td className={cn(td, "max-w-72 truncate")} title={s.note ?? undefined}>
                      {s.note}
                    </td>
                    <td className={cn(td, "text-center")}>{s._count.tours1 + s._count.tours2}</td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-2">
                        <EditLink href={`/admin/satis/gorevliler/${s.id}`} />
                        <DeleteButton action={deleteStaff} id={String(s.id)} label="Bu görevliyi silmek istediğinize emin misiniz?" />
                      </div>
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
