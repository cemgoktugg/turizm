"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { paymentSchema, PAYMENT_METHODS, type PaymentInput } from "@/lib/validations";
import { addPayment } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/form-controls";

type FormIn = z.input<typeof paymentSchema>;

/** Satış detayında tahsilat ekleme satırı (tutar varsayılan olarak kalan borç) */
export function PaymentForm({ saleId, balance, today, currencyLabel }: { saleId: number; balance: number; today: string; currencyLabel: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { date: today, amount: String(balance), method: "Nakit", note: "" },
  });

  async function onSubmit(values: PaymentInput) {
    const res = await addPayment(String(saleId), values);
    if (!res.ok) {
      if (res.fieldErrors?.amount) setError("amount", { message: res.fieldErrors.amount });
      return void toast.error(res.message);
    }
    toast.success(res.message);
    // Sayfa yenilenince form, yeni kalan tutarla baştan kurulur (key={paid})
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[150px_150px_160px_1fr_auto]">
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
      <Field label="Açıklama" error={errors.note?.message}>
        <Input placeholder="Dekont no, not..." {...register("note")} />
      </Field>
      <div className="sm:col-span-2 lg:col-span-1 lg:pt-[30px]">
        <Button type="submit" disabled={isSubmitting} className="w-full lg:w-auto">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Tahsilat Ekle
        </Button>
      </div>
    </form>
  );
}
