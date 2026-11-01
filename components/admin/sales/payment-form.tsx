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
import { Input, Select, Field } from "@/components/ui/form-controls";

type FormIn = z.input<typeof paymentSchema>;

/** Satış detayında tahsilat veya (iptal edilen satışta) iade satırı; tutar varsayılan olarak kalan borç / iade edilecek para */
export function PaymentForm({
  saleId,
  amount,
  today,
  currencyLabel,
  people,
  person,
  refund,
}: {
  saleId: number;
  amount: number;
  today: string;
  currencyLabel: string;
  people: string[];
  /** Varsayılan kişi: giriş yapan kullanıcı */
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
    defaultValues: { date: today, amount: String(amount), method: "Nakit", receivedBy: person, note: "" },
  });

  async function onSubmit(values: PaymentInput) {
    const res = await (refund ? addRefund : addPayment)(String(saleId), values);
    if (!res.ok) {
      if (res.fieldErrors?.amount) setError("amount", { message: res.fieldErrors.amount });
      if (res.fieldErrors?.receivedBy) setError("receivedBy", { message: res.fieldErrors.receivedBy });
      return void toast.error(res.message);
    }
    toast.success(res.message);
    // Sayfa yenilenince form, yeni kalan tutarla baştan kurulur (key={paid})
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[150px_130px_140px_160px_1fr_auto]">
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
      <Field label={refund ? "İadeyi Yapan" : "Parayı Alan"} error={errors.receivedBy?.message}>
        <Select {...register("receivedBy")}>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Açıklama" error={errors.note?.message}>
        <Input placeholder="Dekont no, not..." {...register("note")} />
      </Field>
      <div className="sm:col-span-2 lg:col-span-1 lg:pt-[30px]">
        <Button type="submit" disabled={isSubmitting} className="w-full lg:w-auto">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : refund ? <Undo2 className="size-4" /> : <Plus className="size-4" />}
          {refund ? "İadeyi Kaydet" : "Tahsilat Ekle"}
        </Button>
      </div>
    </form>
  );
}
