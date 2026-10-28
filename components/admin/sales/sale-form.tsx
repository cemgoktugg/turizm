"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saleSchema, PAYMENT_METHODS, type SaleInput } from "@/lib/validations";
import { createSale, updateSale, type CustomerOption } from "@/app/actions/sales";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { FormSection } from "../form-parts";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { FormFooter } from "./form-footer";
import { CustomerPicker } from "./customer-picker";
import { currencySymbol } from "@/lib/utils";

type FormIn = z.input<typeof saleSchema>;

export type SaleTourOption = {
  id: number;
  name: string;
  period: string;
  price: number;
  currency: string;
  departure: string;
  isActive: boolean;
};

export function SaleForm({
  saleId,
  tours,
  customer,
  defaultValues,
  paid = 0,
}: {
  saleId?: number;
  tours: SaleTourOption[];
  customer?: CustomerOption | null;
  defaultValues?: Partial<FormIn>;
  /** Düzenlemede: şimdiye kadar tahsil edilen */
  paid?: number;
}) {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(customer ?? null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<FormIn, unknown, SaleInput>({
    resolver: zodResolver(saleSchema),
    defaultValues: { downPaymentMethod: "Nakit", ...defaultValues },
  });
  useUnsavedChanges(isDirty);

  const tourId = useWatch({ control, name: "tourId" });
  const tour = tours.find((t) => String(t.id) === String(tourId ?? ""));
  const cur = tour ? currencySymbol(tour.currency).trim() : "";

  // Dönemlere göre gruplu tur listesi
  const groups = tours.reduce<Record<string, SaleTourOption[]>>((acc, t) => {
    (acc[t.period] ??= []).push(t);
    return acc;
  }, {});

  async function onSubmit(values: SaleInput) {
    const res = saleId ? await updateSale(String(saleId), values) : await createSale(values);
    if (!res.ok) return void toast.error(res.message);
    toast.success(res.message);
    reset(getValues());
    const id = saleId ?? (res.data as { id: number } | undefined)?.id;
    router.push(id ? `/admin/satis/${id}` : "/admin/satis");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))} className="space-y-6" noValidate>
      <FormSection title="Satış Bilgileri">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Müşteri" required error={errors.customerId?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <CustomerPicker
                  value={selectedCustomer}
                  invalid={!!errors.customerId}
                  onChange={(c) => {
                    setSelectedCustomer(c);
                    field.onChange(c ? String(c.id) : "");
                  }}
                />
              )}
            />
          </Field>
          <Field label="Tur" required error={errors.tourId?.message} className="sm:col-span-2">
            <Select
              {...register("tourId", {
                onChange: (e) => {
                  // Yeni satışta ücret elle değiştirilmediyse turun standart ücretini öner
                  const t = tours.find((x) => String(x.id) === e.target.value);
                  if (t && !saleId && !dirtyFields.price) setValue("price", String(t.price));
                },
              })}
            >
              <option value="">Tur seçiniz</option>
              {Object.entries(groups).map(([period, list]) => (
                <optgroup key={period} label={period}>
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} {t.name} · {t.departure}
                      {t.isActive ? "" : " (pasif)"}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Satış Tarihi" required error={errors.date?.message}>
            <Input type="date" {...register("date")} />
          </Field>
          <Field label="Oda Kişi Sayısı" error={errors.roomSize?.message}>
            <Select {...register("roomSize")}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} kişilik oda
                </option>
              ))}
            </Select>
          </Field>
          <Field label={`Ücret${cur ? ` (${cur})` : ""}`} required error={errors.price?.message}>
            <Input type="number" min={0} step={1} {...register("price")} />
          </Field>
          <Field label="Referans" error={errors.reference?.message}>
            <Input placeholder="Kim yönlendirdi?" {...register("reference")} />
          </Field>
          <Field label="Açıklama" error={errors.note?.message} className="sm:col-span-2 lg:col-span-4">
            <Textarea rows={2} {...register("note")} />
          </Field>
        </div>
        {saleId && paid > 0 && (
          <p className="mt-4 text-xs text-muted">
            Bu satışa {paid.toLocaleString("tr-TR")} {cur} tahsilat yapılmış; ücret bu tutarın altına düşürülemez.
          </p>
        )}
      </FormSection>

      {!saleId && (
        <FormSection title="Peşinat" description="İsteğe bağlı. Girilirse satış tarihiyle ilk tahsilat olarak kaydedilir.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={`Peşinat Tutarı${cur ? ` (${cur})` : ""}`} error={errors.downPayment?.message}>
              <Input type="number" min={0} step={1} {...register("downPayment")} />
            </Field>
            <Field label="Ödeme Şekli" error={errors.downPaymentMethod?.message}>
              <Select {...register("downPaymentMethod")}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>
      )}

      <FormFooter cancelHref={saleId ? `/admin/satis/${saleId}` : "/admin/satis"} submitting={isSubmitting} label={saleId ? "Kaydet" : "Satışı Kaydet"} />
    </form>
  );
}
