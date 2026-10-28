import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StaffForm } from "@/components/admin/sales/staff-form";
import { BackLink } from "@/components/admin/sales/ui";

export const metadata = { title: "Görevli Düzenle" };

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staffId = Number(id);
  const staff = Number.isInteger(staffId) ? await prisma.staff.findUnique({ where: { id: staffId } }) : null;
  if (!staff) notFound();

  return (
    <div>
      <BackLink href="/admin/satis/gorevliler" label="Görevlilere Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Görevli Düzenle: <span className="text-brand-600">{staff.fullName}</span>
      </h2>
      <StaffForm
        staffId={staff.id}
        defaultValues={{ fullName: staff.fullName, tc: staff.tc ?? "", phone: staff.phone, note: staff.note ?? "" }}
      />
    </div>
  );
}
