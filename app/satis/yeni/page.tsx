import { BackLink } from "@/components/admin/sales/ui";
import { NewSale } from "@/components/admin/sales/new-sale";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Yeni Satış" };

export default async function NewSalePage({ searchParams }: { searchParams: Promise<{ musteri?: string; grup?: string; tip?: string }> }) {
  const base = await getSalesBase();
  const { musteri, grup, tip } = await searchParams;

  return (
    <div>
      <BackLink href={grup ? `${base}/gruplar/${grup}` : base} label={grup ? "Gruba Dön" : "Satışlara Dön"} />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Satış</h2>
      <NewSale base={base} customerId={Number(musteri)} groupId={Number(grup)} initialMode={tip === "grup" ? "group" : "single"} />
    </div>
  );
}
