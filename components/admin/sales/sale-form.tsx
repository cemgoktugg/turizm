"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saleSchema, PAYMENT_METHODS, type SaleInput } from "@/lib/validations";
import { createSale, updateSale, type CustomerOption } from "@/app/actions/sales";
import { Input, Textarea, Select, Field, StaticField } from "@/components/ui/form-controls";
import { FormSection } from "../form-parts";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { FormFooter } from "./form-footer";
import { CustomerPicker } from "./customer-picker";
import { currencySymbol, formatPrice } from "@/lib/utils";
import { useSalesBase } from "./use-sales-base";
import { withParam } from "./ui";
import { toastWithReceipt } from "./receipt-toolbar";
import { DiscountHint } from "./discount-hint";
import { PASSENGER_KEYS, PASSENGER_TYPES, discountOf, isPassengerType, percent, saleListPrice, type PassengerType } from "@/lib/sale-pricing";
import { seatLabel, seatsLeft } from "@/lib/capacity";
import { SeatHint } from "./seat-hint";

type FormIn = z.input<typeof saleSchema>;

export type SaleTourOption = {
  id: number;
  name: string;
  period: string;
  /** Oda kişi sayısı → kişi başı ücret (yalnızca fiyatı girilmiş oda tipleri) */
  prices: Record<number, number>;
  /** Yaş grubu → çocuk ücreti (yalnızca girilmiş yaş grupları) */
  childPrices: Partial<Record<PassengerType, number>>;
  currency: string;
  departure: string;
  isActive: boolean;
  /** Kişi kontenjanı (null: sınır yok) ve dolu yer (iptal edilmemiş satışlar) */
  capacity: number | null;
  sold: number;
};

export function SaleForm({
  saleId,
  tours,
  customer,
  defaultValues,
  paid = 0,
  listPrice: savedListPrice = null,
  references,
  person = "",
  listHref,
}: {
  saleId?: number;
  tours: SaleTourOption[];
  customer?: CustomerOption | null;
  defaultValues?: Partial<FormIn>;
  /** Düzenlemede: şimdiye kadar tahsil edilen */
  paid?: number;
  /** Düzenlemede: satış anında kaydedilen liste fiyatı (tur / oda değişmedikçe bu kullanılır) */
  listPrice?: number | null;
  /** Referans alanındaki öneriler (daha önce girilenler) */
  references: string[];
  /** Yeni satışta: peşinatı alabilecek kişiler */
  /** Yeni satışta peşinatı alan: giriş yapan kullanıcı */
  person?: string;
  /** Yan panelde (satış listesi): kayıttan sonra listede bu satışın paneli açılır, İptal listeye döner */
  listHref?: string;
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

  const [tourId, roomSize, passenger, price] = useWatch({ control, name: ["tourId", "roomSize", "passenger", "price"] });
  const tour = tours.find((t) => String(t.id) === String(tourId ?? ""));
  const cur = tour ? currencySymbol(tour.currency).trim() : "";

  // Liste fiyatı: düzenlemede tur, oda ve yolcu değişmediyse kayıttaki değer, aksi halde turun güncel fiyatı (sunucuyla aynı kural)
  const sameRoom =
    !!saleId &&
    String(tourId ?? "") === String(defaultValues?.tourId ?? "") &&
    String(roomSize ?? "") === String(defaultValues?.roomSize ?? "") &&
    String(passenger ?? "") === String(defaultValues?.passenger ?? "");
  const listPrice = sameRoom ? savedListPrice : tour ? saleListPrice(tour.prices, tour.childPrices, Number(roomSize) || null, passenger) : null;
  // Düzenlemede satışın kendi turu: satış zaten yer kaplıyor, ek yer gerekmez
  const sameTour = !!saleId && String(tourId ?? "") === String(defaultValues?.tourId ?? "");
  const priceNum = price === "" || price == null ? null : Number(price);

  // Oda seçenekleri: turun fiyatı girilmiş oda tipleri (+ kayıtlı satışın eski değeri)
  const roomSizes = tour ? Object.keys(tour.prices).map(Number) : [2, 3, 4];
  const currentRoom = Number(roomSize);
  if (currentRoom && !roomSizes.includes(currentRoom)) roomSizes.push(currentRoom);
  roomSizes.sort((a, b) => a - b);

  // Yolcu seçenekleri: turun ücreti girilmiş çocuk yaş grupları (+ kayıtlı satışın eski değeri)
  const passengerTypes = PASSENGER_KEYS.filter((k) => (tour ? tour.childPrices[k] != null : true) || k === passenger);

  /** Kişi başı ücret: çocukta yaş grubunun ücreti; yetişkinde seçili oda, oda seçilmediyse turun ilk oda fiyatı */
  const priceFor = (t: SaleTourOption, size: number, who?: string) =>
    (isPassengerType(who) ? t.childPrices[who] : undefined) ?? t.prices[size] ?? Object.values(t.prices)[0];

  // Dönemlere göre gruplu tur listesi
  const groups = tours.reduce<Record<string, SaleTourOption[]>>((acc, t) => {
    (acc[t.period] ??= []).push(t);
    return acc;
  }, {});

  async function onSubmit(values: SaleInput) {
    const res = saleId ? await updateSale(String(saleId), values) : await createSale(values);
    if (!res.ok) return void toast.error(res.message);
    toastWithReceipt(res.message, (res.data as { paymentId?: number } | undefined)?.paymentId, (href) => router.push(href));
    const d = discountOf(listPrice, values.price);
    if (d?.warn) toast.warning(`Dikkat: liste fiyatından ${percent(d.rate)} indirimle kaydedildi.`);
    reset(getValues());
    const id = saleId ?? (res.data as { id: number } | undefined)?.id;
    if (listHref && id) router.push(withParam(listHref, "panel", String(id)), { scroll: false });
    else router.push(id ? `${base}/${id}` : base);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))} className="@container space-y-6" noValidate>
      <FormSection title="Satış Bilgileri">
        <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-4">
          <Field label="Müşteri" required error={errors.customerId?.message} className="@lg:col-span-2">
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
          <Field label="Tur" required error={errors.tourId?.message} className="@lg:col-span-2">
            <Select
              {...register("tourId", {
                onChange: (e) => {
                  // Yeni satışta ücret elle değiştirilmediyse turun seçili oda tipindeki ücretini öner
                  const t = tours.find((x) => String(x.id) === e.target.value);
                  if (!t || saleId) return;
                  const size = Number(getValues("roomSize"));
                  if (size && t.prices[size] == null) setValue("roomSize", "");
                  const who = getValues("passenger");
                  if (isPassengerType(who) && t.childPrices[who] == null) setValue("passenger", "");
                  if (!priceEdited) setValue("price", String(priceFor(t, size, getValues("passenger"))));
                },
              })}
            >
              <option value="">Tur seçiniz</option>
              {Object.entries(groups).map(([period, list]) => (
                <optgroup key={period} label={period}>
                  {list.map((t) => {
                    // Yeni satışta dolu tur seçilemez; düzenlemede sunucu karar verir
                    const full = !saleId && (seatsLeft(t.capacity, t.sold) ?? 1) <= 0;
                    return (
                      <option key={t.id} value={t.id} disabled={full}>
                        #{t.id} {t.name} · {t.departure}
                        {seatLabel(t.capacity, t.sold)}
                        {t.isActive ? "" : " (pasif)"}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </Select>
            {tour && <SeatHint capacity={tour.capacity} sold={tour.sold} adding={sameTour ? 0 : 1} />}
          </Field>
          <Field label="Satış Tarihi" required error={errors.date?.message}>
            <Input type="date" {...register("date")} />
          </Field>
          <Field label="Yolcu" error={errors.passenger?.message}>
            <Select
              {...register("passenger", {
                onChange: (e) => {
                  // Yolcu tipi değişince ücret: çocukta yaş grubunun, yetişkinde odanın ücreti
                  if (tour) setValue("price", String(priceFor(tour, Number(getValues("roomSize")), e.target.value)));
                },
              })}
            >
              <option value="">Yetişkin</option>
              {passengerTypes.map((k) => (
                <option key={k} value={k}>
                  {PASSENGER_TYPES[k]}
                  {tour?.childPrices[k] != null ? ` · ${formatPrice(tour.childPrices[k], tour.currency)}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Oda Kişi Sayısı" error={errors.roomSize?.message}>
            <Select
              {...register("roomSize", {
                onChange: (e) => {
                  // Yetişkinde oda tipi seçilince o odanın kişi başı ücreti yazılır (çocuk ücreti odadan bağımsız)
                  const p = tour?.prices[Number(e.target.value)];
                  if (p != null && !isPassengerType(getValues("passenger"))) setValue("price", String(p));
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
          <Field label={`Anlaşılan Ücret${cur ? ` (${cur})` : ""}`} required error={errors.price?.message}>
            <Input type="number" min={0} step={1} {...register("price", { onChange: () => setPriceEdited(true) })} />
            {tour && <DiscountHint listPrice={listPrice} price={priceNum} currency={tour.currency} />}
          </Field>
          <Field label="Referans" error={errors.reference?.message}>
            <Input list="referanslar" placeholder="Kim yönlendirdi?" autoComplete="off" {...register("reference")} />
            <datalist id="referanslar">
              {references.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
          <Field label="Açıklama" error={errors.note?.message} className="@lg:col-span-2 @3xl:col-span-4">
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
          <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-4">
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
            <Field label="Parayı Alan">
              <StaticField title="Parayı alan her zaman kaydı yapan (giriş yapmış) kişidir">{person}</StaticField>
            </Field>
          </div>
        </FormSection>
      )}

      <FormFooter cancelHref={listHref ?? (saleId ? `${base}/${saleId}` : base)} keepScroll={!!listHref} submitting={isSubmitting} label={saleId ? "Kaydet" : "Satışı Kaydet"} />
    </form>
  );
}
