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
import { currencySymbol, formatPrice } from "@/lib/utils";
import { useSalesBase } from "./use-sales-base";

type FormIn = z.input<typeof saleSchema>;

export type SaleTourOption = {
  id: number;
  name: string;
  period: string;
  /** Oda kişi sayısı → kişi başı ücret (yalnızca fiyatı girilmiş oda tipleri) */
  prices: Record<number, number>;
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
  references,
  people = [],
}: {
  saleId?: number;
  tours: SaleTourOption[];
  customer?: CustomerOption | null;
  defaultValues?: Partial<FormIn>;
  /** Düzenlemede: şimdiye kadar tahsil edilen */
  paid?: number;
  /** Referans alanındaki öneriler (daha önce girilenler) */
  references: string[];
  /** Yeni satışta: peşinatı alabilecek kişiler */
  people?: string[];
}) {
  const router = useRouter();
  const base = useSalesBase();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(customer ?? null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, SaleInput>({
    resolver: zodResolver(saleSchema),
    defaultValues: { downPaymentMethod: "Nakit", ...defaultValues },
  });
  useUnsavedChanges(isDirty);
  // Ücret elle yazıldıysa tur değişince üzerine yazılmaz
  const [priceEdited, setPriceEdited] = useState(false);

  const [tourId, roomSize] = useWatch({ control, name: ["tourId", "roomSize"] });
  const tour = tours.find((t) => String(t.id) === String(tourId ?? ""));
  const cur = tour ? currencySymbol(tour.currency).trim() : "";

  // Oda seçenekleri: turun fiyatı girilmiş oda tipleri (+ kayıtlı satışın eski değeri)
  const roomSizes = tour ? Object.keys(tour.prices).map(Number) : [2, 3, 4];
  const currentRoom = Number(roomSize);
  if (currentRoom && !roomSizes.includes(currentRoom)) roomSizes.push(currentRoom);
  roomSizes.sort((a, b) => a - b);

  /** Seçili tur ve oda tipine göre kişi başı ücret; oda seçilmediyse turun ilk oda fiyatı */
  const priceFor = (t: SaleTourOption, size: number) => t.prices[size] ?? Object.values(t.prices)[0];

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
    router.push(id ? `${base}/${id}` : base);
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
                  // Yeni satışta ücret elle değiştirilmediyse turun seçili oda tipindeki ücretini öner
                  const t = tours.find((x) => String(x.id) === e.target.value);
                  if (!t || saleId) return;
                  const size = Number(getValues("roomSize"));
                  if (size && t.prices[size] == null) setValue("roomSize", "");
                  if (!priceEdited) setValue("price", String(priceFor(t, size)));
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
            <Select
              {...register("roomSize", {
                onChange: (e) => {
                  // Oda tipi seçilince o odanın kişi başı ücreti yazılır
                  const p = tour?.prices[Number(e.target.value)];
                  if (p != null) setValue("price", String(p));
                },
              })}
            >
              <option value="">—</option>
              {roomSizes.map((n) => (
                <option key={n} value={n}>
                  {n} kişilik oda
                  {tour?.prices[n] != null ? ` · ${formatPrice(tour.prices[n], tour.currency)}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={`Ücret${cur ? ` (${cur})` : ""}`} required error={errors.price?.message}>
            <Input type="number" min={0} step={1} {...register("price", { onChange: () => setPriceEdited(true) })} />
          </Field>
          <Field label="Referans" error={errors.reference?.message}>
            <Input list="referanslar" placeholder="Kim yönlendirdi?" autoComplete="off" {...register("reference")} />
            <datalist id="referanslar">
              {references.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
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
            <Field label="Parayı Alan" error={errors.downPaymentBy?.message}>
              <Select {...register("downPaymentBy")}>
                {people.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>
      )}

      <FormFooter cancelHref={saleId ? `${base}/${saleId}` : base} submitting={isSubmitting} label={saleId ? "Kaydet" : "Satışı Kaydet"} />
    </form>
  );
}
