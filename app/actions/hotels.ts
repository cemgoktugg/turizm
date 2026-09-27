"use server";

import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { hotelSchema, type HotelInput } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

function data(d: HotelInput) {
  return {
    name: d.name,
    city: d.city,
    region: d.region || null,
    distance: d.distance || null,
    stars: d.stars ?? null,
    description: d.description || null,
    // Görseller veritabanında satır satır saklanır
    images: d.images.filter(Boolean).join("\n") || null,
    isPublished: d.isPublished,
  };
}

export async function createHotel(input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = hotelSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const slug = await uniqueSlug("hotel", parsed.data.slug || parsed.data.name);
    await prisma.hotel.create({ data: { ...data(parsed.data), slug } });
    revalidateSite();
    return { ok: true, message: "Otel eklendi." };
  });
}

export async function updateHotel(id: string, input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = hotelSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const slug = await uniqueSlug("hotel", parsed.data.slug || parsed.data.name, id);
    await prisma.hotel.update({ where: { id }, data: { ...data(parsed.data), slug } });
    revalidateSite();
    return { ok: true, message: "Otel güncellendi." };
  });
}

export async function deleteHotel(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.hotel.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Otel silindi." };
  });
}

export async function toggleHotelFlag(id: string, field: "isPublished" | "isFeatured"): Promise<ActionResult> {
  return adminAction(async () => {
    if (field !== "isPublished") return { ok: false, message: "Geçersiz alan." };
    const hotel = await prisma.hotel.findUnique({ where: { id }, select: { isPublished: true } });
    if (!hotel) return { ok: false, message: "Otel bulunamadı." };
    await prisma.hotel.update({ where: { id }, data: { isPublished: !hotel.isPublished } });
    revalidateSite();
    return { ok: true, message: hotel.isPublished ? "Otel yayından kaldırıldı." : "Otel yayına alındı." };
  });
}
