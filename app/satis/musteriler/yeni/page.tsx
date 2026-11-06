import { CustomerForm } from "@/components/admin/sales/customer-form";
import { BackLink } from "@/components/admin/sales/ui";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Yeni Müşteri" };

export default async function NewCustomerPage() {
  const base = await getSalesBase();
  return (
    <div>
      <BackLink href={`${base}/musteriler`} label="Müşterilere Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Müşteri</h2>
      <CustomerForm />
    </div>
  );
}
