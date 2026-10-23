"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateSettings } from "@/app/actions/settings";
import { settingsSchema, extractMapSrc, type SettingsInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { FormSection } from "./form-parts";
import { ImagePicker } from "./image-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type FormIn = z.input<typeof settingsSchema>;

export function SettingsForm({ values }: { values: SettingsInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: values });
  useUnsavedChanges(isDirty);
  const mapValue = useWatch({ control, name: "mapEmbed" }) ?? "";
  const mapSrc = extractMapSrc(mapValue);
  const seoTitle = useWatch({ control, name: "seoTitle" }) ?? "";
  const seoDescription = useWatch({ control, name: "seoDescription" }) ?? "";

  async function onSubmit(data: SettingsInput) {
    const res = await updateSettings(data);
    if (res.ok) {
      toast.success(res.message);
      reset(data);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))}
      className="space-y-6"
      noValidate
    >
      <FormSection title="Genel" description="Site adı ve logo; üst menü, footer, panel ve tarayıcı sekmesinde kullanılır.">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site Adı" required error={errors.siteName?.message}>
              <Input {...register("siteName")} />
            </Field>
            <Field label="Slogan / Alt Başlık" error={errors.tagline?.message}>
              <Input {...register("tagline")} />
            </Field>
            <Field label="Footer Tanıtım Metni" error={errors.footerNote?.message} className="sm:col-span-2">
              <Textarea rows={3} className="min-h-0" {...register("footerNote")} />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Logo (açık zemin — üst menü)" error={errors.logo?.message}>
              <Controller
                control={control}
                name="logo"
                render={({ field }) => (
                  <ImagePicker value={field.value} onChange={field.onChange} aspect="wide" surface="light" contain />
                )}
              />
            </Field>
            <Field label="Logo (koyu zemin — footer ve panel)" error={errors.logoLight?.message}>
              <Controller
                control={control}
                name="logoLight"
                render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} aspect="wide" contain />}
              />
              <p className="mt-1 text-xs text-muted">Koyu arka planda okunacak, yazısı açık renkli sürüm. Boşsa üstteki logo kullanılır.</p>
            </Field>
            <Field label="Favicon (tarayıcı sekme ikonu)" error={errors.favicon?.message}>
              <Controller
                control={control}
                name="favicon"
                render={({ field }) => (
                  <ImagePicker value={field.value} onChange={field.onChange} aspect="square" surface="light" contain />
                )}
              />
              <p className="mt-1 text-xs text-muted">Kare bir görsel seçin (en az 64×64 px).</p>
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="İletişim" description="Üst bar, footer, iletişim sayfası, WhatsApp butonları ve mobil alt çubukta kullanılır.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" required error={errors.phone?.message}>
            <Input placeholder="+90 850 000 00 00" {...register("phone")} />
          </Field>
          <Field label="WhatsApp (ülke kodu ile)" required error={errors.whatsapp?.message}>
            <Input placeholder="905xxxxxxxxx" inputMode="tel" {...register("whatsapp")} />
          </Field>
          <Field label="E-posta" required error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Çalışma Saatleri" error={errors.workingHours?.message}>
            <Input {...register("workingHours")} />
          </Field>
          <Field label="Adres" error={errors.address?.message} className="sm:col-span-2">
            <Textarea rows={2} className="min-h-0" {...register("address")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Sosyal Medya" description="Boş bırakılan hesaplar sitede gösterilmez.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook" error={errors.facebook?.message}>
            <Input placeholder="https://facebook.com/..." {...register("facebook")} />
          </Field>
          <Field label="Instagram" error={errors.instagram?.message}>
            <Input placeholder="https://instagram.com/..." {...register("instagram")} />
          </Field>
          <Field label="YouTube" error={errors.youtube?.message}>
            <Input placeholder="https://youtube.com/..." {...register("youtube")} />
          </Field>
          <Field label="X (Twitter)" error={errors.twitter?.message}>
            <Input placeholder="https://x.com/..." {...register("twitter")} />
          </Field>
          <Field label="TikTok" error={errors.tiktok?.message}>
            <Input placeholder="https://tiktok.com/@..." {...register("tiktok")} />
          </Field>
          <Field label="LinkedIn" error={errors.linkedin?.message}>
            <Input placeholder="https://linkedin.com/company/..." {...register("linkedin")} />
          </Field>
          <Field label="Telegram" error={errors.telegram?.message}>
            <Input placeholder="https://t.me/..." {...register("telegram")} />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Harita"
        description="Google Haritalar'da işletmenizi açın → Paylaş → Haritayı yerleştir → HTML'yi kopyala. Kodu olduğu gibi buraya yapıştırabilirsiniz."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Harita kodu veya embed adresi" error={errors.mapEmbed?.message}>
            <Textarea rows={5} className="font-mono text-xs" placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>' {...register("mapEmbed")} />
          </Field>
          <div className="overflow-hidden rounded-2xl border border-border bg-cream-50">
            {mapSrc && /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(mapSrc) ? (
              <iframe src={mapSrc} title="Harita önizleme" className="h-full min-h-[200px] w-full" loading="lazy" />
            ) : (
              <div className="grid h-full min-h-[200px] place-items-center p-4 text-center text-sm text-muted">
                Geçerli bir harita kodu girildiğinde önizleme burada görünür.
              </div>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="SEO (Ana Sayfa ve Genel)" description="Ana sayfanın Google'daki başlığı/açıklaması ve sosyal medyada paylaşım görseli.">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Field label={`Site başlığı (${seoTitle.length}/60 önerilen)`} error={errors.seoTitle?.message}>
              <Input {...register("seoTitle")} />
            </Field>
            <Field label={`Site açıklaması (${seoDescription.length}/155 önerilen)`} error={errors.seoDescription?.message}>
              <Textarea rows={3} className="min-h-0" {...register("seoDescription")} />
            </Field>
            <Field label="Anahtar kelimeler (virgülle ayırın)" error={errors.seoKeywords?.message}>
              <Input {...register("seoKeywords")} />
            </Field>
            {/* Google önizlemesi */}
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Google önizlemesi</p>
              <p className="mt-2 truncate text-lg text-[#1a0dab]">{seoTitle || "Site başlığı"}</p>
              <p className="line-clamp-2 text-sm text-[#4d5156]">{seoDescription || "Site açıklaması"}</p>
            </div>
          </div>
          <Field label="Paylaşım görseli (Open Graph)" error={errors.ogImage?.message}>
            <Controller
              control={control}
              name="ogImage"
              render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} />}
            />
            <p className="mt-1 text-xs text-muted">Önerilen boyut 1200×630 px (JPG/PNG).</p>
          </Field>
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        {isDirty && <span className="text-xs font-semibold text-amber-700">Kaydedilmemiş değişiklikler var</span>}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          Ayarları Kaydet
        </Button>
      </div>
    </form>
  );
}
