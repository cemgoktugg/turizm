import { prisma } from "@/lib/prisma";
import { ServiceTourForm } from "@/components/admin/sales/service-tour-form";
import { BackLink } from "@/components/admin/sales/ui";
import { EmptyState } from "@/components/admin/ui";
import { getPeriods } from "@/lib/sales";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Yeni Tur (Satış)" };

export default async function NewServiceTourPage() {
  const base = await getSalesBase();
  const [staff, periods] = await Promise.all([
    prisma.staff.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    getPeriods(),
  ]);

  return (
    <div>
      <BackLink href={`${base}/turlar`} label="Turlara Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Tur</h2>
      {staff.length === 0 ? (
        <EmptyState title="Önce görevli ekleyin" description="Her turda en az bir görevli (Görevli 1) seçilmesi gerekir." actionLabel="Görevli Ekle" actionHref={`${base}/gorevliler/yeni`} />
      ) : (
        <ServiceTourForm staff={staff} periods={periods} />
      )}
    </div>
  );
}
