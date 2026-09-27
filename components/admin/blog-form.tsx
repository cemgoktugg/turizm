"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { blogSchema, type BlogInput } from "@/lib/validations";
import { createBlogPost, updateBlogPost } from "@/app/actions/blog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import { FormSection, CheckboxRow } from "./form-parts";

export function BlogForm({
  postId,
  defaultValues,
}: {
  postId?: string;
  defaultValues?: Partial<z.input<typeof blogSchema>>;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof blogSchema>, unknown, BlogInput>({
    resolver: zodResolver(blogSchema),
    defaultValues: { isPublished: true, category: "Rehber", readTime: 5, ...defaultValues },
  });

  async function onSubmit(values: BlogInput) {
    const res = postId ? await updateBlogPost(postId, values) : await createBlogPost(values);
    if (res.ok) {
      toast.success(res.message);
      router.push("/admin/blog");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title="Yazı İçeriği">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Başlık" required error={errors.title?.message} className="sm:col-span-2">
            <Input {...register("title")} />
          </Field>
          <Field label="Slug (boş = otomatik)" error={errors.slug?.message}>
            <Input {...register("slug")} />
          </Field>
          <Field label="Kategori" error={errors.category?.message}>
            <Input placeholder="Rehber, Bilgi..." {...register("category")} />
          </Field>
          <Field label="Kapak Görseli (yol)" error={errors.coverImage?.message}>
            <Input placeholder="/images/blog-ornek.svg" {...register("coverImage")} />
          </Field>
          <Field label="Okuma Süresi (dk)" error={errors.readTime?.message}>
            <Input type="number" min={0} {...register("readTime")} />
          </Field>
          <Field label="Özet" error={errors.excerpt?.message} className="sm:col-span-2">
            <Textarea rows={2} {...register("excerpt")} />
          </Field>
          <Field label="İçerik (Markdown: ## başlık, - madde, **kalın**)" required error={errors.content?.message} className="sm:col-span-2">
            <Textarea rows={16} className="font-mono text-[13px]" {...register("content")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="SEO ve Yayın">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO Başlık" error={errors.seoTitle?.message}>
            <Input {...register("seoTitle")} />
          </Field>
          <Field label="SEO Açıklama" error={errors.seoDescription?.message}>
            <Input {...register("seoDescription")} />
          </Field>
        </div>
        <div className="mt-4">
          <CheckboxRow label="Yayında" {...register("isPublished")} />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/blog")}>
          İptal
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          {postId ? "Kaydet" : "Yazı Ekle"}
        </Button>
      </div>
    </form>
  );
}
