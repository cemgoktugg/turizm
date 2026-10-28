import { StaffForm } from "@/components/admin/sales/staff-form";
import { BackLink } from "@/components/admin/sales/ui";

export const metadata = { title: "Yeni Görevli" };

export default function NewStaffPage() {
  return (
    <div>
      <BackLink href="/admin/satis/gorevliler" label="Görevlilere Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Görevli</h2>
      <StaffForm />
    </div>
  );
}
