"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { FormSection } from "./form-parts";

type Values = Record<string, string>;

export function SettingsForm({ values }: { values: Values }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Values>({ defaultValues: values });

  async function onSubmit(data: Values) {
    const res = await updateSettings(data);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title="Genel">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site Adı">
            <Input {...register("siteName")} />
          </Field>
          <Field label="Slogan / Alt Başlık">
            <Input {...register("tagline")} />
          </Field>
          <Field label="Logo Yolu">
            <Input placeholder="/images/logo-mark.svg" {...register("logo")} />
          </Field>
          <Field label="Footer Notu" className="sm:col-span-2">
            <Textarea rows={2} {...register("footerNote")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="İletişim">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon">
            <Input {...register("phone")} />
          </Field>
          <Field label="WhatsApp (ülke kodu ile, ör. 905000000000)">
            <Input {...register("whatsapp")} />
          </Field>
          <Field label="E-posta">
            <Input {...register("email")} />
          </Field>
          <Field label="Çalışma Saatleri">
            <Input {...register("workingHours")} />
          </Field>
          <Field label="Adres" className="sm:col-span-2">
            <Textarea rows={2} {...register("address")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Sosyal Medya">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook">
            <Input placeholder="https://facebook.com/..." {...register("facebook")} />
          </Field>
          <Field label="Instagram">
            <Input placeholder="https://instagram.com/..." {...register("instagram")} />
          </Field>
          <Field label="YouTube">
            <Input placeholder="https://youtube.com/..." {...register("youtube")} />
          </Field>
          <Field label="X (Twitter)">
            <Input placeholder="https://x.com/..." {...register("twitter")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Harita ve Ana Sayfa" description="Hero slaytları için her satıra bir görsel yolu yazın.">
        <div className="grid gap-4">
          <Field label="Google Maps Embed URL">
            <Input placeholder="https://www.google.com/maps/embed?..." {...register("mapEmbed")} />
          </Field>
          <Field label="Hero Slayt Görselleri (her satıra bir URL)">
            <Textarea rows={3} placeholder={"/images/hero-1.svg\n/images/hero-2.svg"} {...register("heroSlides")} />
          </Field>
        </div>
      </FormSection>

      <div className="sticky bottom-0 flex justify-end border-t border-border bg-cream-100/90 py-4 backdrop-blur">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          Ayarları Kaydet
        </Button>
      </div>
    </form>
  );
}
