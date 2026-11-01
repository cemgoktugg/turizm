"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkPassword, createSession, hashPassword } from "@/lib/auth";
import { ADMIN_ONLY, adminAction, invalid, type ActionResult } from "@/lib/action";
import { passwordChangeSchema, profileSchema, userCreateSchema } from "@/lib/validations";

/** Kendi ad / e-posta bilgilerini günceller */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  return adminAction(async (me, audit) => {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const taken = await prisma.user.findFirst({
      where: { email: parsed.data.email, id: { not: me.id } },
      select: { id: true },
    });
    if (taken) return { ok: false, message: "Bu e-posta başka bir kullanıcıya ait.", fieldErrors: { email: "Bu e-posta kullanılıyor" } };
    await prisma.user.update({ where: { id: me.id }, data: parsed.data });
    revalidatePath("/admin", "layout");
    audit({ detail: `Profil bilgilerini güncelledi (${parsed.data.name}, ${parsed.data.email})` });
    return { ok: true, message: "Profil bilgileriniz güncellendi." };
  });
}

/**
 * Şifre değiştirir. tokenVersion artırılarak diğer cihazlardaki oturumlar
 * geçersiz olur; mevcut oturum yeni sürümle yeniden oluşturulur.
 */
export async function changePassword(input: unknown): Promise<ActionResult> {
  return adminAction(async (me, audit) => {
    const parsed = passwordChangeSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    if (!(await checkPassword(me.id, parsed.data.currentPassword))) {
      return { ok: false, message: "Mevcut şifre hatalı.", fieldErrors: { currentPassword: "Mevcut şifre hatalı" } };
    }
    const user = await prisma.user.update({
      where: { id: me.id },
      data: {
        password: await hashPassword(parsed.data.newPassword),
        passwordChangedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    });
    await createSession(user);
    revalidatePath("/admin", "layout");
    audit({ detail: "Şifresini değiştirdi" });
    return { ok: true, message: "Şifreniz değiştirildi. Diğer cihazlardaki oturumlar kapatıldı." };
  });
}

/** Yeni personel hesabı ekler */
export async function createUser(input: unknown): Promise<ActionResult> {
  return adminAction(async (me, audit) => {
    if (me.role !== "ADMIN") return ADMIN_ONLY;
    const parsed = userCreateSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (exists) return { ok: false, message: "Bu e-posta ile kayıtlı bir kullanıcı var.", fieldErrors: { email: "Bu e-posta kullanılıyor" } };
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: await hashPassword(parsed.data.password),
        role: "STAFF",
        // Yeni kullanıcı ilk girişte şifresini değiştirmeye yönlendirilir
        passwordChangedAt: null,
      },
    });
    revalidatePath("/admin/users");
    audit({ detail: `Kullanıcı eklendi: ${parsed.data.name} (${parsed.data.email})` });
    return { ok: true, message: "Kullanıcı eklendi. Geçici şifreyi kendisiyle güvenli bir yoldan paylaşın." };
  });
}

/** Kullanıcı siler (kendini ve son kullanıcıyı silemez) */
export async function deleteUser(id: string): Promise<ActionResult> {
  return adminAction(async (me, audit) => {
    if (me.role !== "ADMIN") return ADMIN_ONLY;
    if (id === me.id) return { ok: false, message: "Kendi hesabınızı silemezsiniz." };
    const count = await prisma.user.count();
    if (count <= 1) return { ok: false, message: "Son yönetici hesabı silinemez." };
    const deleted = await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    audit({ detail: `Kullanıcı silindi: ${deleted.name} (${deleted.email})` });
    return { ok: true, message: "Kullanıcı silindi; açık oturumları sonlandırıldı." };
  });
}
