"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, ExternalLink, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { landingSchema, type LandingInput } from "@/lib/validations";
import { createLandingPage, updateLandingPage } from "@/app/actions/landing";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { Prose } from "@/components/site/prose";
import { cn } from "@/lib/utils";
import { FormSection, CheckboxRow } from "./form-parts";
import { ImagePicker } from "./image-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type FormIn = z.input<typeof landingSchema>;

const SORT_LABELS: Record<LandingInput["toursSort"], string> = {
  onerilen: "Önerilen (öne çıkanlar önce)",
  tarih: "En yakın tarih",
  "fiyat-artan": "En düşük fiyat",
  "fiyat-azalan": "En yüksek fiyat",
};

export function LandingForm({
  pageId,
  slug,
  categories,
  siteUrl,
  defaultValues,
}: {
  pageId?: string;
  slug?: string;
  categories: { name: string; slug: string }[];
  siteUrl: string;
  defaultValues?: Partial<FormIn>;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, LandingInput>({
    resolver: zodResolver(landingSchema),
    defaultValues: { isPublished: true, toursSort: "onerilen", tourCategories: [], faqs: [], ...defaultValues },
  });
  useUnsavedChanges(isDirty);
  const faqs = useFieldArray({ control, name: "faqs" });
  const content = useWatch({ control, name: "content" }) ?? "";
  const slugValue = useWatch({ control, name: "slug" });

  async function onSubmit(values: LandingInput) {
    const res = pageId ? await updateLandingPage(pageId, values) : await createLandingPage(values);
    if (res.ok) {
      toast.success(res.message);
      reset(values as unknown as FormIn);
      router.push("/admin/landing");
      router.refresh();
    } else {
      toast.error(res.fieldErrors?.slug ? `${res.message} ${res.fieldErrors.slug}` : res.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))}
      className="space-y-6"
      noValidate
    >
      <FormSection title="Sayfa Bilgileri" description="Sayfa sitenin kök adresinde yayınlanır, örneğin alanadi.com/sivas-umre.">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Başlık" required error={errors.title?.message} className="sm:col-span-2">
              <Input placeholder="Sivas'tan Umre Turları" {...register("title")} />
            </Field>
            <Field label="Adres (boş = başlıktan otomatik)" error={errors.slug?.message} className="sm:col-span-2">
              <div className="flex items-center overflow-hidden rounded-xl border border-border bg-cream-50 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                <span className="hidden shrink-0 pl-4 text-sm text-muted sm:block">{siteUrl.replace(/^https?:\/\//, "")}/</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
                  placeholder="sivas-umre"
                  {...register("slug")}
                />
              </div>
              {slugValue && <p className="mt-1 text-xs text-muted">Adresi değiştirirseniz eski adres çalışmaz; yayındaki sayfalarda dikkatli olun.</p>}
            </Field>
            <Field label="Başlık altı kısa açıklama" error={errors.description?.message} className="sm:col-span-2">
              <Textarea rows={3} className="min-h-0" {...register("description")} />
            </Field>
          </div>
          <Field label="Üst görsel" error={errors.image?.message}>
            <Controller
              control={control}
              name="image"
              render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Sayfa Metni"
        description="Biçimlendirme: ## Başlık, - madde, **kalın**, [bağlantı metni](/adres). {marka}, {adres}, {telefon} Site Ayarları'ndan doldurulur."
        action={
          <div className="inline-flex rounded-full border border-border bg-cream-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1", !preview ? "bg-brand-700 text-white" : "text-brand-800")}
            >
              <Pencil className="size-3.5" /> Yaz
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1", preview ? "bg-brand-700 text-white" : "text-brand-800")}
            >
              <Eye className="size-3.5" /> Önizle
            </button>
          </div>
        }
      >
        <Field error={errors.content?.message}>
          <Textarea rows={18} className={cn("font-mono text-[13px]", preview && "hidden")} {...register("content")} />
          {preview && (
            <div className="min-h-[300px] rounded-xl border border-border bg-white px-6 py-2">
              {content.trim() ? <Prose content={content} /> : <p className="py-10 text-center text-sm text-muted">Metin boş.</p>}
            </div>
          )}
        </Field>
      </FormSection>

      <FormSection title="Listelenecek Turlar" description="Metnin altında, seçtiğiniz kategorilerdeki kayıt alınan turlar otomatik listelenir.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Kategoriler (hiçbiri seçilmezse tüm turlar)">
            <Controller
              control={control}
              name="tourCategories"
              render={({ field }) => {
                const value = field.value ?? [];
                return (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const on = value.includes(c.slug);
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          aria-pressed={on}
                          onClick={() => field.onChange(on ? value.filter((v) => v !== c.slug) : [...value, c.slug])}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                            on ? "border-brand-700 bg-brand-700 text-white" : "border-border bg-white text-brand-800 hover:bg-brand-50",
                          )}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kelimeyle süz (isteğe bağlı)" error={errors.tourSearch?.message}>
              <Input placeholder="ör. Sivas, Ramazan, 15 gün" {...register("tourSearch")} />
            </Field>
            <Field label="Sıralama">
              <Select {...register("toursSort")}>
                {Object.entries(SORT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tur listesi başlığı (boş = varsayılan)" error={errors.toursTitle?.message} className="sm:col-span-2">
              <Input placeholder="Kayıt Alınan Umre Programlarımız" {...register("toursTitle")} />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Sık Sorulan Sorular"
        description="Sayfanın altında gösterilir ve Google'da soru-cevap olarak öne çıkabilir."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => faqs.append({ question: "", answer: "" })}>
            <Plus className="size-4" /> Soru Ekle
          </Button>
        }
      >
        {faqs.fields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-cream-50 p-5 text-center text-sm text-muted">Henüz soru eklenmedi.</p>
        ) : (
          <ol className="space-y-3">
            {faqs.fields.map((f, i) => (
              <li key={f.id} className="rounded-2xl border border-border bg-cream-50/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">Soru {i + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" disabled={i === 0} onClick={() => faqs.move(i, i - 1)} className="grid size-8 place-items-center rounded-lg text-brand-700 hover:bg-white disabled:opacity-30" aria-label="Yukarı taşı">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" disabled={i === faqs.fields.length - 1} onClick={() => faqs.move(i, i + 1)} className="grid size-8 place-items-center rounded-lg text-brand-700 hover:bg-white disabled:opacity-30" aria-label="Aşağı taşı">
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => faqs.remove(i)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label="Soruyu sil">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Field error={errors.faqs?.[i]?.question?.message}>
                    <Input placeholder="Soru" {...register(`faqs.${i}.question`)} />
                  </Field>
                  <Field error={errors.faqs?.[i]?.answer?.message}>
                    <Textarea rows={3} className="min-h-0" placeholder="Cevap" {...register(`faqs.${i}.answer`)} />
                  </Field>
                </div>
              </li>
            ))}
          </ol>
        )}
      </FormSection>

      <FormSection title="SEO ve Yayın" description="SEO alanları boş bırakılırsa başlık ve kısa açıklama kullanılır.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO Başlık" error={errors.seoTitle?.message}>
            <Input {...register("seoTitle")} />
          </Field>
          <Field label="SEO Açıklama" error={errors.seoDescription?.message}>
            <Input {...register("seoDescription")} />
          </Field>
        </div>
        <div className="mt-4">
          <CheckboxRow label="Yayında (işaretsizse taslak olarak kalır)" {...register("isPublished")} />
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div>
          {pageId && slug && (
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
              <ExternalLink className="size-4" /> Sitede Gör
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/landing")}>
            İptal
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            {pageId ? "Kaydet" : "Sayfa Oluştur"}
          </Button>
        </div>
      </div>
    </form>
  );
}
