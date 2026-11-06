import { prisma } from "@/lib/prisma";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { EmptyState } from "@/components/admin/ui";
import { getSaleTourOptions } from "@/app/satis/tour-options";
import { getCurrentUser } from "@/lib/auth";
import { getCashPeople, getReferences, inputDate } from "@/lib/sales";

/**
 * Yeni satış formu: /satis/yeni sayfasında ve satış listesinin yan panelinde
 * (/satis?panel=yeni). listHref verilirse kayıttan sonra listede yeni satışın
 * paneli açılır, İptal listeye döner.
 */
export async function NewSale({ base, customerId, listHref }: { base: string; customerId?: number; listHref?: string }) {
  const [tours, me, people, references, customer] = await Promise.all([
    getSaleTourOptions(),
    getCurrentUser(),
    getCashPeople(),
    getReferences(),
    customerId && Number.isInteger(customerId) && customerId > 0
      ? prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, fullName: true, tc: true, phone: true } })
      : null,
  ]);

  if (tours.length === 0) {
    return <EmptyState title="Aktif tur yok" description="Satış yapabilmek için aktif bir tur ekleyin." actionLabel="Tur Ekle" actionHref={`${base}/turlar/yeni`} />;
  }
  return (
    <SaleForm
      tours={tours}
      customer={customer}
      references={references}
      people={people}
      listHref={listHref}
      defaultValues={{ date: inputDate(), downPaymentBy: me?.name, ...(customer ? { customerId: String(customer.id) } : {}) }}
    />
  );
}
