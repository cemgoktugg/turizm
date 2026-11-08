import { notFound } from "next/navigation";
import { ReceiptCopy, receiptNo } from "@/components/admin/sales/receipt";
import { ReceiptToolbar } from "@/components/admin/sales/receipt-toolbar";
import { getReceipt } from "@/lib/receipts";
import { SALES_BASE } from "@/lib/sales-base";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: /^\d{1,9}$/.test(id) ? `Makbuz ${receiptNo(Number(id))}` : "Makbuz" };
}

/**
 * Tahsilat / iade makbuzu (/satis/makbuz/123 — 123 tahsilatın sıra numarası).
 * Varsayılan A4'e iki nüsha (müşteri + acente); ?nusha=1 tek nüsha,
 * ?yazdir=1 sayfa açılınca yazdırma penceresini açar.
 */
export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nusha?: string; yazdir?: string }>;
}) {
  const { id } = await params;
  const { nusha, yazdir } = await searchParams;
  const receipt = /^\d{1,9}$/.test(id) ? await getReceipt(Number(id)) : null;
  if (!receipt) notFound();
  const settings = await getSettings();

  const single = nusha === "1";
  const here = `${SALES_BASE}/makbuz/${id}`;
  const back = receipt.group
    ? { href: `${SALES_BASE}?panel=g${receipt.group.id}`, label: `Gruba dön (${receipt.group.name})` }
    : { href: `${SALES_BASE}?panel=${receipt.lines[0].saleId}`, label: `Satışa dön (#${receipt.lines[0].saleId})` };

  return (
    <div>
      <ReceiptToolbar backHref={back.href} backLabel={back.label} copiesHref={single ? here : `${here}?nusha=1`} single={single} autoPrint={yazdir === "1"} />
      <div className="mx-auto max-w-[210mm] space-y-[6mm] rounded-2xl bg-white p-[12mm] shadow-card print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <ReceiptCopy r={receipt} company={settings} copyLabel="Müşteri Nüshası" />
        {!single && (
          <>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-400" aria-hidden>
              <span className="flex-1 border-t border-dashed border-slate-300" />✂ Buradan kesiniz
              <span className="flex-1 border-t border-dashed border-slate-300" />
            </div>
            <ReceiptCopy r={receipt} company={settings} copyLabel="Acente Nüshası" />
          </>
        )}
      </div>
    </div>
  );
}
