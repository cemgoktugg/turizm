import { StaffForm } from "@/components/admin/sales/staff-form";
import { BackLink } from "@/components/admin/sales/ui";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Yeni Görevli" };

export default async function NewStaffPage() {
  const base = await getSalesBase();
  return (
    <div>
      <BackLink href={`${base}/gorevliler`} label="Görevlilere Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Görevli</h2>
      <StaffForm />
    </div>
  );
}
