import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";
import type { SettingsInput } from "@/lib/validations";

export const metadata = { title: "Site Ayarları" };

export default async function AdminSettingsPage() {
  const { raw: _raw, ...values } = await getSettings();
  void _raw;

  return (
    <div>
      <AdminPageHeader
        title="Site Ayarları"
        description="İletişim bilgileri, sosyal medya, logo, harita ve SEO ayarları. Sayfa metinleri için 'Sayfa İçerikleri' menüsünü kullanın."
      />
      <SettingsForm values={values as SettingsInput} />
    </div>
  );
}
