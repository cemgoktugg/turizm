import { notFound } from "next/navigation";
import { UmreContract } from "@/components/admin/sales/contract";
import { ReceiptToolbar } from "@/components/admin/sales/receipt-toolbar";
import { getContract } from "@/lib/contracts";
import { SALES_BASE } from "@/lib/sales-base";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: /^\d{1,9}$/.test(id) ? `Sözleşme #${id}` : "Sözleşme" };
}

/**
 * Satışın umre sözleşmesi (/satis/sozlesme/123 — 123 satış numarası), tek A4.
 * Müşteri, tur ve ücret satıştan otomatik dolar; ?yazdir=1 yazdırma penceresini açar.
 */
export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ yazdir?: string }>;
}) {
  const { id } = await params;
  const { yazdir } = await searchParams;
  const sale = /^\d{1,9}$/.test(id) ? await getContract(Number(id)) : null;
  if (!sale) notFound();
  const settings = await getSettings();

  return (
    <div>
      <ReceiptToolbar
        backHref={`${SALES_BASE}?panel=${sale.id}`}
        backLabel={`Satışa dön (#${sale.id})`}
        docName="sözleşmeyi"
        autoPrint={yazdir === "1"}
      />
      {sale.isCancelled && (
        <p className="mx-auto mb-4 max-w-[210mm] rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 print:hidden">
          Bu satış iptal edilmiştir.
        </p>
      )}
      <div className="mx-auto max-w-[210mm] rounded-2xl bg-white p-[12mm] shadow-card print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <UmreContract sale={sale} company={settings} />
      </div>
    </div>
  );
}
