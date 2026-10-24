"use server";

import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { toSlug } from "@/lib/utils";
import { RESERVED_SLUGS } from "@/lib/landing";
import { landingSchema, type LandingInput } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

function data(d: LandingInput) {
  return {
    title: d.title,
    description: d.description || null,
    image: d.image || null,
    content: d.content,
    tourCategories: d.tourCategories.length ? d.tourCategories.join(",") : null,
    tourSearch: d.tourSearch || null,
    toursTitle: d.toursTitle || null,
    toursSort: d.toursSort,
    faqs: d.faqs.length ? JSON.stringify(d.faqs) : null,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    isPublished: d.isPublished,
  };
}

/** Sitedeki sabit sayfalarla çakışan adresleri reddeder */
async function resolveSlug(d: LandingInput, excludeId?: string): Promise<{ slug: string } | { error: ActionResult }> {
  const base = toSlug(d.slug || d.title);
  if (!base || RESERVED_SLUGS.has(base)) {
    return {
      error: {
        ok: false,
        message: "Bu adres sitede başka bir sayfa tarafından kullanılıyor.",
        fieldErrors: { slug: "Farklı bir adres yazın (ör. sivas-umre-turlari)" },
      },
    };
  }
  return { slug: await uniqueSlug("landingPage", base, excludeId) };
}

export async function createLandingPage(input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = landingSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const res = await resolveSlug(parsed.data);
    if ("error" in res) return res.error;
    await prisma.landingPage.create({ data: { ...data(parsed.data), slug: res.slug } });
    revalidateSite();
    return { ok: true, message: "Sayfa oluşturuldu." };
  });
}

export async function updateLandingPage(id: string, input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = landingSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const res = await resolveSlug(parsed.data, id);
    if ("error" in res) return res.error;
    await prisma.landingPage.update({ where: { id }, data: { ...data(parsed.data), slug: res.slug } });
    revalidateSite();
    return { ok: true, message: "Sayfa güncellendi." };
  });
}

export async function deleteLandingPage(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.landingPage.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Sayfa silindi." };
  });
}

export async function toggleLandingFlag(id: string, field: "isPublished" | "isFeatured"): Promise<ActionResult> {
  return adminAction(async () => {
    if (field !== "isPublished") return { ok: false, message: "Geçersiz alan." };
    const page = await prisma.landingPage.findUnique({ where: { id }, select: { isPublished: true } });
    if (!page) return { ok: false, message: "Sayfa bulunamadı." };
    await prisma.landingPage.update({ where: { id }, data: { isPublished: !page.isPublished } });
    revalidateSite();
    return { ok: true, message: page.isPublished ? "Sayfa taslağa alındı." : "Sayfa yayınlandı." };
  });
}
