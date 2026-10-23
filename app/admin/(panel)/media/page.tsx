import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui";
import { MediaManager } from "@/components/admin/media-manager";

export const metadata = { title: "Medya" };

export default async function AdminMediaPage() {
  const rows = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  const items = rows.map((m) => ({
    id: m.id,
    url: m.url,
    originalName: m.originalName,
    mimeType: m.mimeType,
    alt: m.alt,
    width: m.width,
    height: m.height,
    size: m.size,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Medya Kütüphanesi"
        description="Yüklediğiniz görseller tüm formlardaki görsel seçicide, videolar hikayelerde kullanılabilir. Sitede kullanılan dosyalar silinemez."
      />
      <MediaManager items={items} />
    </div>
  );
}
