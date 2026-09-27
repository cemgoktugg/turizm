"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Lock, Pencil, Plus, Save, X } from "lucide-react";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { AdminCard } from "./ui";
import { DeleteButton } from "./row-actions";
import { ImagePicker } from "./image-picker";
import { IconPicker } from "./icon-picker";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  order: number;
  tourCount: number;
  activeCount: number;
  system: { landing: string; usedBy: string } | null;
};

type FormIn = z.input<typeof categorySchema>;
const EMPTY: FormIn = { name: "", slug: "", description: "", image: "", icon: "Sparkles", order: "" };

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [moving, startMove] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: EMPTY });

  function startEdit(c: CategoryRow) {
    setEditing(c);
    reset({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image: c.image ?? "",
      icon: c.icon ?? "Sparkles",
      order: String(c.order),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancel() {
    setEditing(null);
    reset(EMPTY);
  }

  async function onSubmit(values: CategoryInput) {
    const res = editing ? await updateCategory(editing.id, values) : await createCategory(values);
    if (res.ok) {
      toast.success(res.message);
      cancel();
      router.refresh();
    } else toast.error(res.message);
  }

  function move(id: string, dir: "up" | "down") {
    startMove(async () => {
      const res = await moveCategory(id, dir);
      if (res.ok) router.refresh();
      else toast.error(res.message);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <AdminCard className="h-fit p-5 lg:sticky lg:top-24">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-900">{editing ? "Kategoriyi Düzenle" : "Yeni Kategori"}</h3>
          {editing && (
            <button type="button" onClick={cancel} className="text-muted hover:text-red-600" aria-label="İptal">
              <X className="size-5" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Kategori Adı" required error={errors.name?.message}>
            <Input placeholder="Kültür Turları" {...register("name")} />
          </Field>
          <Field label="Slug" error={errors.slug?.message}>
            {editing?.system ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-cream-50 px-4 py-2.5 text-sm text-muted">
                <Lock className="size-4" /> {editing.slug}
              </div>
            ) : (
              <Input placeholder="Boş = otomatik" {...register("slug")} />
            )}
            {editing?.system && (
              <p className="mt-1 text-xs text-muted">Bu kategori {editing.system.usedBy} tarafından kullanıldığı için slug sabittir.</p>
            )}
          </Field>
          <Field label="Açıklama (ana sayfa kartında)" error={errors.description?.message}>
            <Textarea rows={2} className="min-h-0" {...register("description")} />
          </Field>
          <Field label="İkon" error={errors.icon?.message}>
            <Controller control={control} name="icon" render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />} />
          </Field>
          <Field label="Kart Görseli" error={errors.image?.message}>
            <Controller control={control} name="image" render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} />} />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : editing ? <Save className="size-5" /> : <Plus className="size-5" />}
            {editing ? "Güncelle" : "Kategori Ekle"}
          </Button>
        </form>
      </AdminCard>

      <div className="space-y-3">
        {categories.map((c, i) => (
          <AdminCard key={c.id} className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${editing?.id === c.id ? "ring-2 ring-gold-400" : ""}`}>
            <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-brand-950 sm:w-36">
              <SmartImage src={c.image} alt={c.name} className="size-full opacity-80" />
              <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-lg bg-gold-400 text-brand-950">
                <Icon name={c.icon} className="size-4" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-serif text-lg font-bold text-brand-900">{c.name}</p>
                {c.system && (
                  <Badge variant="navy" size="sm" title={c.system.usedBy}>
                    <Lock className="size-3" /> Sistem
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted">/{c.slug}</p>
              {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>}
              <p className="mt-1.5 text-xs font-semibold text-brand-600">
                {c.tourCount} tur · {c.activeCount} tanesi sitede listeleniyor
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" disabled={moving || i === 0} onClick={() => move(c.id, "up")} className="grid size-9 place-items-center rounded-lg border border-border text-brand-700 hover:bg-brand-50 disabled:opacity-30" aria-label="Yukarı" title="Yukarı taşı">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" disabled={moving || i === categories.length - 1} onClick={() => move(c.id, "down")} className="grid size-9 place-items-center rounded-lg border border-border text-brand-700 hover:bg-brand-50 disabled:opacity-30" aria-label="Aşağı" title="Aşağı taşı">
                <ArrowDown className="size-4" />
              </button>
              <a href={c.system?.landing ?? `/turlar?kategori=${c.slug}`} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-lg border border-border text-brand-700 hover:bg-brand-50" title="Sitede gör">
                <ExternalLink className="size-4" />
              </a>
              <button type="button" onClick={() => startEdit(c)} className="grid size-9 place-items-center rounded-lg border border-border text-brand-700 hover:bg-brand-50" title="Düzenle" aria-label="Düzenle">
                <Pencil className="size-4" />
              </button>
              {!c.system && <DeleteButton action={deleteCategory} id={c.id} label="Bu kategoriyi silmek istediğinize emin misiniz?" />}
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
