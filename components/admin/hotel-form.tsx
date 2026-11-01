"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { hotelSchema, HOTEL_CITIES, type HotelInput } from "@/lib/validations";
import { createHotel, updateHotel } from "@/app/actions/hotels";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { FormSection, CheckboxRow } from "./form-parts";
import { GalleryPicker } from "./image-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type FormIn = z.input<typeof hotelSchema>;

export function HotelForm({ hotelId, defaultValues }: { hotelId?: string; defaultValues?: Partial<FormIn> }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, HotelInput>({
    resolver: zodResolver(hotelSchema),
    defaultValues: { city: "Mekke", stars: "4", isPublished: true, images: [], ...defaultValues },
  });
  useUnsavedChanges(isDirty);

  async function onSubmit(values: HotelInput) {
    const res = hotelId ? await updateHotel(hotelId, values) : await createHotel(values);
    if (res.ok) {
      toast.success(res.message);
      reset(values as unknown as FormIn);
      router.push("/admin/hotels");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Lütfen işaretli alanları kontrol edin."))}
      className="space-y-6"
      noValidate
    >
      <FormSection title="Otel Bilgileri" description="Oteller Mekke / Medine sayfalarında ve ana sayfada listelenir; tur formunda da önerilir.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Otel Adı" required error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Slug (boş = otomatik)" error={errors.slug?.message}>
            <Input {...register("slug")} />
          </Field>
          <Field label="Şehir" required error={errors.city?.message}>
            <Select {...register("city")}>
              {HOTEL_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
        </div>
      </FormSection>

      <FormSection title="Görseller" description="İlk görsel otel kartında kapak olarak kullanılır.">
        <Field error={errors.images?.message}>
          <Controller
            control={control}
            name="images"
            render={({ field }) => <GalleryPicker value={field.value ?? []} onChange={field.onChange} max={20} />}
          />
        </Field>
        <div className="mt-5">
          <CheckboxRow label="Yayında (sitede görünür)" {...register("isPublished")} />
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
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
