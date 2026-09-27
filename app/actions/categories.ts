"use server";

import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { categorySchema } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";
import { isSystemCategory } from "@/lib/categories";

export async function createCategory(input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const slug = await uniqueSlug("tourCategory", d.slug || d.name);
    const last = await prisma.tourCategory.aggregate({ _max: { order: true } });
    await prisma.tourCategory.create({
      data: {
        name: d.name,
        slug,
        description: d.description || null,
        image: d.image || null,
        icon: d.icon || null,
        order: d.order ?? (last._max.order ?? 0) + 1,
      },
    });
    revalidateSite();
    return { ok: true, message: "Kategori eklendi." };
  });
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const current = await prisma.tourCategory.findUnique({ where: { id }, select: { slug: true, order: true } });
    if (!current) return { ok: false, message: "Kategori bulunamadı." };

    // Sistem kategorilerinin slug'ı sayfalara bağlı olduğu için sabit kalır
    const slug = isSystemCategory(current.slug)
      ? current.slug
      : await uniqueSlug("tourCategory", d.slug || d.name, id);

    await prisma.tourCategory.update({
      where: { id },
      data: {
        name: d.name,
        slug,
        description: d.description || null,
        image: d.image || null,
        icon: d.icon || null,
        order: d.order ?? current.order,
      },
    });
    revalidateSite();
    return { ok: true, message: "Kategori güncellendi." };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const cat = await prisma.tourCategory.findUnique({
      where: { id },
      select: { slug: true, _count: { select: { tours: true } } },
    });
    if (!cat) return { ok: false, message: "Kategori bulunamadı." };
    if (isSystemCategory(cat.slug))
      return { ok: false, message: "Bu kategori site sayfalarına bağlı olduğu için silinemez." };
    if (cat._count.tours > 0)
      return {
        ok: false,
        message: `Bu kategoride ${cat._count.tours} tur var. Önce turları başka kategoriye taşıyın.`,
      };
    await prisma.tourCategory.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Kategori silindi." };
  });
}

/** Sıralamayı bir adım yukarı / aşağı taşır */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  return adminAction(async () => {
    const all = await prisma.tourCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true } });
    const idx = all.findIndex((c) => c.id === id);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= all.length) return { ok: true, message: "Sıra değişmedi." };
    [all[idx], all[swap]] = [all[swap], all[idx]];
    await prisma.$transaction(all.map((c, i) => prisma.tourCategory.update({ where: { id: c.id }, data: { order: i + 1 } })));
    revalidateSite();
    return { ok: true, message: "Sıralama güncellendi." };
  });
}
