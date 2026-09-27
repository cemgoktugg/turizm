"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { blogSchema } from "@/lib/validations";
import type { ActionResult } from "./leads";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Yetkisiz erişim.");
}

function data(d: ReturnType<typeof blogSchema.parse>) {
  return {
    title: d.title,
    excerpt: d.excerpt || null,
    content: d.content,
    coverImage: d.coverImage || null,
    category: d.category || null,
    readTime: d.readTime ?? null,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    isPublished: Boolean(d.isPublished),
  };
}

export async function createBlogPost(input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  const slug = await uniqueSlug("blogPost", parsed.data.slug || parsed.data.title);
  await prisma.blogPost.create({ data: { ...data(parsed.data), slug } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { ok: true, message: "Yazı oluşturuldu." };
}

export async function updateBlogPost(id: string, input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  const slug = await uniqueSlug("blogPost", parsed.data.slug || parsed.data.title, id);
  await prisma.blogPost.update({ where: { id }, data: { ...data(parsed.data), slug } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return { ok: true, message: "Yazı güncellendi." };
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { ok: true, message: "Yazı silindi." };
}
