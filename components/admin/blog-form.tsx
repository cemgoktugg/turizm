"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, ExternalLink, Loader2, Pencil, Save } from "lucide-react";
import { blogSchema, type BlogInput } from "@/lib/validations";
import { createBlogPost, updateBlogPost } from "@/app/actions/blog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { Prose } from "@/components/site/prose";
import { cn } from "@/lib/utils";
import { FormSection, CheckboxRow } from "./form-parts";
import { ImagePicker } from "./image-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type FormIn = z.input<typeof blogSchema>;

export function BlogForm({
  postId,
  slug,
  categories,
  defaultValues,
}: {
  postId?: string;
  slug?: string;
  categories: string[];
  defaultValues?: Partial<FormIn>;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, BlogInput>({
    resolver: zodResolver(blogSchema),
    defaultValues: { isPublished: true, category: "Rehber", ...defaultValues },
  });
  useUnsavedChanges(isDirty);
  const content = useWatch({ control, name: "content" }) ?? "";

  async function onSubmit(values: BlogInput) {
    const res = postId ? await updateBlogPost(postId, values) : await createBlogPost(values);
    if (res.ok) {
      toast.success(res.message);
      reset(values as unknown as FormIn);
      router.push("/admin/blog");
      router.refresh();
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
      <datalist id="blog-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <FormSection title="Yazı Bilgileri">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Başlık" required error={errors.title?.message} className="sm:col-span-2">
              <Input {...register("title")} />
            </Field>
            <Field label="Slug (boş = otomatik)" error={errors.slug?.message}>
              <Input {...register("slug")} />
            </Field>
            <Field label="Kategori" error={errors.category?.message}>
              <Input list="blog-categories" placeholder="Rehber, Bilgi..." {...register("category")} />
            </Field>
            <Field label="Okuma Süresi (dk)" error={errors.readTime?.message}>
              <Input type="number" min={1} placeholder="Boş = otomatik hesaplanır" {...register("readTime")} />
            </Field>
            <Field label="Özet" error={errors.excerpt?.message} className="sm:col-span-2">
              <Textarea rows={3} className="min-h-0" {...register("excerpt")} />
            </Field>
          </div>
          <Field label="Kapak Görseli" error={errors.coverImage?.message}>
            <Controller
              control={control}
              name="coverImage"
              render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="İçerik"
        description="Biçimlendirme: ## Başlık, ### Alt başlık, - madde, 1. sıralı madde, **kalın**, [bağlantı metni](/adres)"
        action={
          <div className="inline-flex rounded-full border border-border bg-cream-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1", !preview ? "bg-brand-700 text-white" : "text-brand-800")}
            >
              <Pencil className="size-3.5" /> Yaz
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1", preview ? "bg-brand-700 text-white" : "text-brand-800")}
            >
              <Eye className="size-3.5" /> Önizle
            </button>
          </div>
        }
      >
        <Field error={errors.content?.message}>
          <Textarea rows={20} className={cn("font-mono text-[13px]", preview && "hidden")} {...register("content")} />
          {preview && (
            <div className="min-h-[300px] rounded-xl border border-border bg-white px-6 py-2">
              {content.trim() ? <Prose content={content} /> : <p className="py-10 text-center text-sm text-muted">İçerik boş.</p>}
            </div>
          )}
        </Field>
      </FormSection>

      <FormSection title="SEO ve Yayın" description="SEO alanları boş bırakılırsa başlık ve özet kullanılır.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO Başlık" error={errors.seoTitle?.message}>
            <Input {...register("seoTitle")} />
          </Field>
          <Field label="SEO Açıklama" error={errors.seoDescription?.message}>
            <Input {...register("seoDescription")} />
          </Field>
        </div>
        <div className="mt-4">
          <CheckboxRow label="Yayında (işaretsizse taslak olarak kalır)" {...register("isPublished")} />
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div>
          {postId && slug && (
            <a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
              <ExternalLink className="size-4" /> Sitede Gör
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/blog")}>
            İptal
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            {postId ? "Kaydet" : "Yazı Ekle"}
          </Button>
        </div>
      </div>
    </form>
  );
}
