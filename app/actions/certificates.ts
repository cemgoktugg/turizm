"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { certificateSchema } from "@/lib/validations";
import type { ActionResult } from "./leads";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Yetkisiz erişim.");
}

function data(d: ReturnType<typeof certificateSchema.parse>) {
  return {
    title: d.title,
    image: d.image,
    description: d.description || null,
    order: d.order ?? 0,
    isPublished: Boolean(d.isPublished),
  };
}

export async function createCertificate(input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = certificateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  await prisma.documentCertificate.create({ data: data(parsed.data) });
  revalidatePath("/admin/certificates");
  revalidatePath("/hakkimizda");
  return { ok: true, message: "Belge eklendi." };
}

export async function updateCertificate(id: string, input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = certificateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  await prisma.documentCertificate.update({ where: { id }, data: data(parsed.data) });
  revalidatePath("/admin/certificates");
  revalidatePath("/hakkimizda");
  return { ok: true, message: "Belge güncellendi." };
}

export async function deleteCertificate(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.documentCertificate.delete({ where: { id } });
  revalidatePath("/admin/certificates");
  revalidatePath("/hakkimizda");
  return { ok: true, message: "Belge silindi." };
}
