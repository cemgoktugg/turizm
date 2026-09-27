"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, Plus, X, Pencil } from "lucide-react";
import { certificateSchema, type CertificateInput } from "@/lib/validations";
import { createCertificate, updateCertificate, deleteCertificate } from "@/app/actions/certificates";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { CheckboxRow } from "./form-parts";
import { AdminCard } from "./ui";
import { DeleteButton } from "./row-actions";
import { ImagePicker } from "./image-picker";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";

type Cert = {
  id: string;
  title: string;
  image: string;
  description: string | null;
  order: number;
  isPublished: boolean;
};

type FormIn = z.input<typeof certificateSchema>;
const EMPTY: FormIn = { title: "", image: "", description: "", order: "", isPublished: true };

export function CertificatesManager({ certificates }: { certificates: Cert[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Cert | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, CertificateInput>({
    resolver: zodResolver(certificateSchema),
    defaultValues: { ...EMPTY, order: String(certificates.length + 1) },
  });

  function startEdit(c: Cert) {
    setEditing(c);
    reset({
      title: c.title,
      image: c.image,
      description: c.description ?? "",
      order: String(c.order),
      isPublished: c.isPublished,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    reset({ ...EMPTY, order: String(certificates.length + 1) });
  }

  async function onSubmit(values: CertificateInput) {
    const res = editing ? await updateCertificate(editing.id, values) : await createCertificate(values);
    if (res.ok) {
      toast.success(res.message);
      cancelEdit();
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      {/* Form */}
      <AdminCard className="h-fit p-5 lg:sticky lg:top-24">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-900">{editing ? "Belgeyi Düzenle" : "Yeni Belge Ekle"}</h3>
          {editing && (
            <button type="button" onClick={cancelEdit} className="text-muted hover:text-red-600" aria-label="İptal">
              <X className="size-5" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Başlık" required error={errors.title?.message}>
            <Input placeholder="TÜRSAB Belgesi" {...register("title")} />
          </Field>
          <Field label="Belge Görseli" required error={errors.image?.message}>
            <Controller
              control={control}
              name="image"
              render={({ field }) => (
                <ImagePicker value={field.value} onChange={field.onChange} aspect="portrait" invalid={!!errors.image} />
              )}
            />
          </Field>
          <Field label="Açıklama" error={errors.description?.message}>
            <Textarea rows={2} className="min-h-0" {...register("description")} />
          </Field>
          <Field label="Sıra (küçük olan önce gösterilir)" error={errors.order?.message}>
            <Input type="number" min={0} {...register("order")} />
          </Field>
          <CheckboxRow label="Yayında" {...register("isPublished")} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : editing ? <Save className="size-5" /> : <Plus className="size-5" />}
            {editing ? "Güncelle" : "Belge Ekle"}
          </Button>
        </form>
      </AdminCard>

      {/* Liste */}
      <div className="grid gap-4 sm:grid-cols-2">
        {certificates.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted sm:col-span-2">
            Henüz belge eklenmemiş.
          </p>
        )}
        {certificates.map((c) => (
          <AdminCard key={c.id} className={`overflow-hidden ${editing?.id === c.id ? "ring-2 ring-gold-400" : ""}`}>
            <div className="relative aspect-[4/3] overflow-hidden bg-brand-950">
              <SmartImage src={c.image} alt={c.title} className="size-full" />
              <div className="absolute left-2 top-2 flex gap-1.5">
                <Badge variant="cream" size="sm">#{c.order}</Badge>
              </div>
              <div className="absolute right-2 top-2">
                <Badge variant={c.isPublished ? "green" : "slate"} size="sm">
                  {c.isPublished ? "Yayında" : "Pasif"}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <p className="font-semibold text-brand-900">{c.title}</p>
              {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <Pencil className="size-3.5" /> Düzenle
                </button>
                <DeleteButton action={deleteCertificate} id={c.id} label="Bu belgeyi silmek istediğinize emin misiniz?" />
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
