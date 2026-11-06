import { BackLink } from "@/components/admin/sales/ui";
import { NewSale } from "@/components/admin/sales/new-sale";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Yeni Satış" };

export default async function NewSalePage({ searchParams }: { searchParams: Promise<{ musteri?: string }> }) {
  const base = await getSalesBase();
  const { musteri } = await searchParams;

  return (
    <div>
      <BackLink href={base} label="Satışlara Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Satış</h2>
      <NewSale base={base} customerId={Number(musteri)} />
    </div>
  );
}
