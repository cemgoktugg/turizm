"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { hotelSchema } from "@/lib/validations";
import type { ActionResult } from "./leads";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Yetkisiz erişim.");
}

function data(d: ReturnType<typeof hotelSchema.parse>) {
  return {
    name: d.name,
    city: d.city,
    region: d.region || null,
    distance: d.distance || null,
    stars: d.stars ?? null,
    description: d.description || null,
    images: d.images || null,
    isPublished: Boolean(d.isPublished),
  };
}

export async function createHotel(input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  const slug = await uniqueSlug("hotel", parsed.data.slug || parsed.data.name);
  await prisma.hotel.create({ data: { ...data(parsed.data), slug } });
  revalidatePath("/admin/hotels");
  revalidatePath("/oteller");
  return { ok: true, message: "Otel oluşturuldu." };
}

export async function updateHotel(id: string, input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  const slug = await uniqueSlug("hotel", parsed.data.slug || parsed.data.name, id);
  await prisma.hotel.update({ where: { id }, data: { ...data(parsed.data), slug } });
  revalidatePath("/admin/hotels");
  revalidatePath("/oteller");
  return { ok: true, message: "Otel güncellendi." };
}

export async function deleteHotel(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.hotel.delete({ where: { id } });
  revalidatePath("/admin/hotels");
  revalidatePath("/oteller");
  return { ok: true, message: "Otel silindi." };
}
