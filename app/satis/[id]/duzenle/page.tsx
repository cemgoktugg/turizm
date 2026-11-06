import { notFound } from "next/navigation";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { BackLink } from "@/components/admin/sales/ui";
import { getReferences, getSale, inputDate } from "@/lib/sales";
import { getSaleTourOptions } from "../../tour-options";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Satış Düzenle" };

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const base = await getSalesBase();
  const { id } = await params;
  const sale = Number.isInteger(Number(id)) ? await getSale(Number(id)) : null;
  if (!sale) notFound();
  const [tours, references] = await Promise.all([getSaleTourOptions(sale.tourId), getReferences()]);

  return (
    <div>
      <BackLink href={`${base}/${sale.id}`} label="Satışa Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Satış Düzenle: <span className="text-brand-600">#{sale.id}</span>
      </h2>
      <SaleForm
        saleId={sale.id}
        tours={tours}
        paid={sale.paid}
        references={references}
        customer={{ id: sale.customer.id, fullName: sale.customer.fullName, tc: sale.customer.tc, phone: sale.customer.phone }}
        defaultValues={{
          date: inputDate(sale.date),
          tourId: String(sale.tourId),
          customerId: String(sale.customerId),
          note: sale.note ?? "",
          reference: sale.reference ?? "",
          roomSize: sale.roomSize == null ? "" : String(sale.roomSize),
          price: String(sale.price),
        }}
      />
    </div>
  );
}
