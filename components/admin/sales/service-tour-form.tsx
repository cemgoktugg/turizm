"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { serviceTourSchema, CURRENCIES, type ServiceTourInput } from "@/lib/validations";
import { createServiceTour, updateServiceTour } from "@/app/actions/sales";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { FormSection, CheckboxRow } from "../form-parts";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { FormFooter } from "./form-footer";

type FormIn = z.input<typeof serviceTourSchema>;

/** Gidiş-dönüş arasındaki gün sayısı (iki uç dahil) */
function dayCount(from?: unknown, to?: unknown) {
  const a = new Date(String(from ?? "")).getTime();
  const b = new Date(String(to ?? "")).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

export function ServiceTourForm({
  tourId,
  defaultValues,
  staff,
  periods,
}: {
  tourId?: number;
  defaultValues?: Partial<FormIn>;
  staff: { id: number; fullName: string }[];
  periods: string[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<FormIn, unknown, ServiceTourInput>({
    resolver: zodResolver(serviceTourSchema),
    defaultValues: { currency: "USD", isActive: true, ...defaultValues },
  });
  useUnsavedChanges(isDirty);

  // Gün alanı elle değiştirilmediyse tarihlerden otomatik hesaplanır
  // (düzenlemede kayıtlı değer, tarihlere dokunulmadıkça korunur)
  const [dep, ret] = useWatch({ control, name: ["departureDate", "returnDate"] });
  const initialDates = useRef(`${defaultValues?.departureDate}|${defaultValues?.returnDate}`);
  useEffect(() => {
    if (`${dep}|${ret}` === initialDates.current) return;
    const n = dayCount(dep, ret);
    if (n && !dirtyFields.days && String(getValues("days") ?? "") !== String(n)) setValue("days", String(n));
  }, [dep, ret, dirtyFields.days, getValues, setValue]);

  async function onSubmit(values: ServiceTourInput) {
    const res = tourId ? await updateServiceTour(String(tourId), values) : await createServiceTour(values);
    if (!res.ok) return void toast.error(res.message);
    toast.success(res.message);
    reset(getValues());
    router.push("/admin/satis/turlar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))} className="space-y-6" noValidate>
      <FormSection title="Tur Bilgileri" description="Satışlar bu turlara yapılır. Dönem, satış listesindeki dönem süzgecinde kullanılır.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tur Adı" required error={errors.name?.message} className="sm:col-span-2">
            <Input placeholder="15 Günlük Ekonomik Umre" {...register("name")} autoFocus />
          </Field>
          <Field label="Dönem" required error={errors.period?.message} className="sm:col-span-2">
            <Input list="donemler" placeholder="2026 Ramazan Umresi" {...register("period")} />
            <datalist id="donemler">
              {periods.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Gidiş Tarihi" required error={errors.departureDate?.message}>
            <Input type="date" {...register("departureDate")} />
          </Field>
          <Field label="Dönüş Tarihi" required error={errors.returnDate?.message}>
            <Input type="date" {...register("returnDate")} />
          </Field>
          <Field label="Gün" required error={errors.days?.message}>
            <Input type="number" min={1} {...register("days")} />
          </Field>
          <Field label="Konaklama Yeri" error={errors.accommodation?.message} className="sm:col-span-2 lg:col-span-1">
            <Input placeholder="Mekke: ..., Medine: ..." {...register("accommodation")} />
          </Field>
          <Field label="Görevli 1" required error={errors.guide1Id?.message}>
            <Select {...register("guide1Id")}>
              <option value="">Seçiniz</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Görevli 2" error={errors.guide2Id?.message}>
            <Select {...register("guide2Id")}>
              <option value="">Yok</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Açıklama" error={errors.note?.message} className="sm:col-span-2 lg:col-span-4">
            <Textarea rows={3} {...register("note")} />
          </Field>
        </div>
        <div className="mt-5">
          <CheckboxRow label="Aktif (yeni satışta listelenir)" {...register("isActive")} />
        </div>
      </FormSection>
      <FormSection title="Oda Fiyatları" description="Kişi başı ücretler. Boş bırakılan oda tipi satışta seçilemez.">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Tek Kişilik Oda" required error={errors.price?.message}>
            <Input type="number" min={0} step={1} {...register("price")} />
          </Field>
          <Field label="2 Kişilik Oda" error={errors.price2?.message}>
            <Input type="number" min={0} step={1} {...register("price2")} />
          </Field>
          <Field label="3 Kişilik Oda" error={errors.price3?.message}>
            <Input type="number" min={0} step={1} {...register("price3")} />
          </Field>
          <Field label="4 Kişilik Oda" error={errors.price4?.message}>
            <Input type="number" min={0} step={1} {...register("price4")} />
          </Field>
          <Field label="Para Birimi" required error={errors.currency?.message}>
            <Select {...register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>
      <FormFooter cancelHref="/admin/satis/turlar" submitting={isSubmitting} label={tourId ? "Kaydet" : "Tur Ekle"} />
    </form>
  );
}
