import { notFound } from "next/navigation";
import { BackLink } from "@/components/admin/sales/ui";
import { SaleDetail } from "@/components/admin/sales/sale-detail";
import { getSale } from "@/lib/sales";
import { getSalesBase } from "@/lib/sales-base-server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Satış #${id}` };
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const base = await getSalesBase();
  const { id } = await params;
  const sale = Number.isInteger(Number(id)) ? await getSale(Number(id)) : null;
  if (!sale) notFound();

  return (
    <div>
      <BackLink href={base} label="Satışlara Dön" />
      <SaleDetail sale={sale} base={base} afterDeleteHref={base} />
    </div>
  );
}
