"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { adminTourSchema, type AdminTourInput } from "@/lib/validations";
import { createTour, updateTour } from "@/app/actions/tours";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { FormSection, CheckboxRow } from "./form-parts";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  tourId?: string;
  defaultValues?: Partial<z.input<typeof adminTourSchema>>;
};

export function TourForm({ categories, tourId, defaultValues }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof adminTourSchema>, unknown, AdminTourInput>({
    resolver: zodResolver(adminTourSchema),
    defaultValues: {
      currency: "USD",
      isPublished: true,
      isFeatured: false,
      prices: [{ roomType: "", price: 0 }],
      dayPrograms: [],
      faqs: [],
      ...defaultValues,
    },
  });

  const prices = useFieldArray({ control, name: "prices" });
  const days = useFieldArray({ control, name: "dayPrograms" });
  const faqs = useFieldArray({ control, name: "faqs" });

  async function onSubmit(values: AdminTourInput) {
    const res = tourId
      ? await updateTour(tourId, values)
      : await createTour(values);
    if (res.ok) {
      toast.success(res.message);
      router.push("/admin/tours");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Temel bilgiler */}
      <FormSection title="Temel Bilgiler" description="Turun adı, kategorisi ve açıklaması.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tur Başlığı" required error={errors.title?.message} className="sm:col-span-2">
            <Input placeholder="Örn. 13 Günlük Ekonomik Umre" {...register("title")} />
          </Field>
          <Field label="Kategori" required error={errors.categoryId?.message}>
            <Select {...register("categoryId")}>
              <option value="">Kategori seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Slug (boş bırakılırsa otomatik)" error={errors.slug?.message}>
            <Input placeholder="13-gunluk-ekonomik-umre" {...register("slug")} />
          </Field>
          <Field label="Kısa Açıklama" error={errors.shortDescription?.message} className="sm:col-span-2">
            <Textarea rows={2} placeholder="Kartlarda görünecek kısa özet" {...register("shortDescription")} />
          </Field>
          <Field label="Detaylı Açıklama" error={errors.description?.message} className="sm:col-span-2">
            <Textarea rows={4} placeholder="Program hakkında detaylı bilgi" {...register("description")} />
          </Field>
        </div>
      </FormSection>

      {/* Tarih & süre */}
      <FormSection title="Tarih ve Süre">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Gidiş Tarihi" error={errors.departureDate?.message}>
            <Input type="date" {...register("departureDate")} />
          </Field>
          <Field label="Dönüş Tarihi" error={errors.returnDate?.message}>
            <Input type="date" {...register("returnDate")} />
          </Field>
          <Field label="Gün" error={errors.durationDays?.message}>
            <Input type="number" min={0} {...register("durationDays")} />
          </Field>
          <Field label="Gece" error={errors.durationNights?.message}>
            <Input type="number" min={0} {...register("durationNights")} />
          </Field>
        </div>
      </FormSection>

      {/* Konaklama & ulaşım */}
      <FormSection title="Konaklama ve Ulaşım">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kalkış Şehri" error={errors.departureCity?.message}>
            <Input placeholder="İstanbul" {...register("departureCity")} />
          </Field>
          <Field label="Havayolu" error={errors.airline?.message}>
            <Input placeholder="Türk Hava Yolları" {...register("airline")} />
          </Field>
          <Field label="Mekke Oteli" error={errors.makkahHotel?.message}>
            <Input {...register("makkahHotel")} />
          </Field>
          <Field label="Medine Oteli" error={errors.madinahHotel?.message}>
            <Input {...register("madinahHotel")} />
          </Field>
          <Field label="Mekke Mesafe" error={errors.makkahDistance?.message}>
            <Input placeholder="Harem'e 500 m" {...register("makkahDistance")} />
          </Field>
          <Field label="Medine Mesafe" error={errors.madinahDistance?.message}>
            <Input placeholder="Mescid-i Nebevi'ye 300 m" {...register("madinahDistance")} />
          </Field>
        </div>
      </FormSection>

      {/* Fiyat & görseller */}
      <FormSection title="Fiyat ve Görseller">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Başlangıç Fiyatı" error={errors.startingPrice?.message}>
            <Input type="number" min={0} step="0.01" {...register("startingPrice")} />
          </Field>
          <Field label="Para Birimi" error={errors.currency?.message}>
            <Select {...register("currency")}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="TRY">TRY (₺)</option>
            </Select>
          </Field>
          <Field label="Kapak Görseli (yol)" error={errors.coverImage?.message}>
            <Input placeholder="/images/tur-ornek.svg" {...register("coverImage")} />
          </Field>
          <Field label="Galeri Görselleri (her satıra bir URL)" error={errors.images?.message} className="lg:col-span-3">
            <Textarea rows={3} placeholder={"/images/1.svg\n/images/2.svg"} {...register("images")} />
          </Field>
        </div>
      </FormSection>

      {/* Hizmetler */}
      <FormSection title="Hizmetler ve Evraklar" description="Her satıra bir madde yazın.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Dahil Olan Hizmetler">
            <Textarea rows={6} {...register("includedServices")} />
          </Field>
          <Field label="Dahil Olmayan Hizmetler">
            <Textarea rows={6} {...register("excludedServices")} />
          </Field>
          <Field label="Gerekli Evraklar">
            <Textarea rows={6} {...register("requiredDocuments")} />
          </Field>
        </div>
      </FormSection>

      {/* Oda fiyatları */}
      <FormSection
        title="Oda Fiyatları"
        action={
          <AddButton onClick={() => prices.append({ roomType: "", price: 0 })} label="Oda Ekle" />
        }
      >
        <div className="space-y-3">
          {prices.fields.map((f, i) => (
            <div key={f.id} className="flex items-end gap-3">
              <Field label={i === 0 ? "Oda Tipi" : undefined} className="flex-1">
                <Input placeholder="4 Kişilik Oda (Kişi Başı)" {...register(`prices.${i}.roomType`)} />
              </Field>
              <Field label={i === 0 ? "Fiyat" : undefined} className="w-36">
                <Input type="number" min={0} step="0.01" {...register(`prices.${i}.price`)} />
              </Field>
              <RemoveButton onClick={() => prices.remove(i)} />
            </div>
          ))}
          {prices.fields.length === 0 && <EmptyHint text="Henüz oda fiyatı eklenmedi." />}
        </div>
      </FormSection>

      {/* Gün gün program */}
      <FormSection
        title="Gün Gün Program"
        action={
          <AddButton
            onClick={() => days.append({ dayNumber: days.fields.length + 1, title: "", description: "" })}
            label="Gün Ekle"
          />
        }
      >
        <div className="space-y-3">
          {days.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-border bg-cream-50 p-3">
              <div className="flex items-end gap-3">
                <Field label="Gün" className="w-20">
                  <Input type="number" min={1} {...register(`dayPrograms.${i}.dayNumber`)} />
                </Field>
                <Field label="Başlık" className="flex-1">
                  <Input placeholder="Hareket ve Cidde'ye Varış" {...register(`dayPrograms.${i}.title`)} />
                </Field>
                <RemoveButton onClick={() => days.remove(i)} />
              </div>
              <Field label="Açıklama" className="mt-2">
                <Textarea rows={2} {...register(`dayPrograms.${i}.description`)} />
              </Field>
            </div>
          ))}
          {days.fields.length === 0 && <EmptyHint text="Henüz program günü eklenmedi." />}
        </div>
      </FormSection>

      {/* SSS */}
      <FormSection
        title="Sık Sorulan Sorular"
        action={<AddButton onClick={() => faqs.append({ question: "", answer: "" })} label="Soru Ekle" />}
      >
        <div className="space-y-3">
          {faqs.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-border bg-cream-50 p-3">
              <div className="flex items-end gap-3">
                <Field label="Soru" className="flex-1">
                  <Input {...register(`faqs.${i}.question`)} />
                </Field>
                <RemoveButton onClick={() => faqs.remove(i)} />
              </div>
              <Field label="Cevap" className="mt-2">
                <Textarea rows={2} {...register(`faqs.${i}.answer`)} />
              </Field>
            </div>
          ))}
          {faqs.fields.length === 0 && <EmptyHint text="Henüz soru eklenmedi." />}
        </div>
      </FormSection>

      {/* SEO */}
      <FormSection title="SEO Ayarları">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO Başlık" error={errors.seoTitle?.message}>
            <Input {...register("seoTitle")} />
          </Field>
          <Field label="SEO Açıklama" error={errors.seoDescription?.message}>
            <Input {...register("seoDescription")} />
          </Field>
        </div>
      </FormSection>

      {/* Yayın durumu */}
      <FormSection title="Yayın Durumu">
        <div className="flex flex-wrap gap-6">
          <CheckboxRow label="Yayında" {...register("isPublished")} />
          <CheckboxRow label="Öne Çıkan" {...register("isFeatured")} />
        </div>
      </FormSection>

      {/* Kaydet */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-border bg-cream-100/90 py-4 backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/tours")}>
          İptal
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          {tourId ? "Değişiklikleri Kaydet" : "Turu Oluştur"}
        </Button>
      </div>
    </form>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
    >
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-border text-red-600 hover:bg-red-50"
      aria-label="Kaldır"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted">{text}</p>;
}
