import { prisma } from "@/lib/prisma";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { GroupSaleForm } from "@/components/admin/sales/group-sale-form";
import { NewSaleTabs } from "@/components/admin/sales/new-sale-tabs";
import { EmptyState } from "@/components/admin/ui";
import { getSaleTourOptions } from "@/app/satis/tour-options";
import { getCurrentUser } from "@/lib/auth";
import { getReferences, inputDate } from "@/lib/sales";

/**
 * Yeni satış (tek kişi veya aile / grup): /satis/yeni sayfasında ve satış
 * listesinin yan panelinde (/satis?panel=yeni). listHref verilirse kayıttan
 * sonra listede yeni kaydın paneli açılır, İptal listeye döner.
 * groupId: var olan gruba kişi ekleme (yalnızca grup formu gösterilir).
 */
export async function NewSale({
  base,
  customerId,
  groupId,
  listHref,
  initialMode = "single",
}: {
  base: string;
  customerId?: number;
  groupId?: number;
  listHref?: string;
  initialMode?: "single" | "group";
}) {
  const validId = (n?: number) => (n && Number.isInteger(n) && n > 0 ? n : null);
  const [tours, me, references, customer, group] = await Promise.all([
    getSaleTourOptions(),
    getCurrentUser(),
    getReferences(),
    validId(customerId) ? prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, fullName: true, tc: true, phone: true } }) : null,
    validId(groupId) ? prisma.saleGroup.findUnique({ where: { id: groupId }, select: { id: true, name: true } }) : null,
  ]);

  if (tours.length === 0) {
    return <EmptyState title="Aktif tur yok" description="Satış yapabilmek için aktif bir tur ekleyin." actionLabel="Tur Ekle" actionHref={`${base}/turlar/yeni`} />;
  }
  const activeTours = tours.filter((t) => t.isActive);
  const groupForm = (
    <GroupSaleForm tours={activeTours} references={references} today={inputDate()} person={me?.name ?? ""} group={group} listHref={listHref} />
  );
  if (group) return groupForm;

  return (
    <NewSaleTabs
      single={
        <SaleForm
          tours={tours}
          customer={customer}
          references={references}
          person={me?.name ?? ""}
          listHref={listHref}
          defaultValues={{ date: inputDate(), ...(customer ? { customerId: String(customer.id) } : {}) }}
        />
      }
      group={groupForm}
      initial={initialMode}
    />
  );
}
