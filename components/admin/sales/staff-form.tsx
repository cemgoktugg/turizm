"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { staffSchema, type StaffInput } from "@/lib/validations";
import { createStaff, updateStaff } from "@/app/actions/sales";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { FormSection } from "../form-parts";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { FormFooter } from "./form-footer";
import { useSalesBase } from "./use-sales-base";

type FormIn = z.input<typeof staffSchema>;

export function StaffForm({ staffId, defaultValues }: { staffId?: number; defaultValues?: Partial<FormIn> }) {
  const router = useRouter();
  const base = useSalesBase();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, StaffInput>({ resolver: zodResolver(staffSchema), defaultValues });
  useUnsavedChanges(isDirty);

  async function onSubmit(values: StaffInput) {
    const res = staffId ? await updateStaff(String(staffId), values) : await createStaff(values);
    if (!res.ok) return void toast.error(res.message);
    toast.success(res.message);
    reset(values as FormIn);
    router.push(`${base}/gorevliler`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))} className="space-y-6" noValidate>
      <FormSection title="Görevli Bilgileri" description="Görevliler tur kaydında Görevli 1 / Görevli 2 olarak seçilir.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad" required error={errors.fullName?.message}>
            <Input {...register("fullName")} autoFocus />
          </Field>
          <Field label="T.C. Kimlik No" error={errors.tc?.message}>
            <Input inputMode="numeric" maxLength={11} {...register("tc")} />
          </Field>
          <Field label="Telefon" required error={errors.phone?.message}>
            <Input type="tel" placeholder="05xx xxx xx xx" {...register("phone")} />
          </Field>
          <Field label="Açıklama" error={errors.note?.message} className="sm:col-span-2">
            <Textarea rows={3} {...register("note")} />
          </Field>
        </div>
      </FormSection>
      <FormFooter cancelHref={`${base}/gorevliler`} submitting={isSubmitting} label={staffId ? "Kaydet" : "Görevli Ekle"} />
    </form>
  );
}
