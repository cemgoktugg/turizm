import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Site Ayarları" };
export const dynamic = "force-dynamic";

const KEYS = [
  "siteName", "tagline", "logo", "footerNote",
  "phone", "whatsapp", "email", "workingHours", "address",
  "facebook", "instagram", "youtube", "twitter",
  "mapEmbed", "heroSlides",
];

export default async function AdminSettingsPage() {
  const rows = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const values = Object.fromEntries(KEYS.map((k) => [k, map[k] ?? ""]));

  return (
    <div>
      <AdminPageHeader
        title="Site Ayarları"
        description="İletişim bilgileri, sosyal medya, logo ve ana sayfa ayarlarını buradan yönetin."
      />
      <SettingsForm values={values} />
    </div>
  );
}
