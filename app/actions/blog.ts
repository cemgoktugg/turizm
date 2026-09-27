"use server";

import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { blogSchema, type BlogInput } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

/** Okuma süresi girilmemişse içerikten hesaplar (~200 kelime/dk) */
function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function data(d: BlogInput) {
  return {
    title: d.title,
    excerpt: d.excerpt || null,
    content: d.content,
    coverImage: d.coverImage || null,
    category: d.category || null,
    readTime: d.readTime ?? estimateReadTime(d.content),
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    isPublished: d.isPublished,
  };
}

export async function createBlogPost(input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = blogSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const slug = await uniqueSlug("blogPost", parsed.data.slug || parsed.data.title);
    await prisma.blogPost.create({ data: { ...data(parsed.data), slug } });
    revalidateSite();
    return { ok: true, message: "Yazı oluşturuldu." };
  });
}

export async function updateBlogPost(id: string, input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = blogSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const slug = await uniqueSlug("blogPost", parsed.data.slug || parsed.data.title, id);
    await prisma.blogPost.update({ where: { id }, data: { ...data(parsed.data), slug } });
    revalidateSite();
    return { ok: true, message: "Yazı güncellendi." };
  });
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.blogPost.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Yazı silindi." };
  });
}

export async function toggleBlogFlag(id: string, field: "isPublished" | "isFeatured"): Promise<ActionResult> {
  return adminAction(async () => {
    if (field !== "isPublished") return { ok: false, message: "Geçersiz alan." };
    const post = await prisma.blogPost.findUnique({ where: { id }, select: { isPublished: true } });
    if (!post) return { ok: false, message: "Yazı bulunamadı." };
    await prisma.blogPost.update({ where: { id }, data: { isPublished: !post.isPublished } });
    revalidateSite();
    return { ok: true, message: post.isPublished ? "Yazı taslağa alındı." : "Yazı yayınlandı." };
  });
}
