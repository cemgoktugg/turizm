"use server";

import { prisma } from "@/lib/prisma";
import { certificateSchema, type CertificateInput } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

function data(d: CertificateInput) {
  return {
    title: d.title,
    image: d.image,
    description: d.description || null,
    order: d.order ?? 0,
    isPublished: d.isPublished,
  };
}

export async function createCertificate(input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = certificateSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await prisma.documentCertificate.create({ data: data(parsed.data) });
    revalidateSite();
    return { ok: true, message: "Belge eklendi." };
  });
}

export async function updateCertificate(id: string, input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = certificateSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await prisma.documentCertificate.update({ where: { id }, data: data(parsed.data) });
    revalidateSite();
    return { ok: true, message: "Belge güncellendi." };
  });
}

export async function deleteCertificate(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.documentCertificate.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Belge silindi." };
  });
}
