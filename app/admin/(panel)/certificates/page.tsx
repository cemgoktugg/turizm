import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui";
import { CertificatesManager } from "@/components/admin/certificates-manager";

export const metadata = { title: "Belgeler" };
export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage() {
  const certificates = await prisma.documentCertificate.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <AdminPageHeader
        title="Belgeler ve Sertifikalar"
        description="TÜRSAB, Diyanet ve diğer yetki belgelerini yönetin."
      />
      <CertificatesManager certificates={certificates} />
    </div>
  );
}
