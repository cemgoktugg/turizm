"use server";

import { prisma } from "@/lib/prisma";
import { storySchema, type StoryInput } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

function storyData(d: StoryInput) {
  return {
    title: d.title,
    cover: d.cover || null,
    buttonLabel: d.buttonLabel || null,
    buttonUrl: d.buttonLabel ? d.buttonUrl || null : null,
    isPublished: d.isPublished,
    items: {
      create: d.items.map((it, i) => ({
        url: it.url,
        caption: it.caption || null,
        duration: it.duration ?? null,
        order: i,
      })),
    },
  };
}

export async function createStory(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async () => {
    const parsed = storySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const last = await prisma.story.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const story = await prisma.story.create({ data: { ...storyData(parsed.data), order: (last?.order ?? -1) + 1 } });
    revalidateSite();
    return { ok: true, message: "Hikaye oluşturuldu.", data: { id: story.id } };
  });
}

export async function updateStory(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async () => {
    const parsed = storySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await prisma.$transaction([
      prisma.storyItem.deleteMany({ where: { storyId: id } }),
      prisma.story.update({ where: { id }, data: storyData(parsed.data) }),
    ]);
    revalidateSite();
    return { ok: true, message: "Hikaye güncellendi.", data: { id } };
  });
}

export async function deleteStory(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.story.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Hikaye silindi." };
  });
}

/** Yayın durumunu değiştirir (FlagToggle ile uyumlu imza) */
export async function toggleStoryPublished(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const story = await prisma.story.findUnique({ where: { id }, select: { isPublished: true } });
    if (!story) return { ok: false, message: "Hikaye bulunamadı." };
    await prisma.story.update({ where: { id }, data: { isPublished: !story.isPublished } });
    revalidateSite();
    return { ok: true, message: story.isPublished ? "Hikaye yayından kaldırıldı." : "Hikaye yayına alındı." };
  });
}

/** Hikayeyi bir sola / sağa taşır */
export async function moveStory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  return adminAction(async () => {
    const list = await prisma.story.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const i = list.findIndex((s) => s.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return { ok: true, message: "" };
    [list[i], list[j]] = [list[j], list[i]];
    await prisma.$transaction(list.map((s, order) => prisma.story.update({ where: { id: s.id }, data: { order } })));
    revalidateSite();
    return { ok: true, message: "Sıralama güncellendi." };
  });
}
