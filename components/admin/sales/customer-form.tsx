"use client";

import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { createCustomer, updateCustomer } from "@/app/actions/sales";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { FormSection } from "../form-parts";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { FormFooter } from "./form-footer";
import { useSalesBase } from "./use-sales-base";

export type CustomerFormIn = z.input<typeof customerSchema>;
type FormIn = CustomerFormIn;

export function CustomerForm({ customerId, defaultValues }: { customerId?: number; defaultValues?: Partial<FormIn> }) {
  const router = useRouter();
  const base = useSalesBase();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, CustomerInput>({ resolver: zodResolver(customerSchema), defaultValues });
  useUnsavedChanges(isDirty);

  async function onSubmit(values: CustomerInput) {
    const res = customerId ? await updateCustomer(String(customerId), values) : await createCustomer(values);
    if (!res.ok) {
      if (res.fieldErrors?.tc) setError("tc", { message: res.fieldErrors.tc });
      return void toast.error(res.message);
    }
    toast.success(res.message);
    reset(values as FormIn);
    router.push(`${base}/musteriler`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))} className="space-y-6" noValidate>
      <FormSection title="Müşteri Bilgileri">
        <CustomerFields register={register} errors={errors} />
      </FormSection>
      <FormFooter cancelHref={`${base}/musteriler`} submitting={isSubmitting} label={customerId ? "Kaydet" : "Müşteri Ekle"} />
    </form>
  );
}

/** Müşteri formu ve satış formundaki hızlı ekleme için ortak alanlar */
export function CustomerFields({
  register,
  errors,
  compact,
}: {
  register: UseFormRegister<FormIn>;
  errors: FieldErrors<FormIn>;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Ad Soyad" required error={errors.fullName?.message}>
        <Input {...register("fullName")} autoFocus />
      </Field>
      <Field label="T.C. Kimlik No" error={errors.tc?.message}>
        <Input inputMode="numeric" maxLength={11} {...register("tc")} />
      </Field>
      <Field label="Telefon" error={errors.phone?.message}>
        <Input type="tel" placeholder="05xx xxx xx xx" {...register("phone")} />
      </Field>
      {!compact && (
        <Field label="Açıklama" error={errors.note?.message} className="sm:col-span-2">
          <Textarea rows={3} {...register("note")} />
        </Field>
      )}
    </div>
  );
}
