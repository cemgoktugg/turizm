import { CustomerForm } from "@/components/admin/sales/customer-form";
import { BackLink } from "@/components/admin/sales/ui";

export const metadata = { title: "Yeni Müşteri" };

export default function NewCustomerPage() {
  return (
    <div>
      <BackLink href="/admin/satis/musteriler" label="Müşterilere Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Müşteri</h2>
      <CustomerForm />
    </div>
  );
}
