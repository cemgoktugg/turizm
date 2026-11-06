import { prisma } from "@/lib/prisma";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { BackLink } from "@/components/admin/sales/ui";
import { EmptyState } from "@/components/admin/ui";
import { getSaleTourOptions } from "../tour-options";
import { getCurrentUser } from "@/lib/auth";
import { getCashPeople, getReferences, inputDate } from "@/lib/sales";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Yeni Satış" };

export default async function NewSalePage({ searchParams }: { searchParams: Promise<{ musteri?: string }> }) {
  const base = await getSalesBase();
  const { musteri } = await searchParams;
  const customerId = Number(musteri);
  const [tours, me, people, references, customer] = await Promise.all([
    getSaleTourOptions(),
    getCurrentUser(),
    getCashPeople(),
    getReferences(),
    Number.isInteger(customerId) && customerId > 0
      ? prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, fullName: true, tc: true, phone: true } })
      : null,
  ]);

  return (
    <div>
      <BackLink href={base} label="Satışlara Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Satış</h2>
      {tours.length === 0 ? (
        <EmptyState title="Aktif tur yok" description="Satış yapabilmek için aktif bir tur ekleyin." actionLabel="Tur Ekle" actionHref={`${base}/turlar/yeni`} />
      ) : (
        <SaleForm
          tours={tours}
          customer={customer}
          references={references}
          people={people}
          defaultValues={{ date: inputDate(), downPaymentBy: me?.name, ...(customer ? { customerId: String(customer.id) } : {}) }}
        />
      )}
    </div>
  );
}
