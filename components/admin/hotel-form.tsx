"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { hotelSchema, type HotelInput } from "@/lib/validations";
import { createHotel, updateHotel } from "@/app/actions/hotels";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { FormSection, CheckboxRow } from "./form-parts";

export function HotelForm({
  hotelId,
  defaultValues,
}: {
  hotelId?: string;
  defaultValues?: Partial<z.input<typeof hotelSchema>>;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof hotelSchema>, unknown, HotelInput>({
    resolver: zodResolver(hotelSchema),
    defaultValues: { city: "Mekke", stars: 4, isPublished: true, ...defaultValues },
  });

  async function onSubmit(values: HotelInput) {
    const res = hotelId ? await updateHotel(hotelId, values) : await createHotel(values);
    if (res.ok) {
      toast.success(res.message);
      router.push("/admin/hotels");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title="Otel Bilgileri">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Otel Adı" required error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Slug (boş = otomatik)" error={errors.slug?.message}>
            <Input {...register("slug")} />
          </Field>
          <Field label="Şehir" required error={errors.city?.message}>
            <Select {...register("city")}>
              <option value="Mekke">Mekke</option>
              <option value="Medine">Medine</option>
            </Select>
          </Field>
          <Field label="Bölge" error={errors.region?.message}>
            <Input placeholder="Merkeziye, Jabal Omar..." {...register("region")} />
          </Field>
          <Field label="Mesafe" error={errors.distance?.message}>
            <Input placeholder="Harem'e 500 m" {...register("distance")} />
          </Field>
          <Field label="Yıldız (0-7)" error={errors.stars?.message}>
            <Input type="number" min={0} max={7} {...register("stars")} />
          </Field>
          <Field label="Açıklama" error={errors.description?.message} className="sm:col-span-2">
            <Textarea rows={3} {...register("description")} />
          </Field>
          <Field label="Görseller (her satıra bir URL)" error={errors.images?.message} className="sm:col-span-2">
            <Textarea rows={3} placeholder={"/images/otel-1.svg\n/images/otel-2.svg"} {...register("images")} />
          </Field>
        </div>
        <div className="mt-4">
          <CheckboxRow label="Yayında" {...register("isPublished")} />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/hotels")}>
          İptal
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          {hotelId ? "Kaydet" : "Otel Ekle"}
        </Button>
      </div>
    </form>
  );
}
