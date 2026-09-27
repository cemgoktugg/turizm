"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { adminTourSchema, CURRENCIES, type AdminTourInput } from "@/lib/validations";
import { createTour, updateTour } from "@/app/actions/tours";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { FormSection, CheckboxRow } from "./form-parts";
import { GalleryPicker, ImagePicker } from "./image-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type Category = { id: string; name: string };
type HotelOption = { name: string; city: string; distance: string | null };
type FormIn = z.input<typeof adminTourSchema>;

type Props = {
  categories: Category[];
  hotels: HotelOption[];
  tourId?: string;
  slug?: string;
  defaultValues?: Partial<FormIn>;
};

const CURRENCY_LABELS: Record<(typeof CURRENCIES)[number], string> = {
  USD: "USD ($)",
  EUR: "EUR (€)",
  TRY: "TRY (₺)",
  SAR: "SAR (Riyal)",
};

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2) || d2 < d1) return null;
  return Math.round((d2 - d1) / 86_400_000);
}

export function TourForm({ categories, hotels, tourId, slug, defaultValues }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, AdminTourInput>({
    resolver: zodResolver(adminTourSchema),
    defaultValues: {
      currency: "USD",
      isPublished: true,
      isFeatured: false,
      images: [],
      prices: [],
      dayPrograms: [],
      faqs: [],
      ...defaultValues,
    },
  });
  useUnsavedChanges(isDirty);

  const prices = useFieldArray({ control, name: "prices" });
  const days = useFieldArray({ control, name: "dayPrograms" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const [departure, ret] = useWatch({ control, name: ["departureDate", "returnDate"] });
  const nights = daysBetween(departure, ret);

  const makkahHotels = hotels.filter((h) => h.city === "Mekke");
  const madinahHotels = hotels.filter((h) => h.city === "Medine");

  function fillDistance(field: "makkahDistance" | "madinahDistance", list: HotelOption[], name: string) {
    const hotel = list.find((h) => h.name === name);
    if (hotel?.distance && !getValues(field)) setValue(field, hotel.distance, { shouldDirty: true });
  }

  async function onSubmit(values: AdminTourInput) {
    const res = tourId ? await updateTour(tourId, values) : await createTour(values);
    if (res.ok) {
      toast.success(res.message);
      reset(values as unknown as FormIn);
      router.push("/admin/tours");
      router.refresh();
    } else {
      for (const [path, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(path as Parameters<typeof setError>[0], { message });
      }
      toast.error(res.message);
    }
  }

  function onInvalid() {
    toast.error("Formda eksik veya hatalı alanlar var. Kırmızı ile işaretli alanları kontrol edin.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6" noValidate>
      <datalist id="makkah-hotels">
        {makkahHotels.map((h) => (
          <option key={h.name} value={h.name} />
        ))}
      </datalist>
      <datalist id="madinah-hotels">
        {madinahHotels.map((h) => (
          <option key={h.name} value={h.name} />
        ))}
      </datalist>

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
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Slug (boş bırakılırsa otomatik)" error={errors.slug?.message}>
            <Input placeholder="13-gunluk-ekonomik-umre" {...register("slug")} />
          </Field>
          <Field label="Kısa Açıklama (kartlarda görünür)" error={errors.shortDescription?.message} className="sm:col-span-2">
            <Textarea rows={2} className="min-h-0" placeholder="Kartlarda görünecek kısa özet" {...register("shortDescription")} />
          </Field>
          <Field label="Detaylı Açıklama" error={errors.description?.message} className="sm:col-span-2">
            <Textarea rows={5} placeholder="Program hakkında detaylı bilgi" {...register("description")} />
          </Field>
        </div>
      </FormSection>

      {/* Tarih & süre */}
      <FormSection
        title="Tarih ve Süre"
        description="Gidiş tarihi geçen turlar sitedeki listelerden otomatik olarak kalkar."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Gidiş Tarihi" error={errors.departureDate?.message}>
            <Input type="date" {...register("departureDate")} />
          </Field>
          <Field label="Dönüş Tarihi" error={errors.returnDate?.message}>
            <Input type="date" min={departure || undefined} {...register("returnDate")} />
          </Field>
          <Field label="Gün" error={errors.durationDays?.message}>
            <Input type="number" min={1} {...register("durationDays")} />
          </Field>
          <Field label="Gece" error={errors.durationNights?.message}>
            <Input type="number" min={0} {...register("durationNights")} />
          </Field>
        </div>
        {nights !== null && (
          <button
            type="button"
            onClick={() => {
              setValue("durationDays", String(nights + 1), { shouldDirty: true });
              setValue("durationNights", String(nights), { shouldDirty: true });
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-gold-600"
          >
            <CalendarClock className="size-4" /> Tarihlere göre doldur: {nights + 1} gün / {nights} gece
          </button>
        )}
      </FormSection>

      {/* Konaklama & ulaşım */}
      <FormSection
        title="Konaklama ve Ulaşım"
        description="Otel adını yazarken 'Oteller' bölümündeki kayıtlı oteller önerilir; seçtiğinizde mesafe otomatik dolar."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kalkış Şehri" error={errors.departureCity?.message}>
            <Input placeholder="İstanbul" {...register("departureCity")} />
          </Field>
          <Field label="Havayolu" error={errors.airline?.message}>
            <Input placeholder="Türk Hava Yolları" {...register("airline")} />
          </Field>
          <Field label="Mekke Oteli" error={errors.makkahHotel?.message}>
            <Input
              list="makkah-hotels"
              {...register("makkahHotel", {
                onChange: (e) => fillDistance("makkahDistance", makkahHotels, e.target.value),
              })}
            />
          </Field>
          <Field label="Medine Oteli" error={errors.madinahHotel?.message}>
            <Input
              list="madinah-hotels"
              {...register("madinahHotel", {
                onChange: (e) => fillDistance("madinahDistance", madinahHotels, e.target.value),
              })}
            />
          </Field>
          <Field label="Mekke Mesafe" error={errors.makkahDistance?.message}>
            <Input placeholder="Harem'e 500 m" {...register("makkahDistance")} />
          </Field>
          <Field label="Medine Mesafe" error={errors.madinahDistance?.message}>
            <Input placeholder="Mescid-i Nebevi'ye 300 m" {...register("madinahDistance")} />
          </Field>
        </div>
      </FormSection>

      {/* Fiyat */}
      <FormSection title="Fiyat" description="Başlangıç fiyatı boş bırakılırsa sitede 'Fiyat için arayınız' yazar.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Başlangıç Fiyatı" error={errors.startingPrice?.message}>
            <Input type="number" min={0} step="0.01" placeholder="Örn. 1250" {...register("startingPrice")} />
          </Field>
          <Field label="Para Birimi" error={errors.currency?.message}>
            <Select {...register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fiyat Notu" error={errors.priceNote?.message}>
            <Input placeholder="kişi başı, 4 kişilik odada" {...register("priceNote")} />
          </Field>
        </div>
      </FormSection>

      {/* Görseller */}
      <FormSection title="Görseller" description="Kapak görseli kartlarda ve sayfa başında; galeri tur detayında gösterilir.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <Field label="Kapak Görseli" error={errors.coverImage?.message}>
            <Controller
              control={control}
              name="coverImage"
              render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} invalid={!!errors.coverImage} />}
            />
          </Field>
          <Field label="Galeri" error={errors.images?.message ?? errors.images?.root?.message}>
            <Controller
              control={control}
              name="images"
              render={({ field }) => <GalleryPicker value={field.value ?? []} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </FormSection>

      {/* Hizmetler */}
      <FormSection title="Hizmetler ve Evraklar" description="Her satıra bir madde yazın.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Dahil Olan Hizmetler" error={errors.includedServices?.message}>
            <Textarea rows={7} {...register("includedServices")} />
          </Field>
          <Field label="Dahil Olmayan Hizmetler" error={errors.excludedServices?.message}>
            <Textarea rows={7} {...register("excludedServices")} />
          </Field>
          <Field label="Gerekli Evraklar" error={errors.requiredDocuments?.message}>
            <Textarea rows={7} {...register("requiredDocuments")} />
          </Field>
        </div>
      </FormSection>

      {/* Oda fiyatları */}
      <FormSection
        title="Oda Fiyatları"
        description="Para birimi yukarıda seçilen birimle aynıdır."
        action={<AddButton onClick={() => prices.append({ roomType: "", price: "" })} label="Oda Ekle" />}
      >
        <div className="space-y-3">
          {prices.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-3">
              <Field label={i === 0 ? "Oda Tipi" : undefined} className="flex-1" error={errors.prices?.[i]?.roomType?.message}>
                <Input placeholder="4 Kişilik Oda (Kişi Başı)" {...register(`prices.${i}.roomType`)} />
              </Field>
              <Field label={i === 0 ? "Fiyat" : undefined} className="w-36" error={errors.prices?.[i]?.price?.message}>
                <Input type="number" min={0} step="0.01" {...register(`prices.${i}.price`)} />
              </Field>
              <RemoveButton onClick={() => prices.remove(i)} offset={i === 0} />
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
            onClick={() => days.append({ dayNumber: String(days.fields.length + 1), title: "", description: "" })}
            label="Gün Ekle"
          />
        }
      >
        <div className="space-y-3">
          {days.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-border bg-cream-50 p-3">
              <div className="flex items-start gap-3">
                <Field label="Gün" className="w-20" error={errors.dayPrograms?.[i]?.dayNumber?.message}>
                  <Input type="number" min={1} {...register(`dayPrograms.${i}.dayNumber`)} />
                </Field>
                <Field label="Başlık" className="flex-1" error={errors.dayPrograms?.[i]?.title?.message}>
                  <Input placeholder="Hareket ve Cidde'ye Varış" {...register(`dayPrograms.${i}.title`)} />
                </Field>
                <RemoveButton onClick={() => days.remove(i)} offset />
              </div>
              <Field label="Açıklama" className="mt-2" error={errors.dayPrograms?.[i]?.description?.message}>
                <Textarea rows={2} className="min-h-0" {...register(`dayPrograms.${i}.description`)} />
              </Field>
            </div>
          ))}
          {days.fields.length === 0 && <EmptyHint text="Henüz program günü eklenmedi." />}
        </div>
      </FormSection>

      {/* SSS */}
      <FormSection
        title="Sık Sorulan Sorular"
        description="Tur detayında ve Google arama sonuçlarında (SSS zengin sonuç) gösterilir."
        action={<AddButton onClick={() => faqs.append({ question: "", answer: "" })} label="Soru Ekle" />}
      >
        <div className="space-y-3">
          {faqs.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-border bg-cream-50 p-3">
              <div className="flex items-start gap-3">
                <Field label="Soru" className="flex-1" error={errors.faqs?.[i]?.question?.message}>
                  <Input {...register(`faqs.${i}.question`)} />
                </Field>
                <RemoveButton onClick={() => faqs.remove(i)} offset />
              </div>
              <Field label="Cevap" className="mt-2" error={errors.faqs?.[i]?.answer?.message}>
                <Textarea rows={2} className="min-h-0" {...register(`faqs.${i}.answer`)} />
              </Field>
            </div>
          ))}
          {faqs.fields.length === 0 && <EmptyHint text="Henüz soru eklenmedi." />}
        </div>
      </FormSection>

      {/* SEO */}
      <FormSection title="SEO Ayarları" description="Boş bırakılırsa tur başlığı ve kısa açıklama kullanılır.">
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
          <CheckboxRow label="Yayında (sitede görünür)" {...register("isPublished")} />
          <CheckboxRow label="Öne Çıkan (ana sayfada gösterilir)" {...register("isFeatured")} />
        </div>
      </FormSection>

      {/* Kaydet */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div>
          {tourId && slug && (
            <a
              href={`/turlar/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600"
            >
              <ExternalLink className="size-4" /> Sitede Gör
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDirty && <span className="hidden text-xs font-semibold text-amber-700 sm:inline">Kaydedilmemiş değişiklikler var</span>}
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/tours")}>
            İptal
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            {tourId ? "Değişiklikleri Kaydet" : "Turu Oluştur"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
    >
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

function RemoveButton({ onClick, offset }: { onClick: () => void; offset?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${offset ? "mt-7" : ""} grid size-10 shrink-0 place-items-center rounded-xl border border-border text-red-600 hover:bg-red-50`}
      aria-label="Kaldır"
      title="Kaldır"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted">{text}</p>;
}
