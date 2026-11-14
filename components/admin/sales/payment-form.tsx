"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Undo2 } from "lucide-react";
import { paymentSchema, PAYMENT_METHODS, type PaymentInput } from "@/lib/validations";
import { addPayment, addRefund } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import { toastWithReceipt } from "./receipt-toolbar";
import { Input, Select, Field, StaticField } from "@/components/ui/form-controls";

type FormIn = z.input<typeof paymentSchema>;

/** Satış detayında tahsilat veya (iptal edilen satışta) iade satırı; tutar varsayılan olarak kalan borç / iade edilecek para */
export function PaymentForm({
  saleId,
  amount,
  today,
  currencyLabel,
  person,
  refund,
}: {
  saleId: number;
  amount: number;
  today: string;
  currencyLabel: string;
  /** Parayı alan / iadeyi yapan: giriş yapan kullanıcı (sunucu da kendisi kaydeder) */
  person: string;
  refund?: boolean;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { date: today, amount: String(amount), method: "Nakit", note: "" },
  });

  async function onSubmit(values: PaymentInput) {
    const res = await (refund ? addRefund : addPayment)(String(saleId), values);
    if (!res.ok) {
      if (res.fieldErrors?.amount) setError("amount", { message: res.fieldErrors.amount });
      return void toast.error(res.message);
    }
    toastWithReceipt(res.message, res.data?.paymentId, (href) => router.push(href));
    // Sayfa yenilenince form, yeni kalan tutarla baştan kurulur (key={paid})
    router.refresh();
  }

  // Sütunlar ekrana değil formun genişliğine göre (tam sayfa / yan panel)
  return (
    <div className="@container">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-3 @md:grid-cols-2 @4xl:grid-cols-[150px_130px_140px_160px_1fr_auto]">
        <Field label="Tarih" error={errors.date?.message}>
          <Input type="date" {...register("date")} />
        </Field>
        <Field label={`Tutar (${currencyLabel})`} error={errors.amount?.message}>
          <Input type="number" min={1} step={1} {...register("amount")} />
        </Field>
        <Field label="Ödeme Şekli" error={errors.method?.message}>
          <Select {...register("method")}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={refund ? "İadeyi Yapan" : "Parayı Alan"}>
          <StaticField title="Parayı alan her zaman kaydı yapan (giriş yapmış) kişidir">{person}</StaticField>
        </Field>
        <Field label="Açıklama" error={errors.note?.message}>
          <Input placeholder="Dekont no, not..." {...register("note")} />
        </Field>
        <div className="@md:col-span-2 @4xl:col-span-1 @4xl:pt-[30px]">
          <Button type="submit" disabled={isSubmitting} className="w-full @4xl:w-auto">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : refund ? <Undo2 className="size-4" /> : <Plus className="size-4" />}
            {refund ? "İadeyi Kaydet" : "Tahsilat Ekle"}
          </Button>
        </div>
      </form>
    </div>
  );
}
