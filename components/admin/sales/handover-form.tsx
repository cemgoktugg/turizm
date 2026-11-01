"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { handoverSchema, type HandoverInput } from "@/lib/validations";
import { addHandover } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/form-controls";

type FormIn = z.input<typeof handoverSchema>;

/** Kasa sayfasında yöneticinin teslim aldığı nakdi kaydettiği satır */
export function HandoverForm({ people, today }: { people: { name: string; label: string }[]; today: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, HandoverInput>({
    resolver: zodResolver(handoverSchema),
    defaultValues: { date: today, fromName: "", amount: "", note: "" },
  });

  async function onSubmit(values: HandoverInput) {
    const res = await addHandover(values);
    if (!res.ok) {
      if (res.fieldErrors?.amount) setError("amount", { message: res.fieldErrors.amount });
      return void toast.error(res.message);
    }
    toast.success(res.message);
    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[150px_220px_130px_1fr_auto]">
      <Field label="Tarih" error={errors.date?.message}>
        <Input type="date" {...register("date")} />
      </Field>
      <Field label="Teslim Eden" error={errors.fromName?.message}>
        <Select {...register("fromName")}>
          <option value="">Seçiniz</option>
          {people.map((p) => (
            <option key={p.name} value={p.name}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tutar ($)" error={errors.amount?.message}>
        <Input type="number" min={1} step={1} {...register("amount")} />
      </Field>
      <Field label="Açıklama" error={errors.note?.message}>
        <Input placeholder="Not..." {...register("note")} />
      </Field>
      <div className="sm:col-span-2 lg:col-span-1 lg:pt-[30px]">
        <Button type="submit" disabled={isSubmitting} className="w-full lg:w-auto">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Teslimi Kaydet
        </Button>
      </div>
    </form>
  );
}
