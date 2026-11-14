"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkPassword, createSession, hashPassword } from "@/lib/auth";
import { ADMIN_ONLY, adminAction, invalid, salesAction, type ActionResult } from "@/lib/action";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/roles";
import { passwordChangeSchema, profileSchema, userCreateSchema } from "@/lib/validations";
import { normalizeUsername } from "@/lib/username";

/** E-posta / kullanıcı adı başka hesapta kullanılıyorsa hata sonucu */
async function identityTaken(email: string, username: string | null, exceptId?: string): Promise<ActionResult | null> {
  const others = await prisma.user.findMany({
    where: { OR: [{ email }, ...(username ? [{ username }] : [])], ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { email: true, username: true },
  });
  if (others.some((u) => u.email === email))
    return { ok: false, message: "Bu e-posta başka bir kullanıcıya ait.", fieldErrors: { email: "Bu e-posta kullanılıyor" } };
  if (username && others.some((u) => u.username === username))
    return { ok: false, message: `"${username}" kullanıcı adı başka bir kullanıcıya ait.`, fieldErrors: { username: "Bu kullanıcı adı kullanılıyor" } };
  return null;
}

/** Kendi ad / e-posta / kullanıcı adı bilgilerini günceller */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { name, email } = parsed.data;
    const username = normalizeUsername(parsed.data.username) || null;
    const taken = await identityTaken(email, username, me.id);
    if (taken) return taken;
    await prisma.user.update({ where: { id: me.id }, data: { name, email, username } });
    revalidatePath("/admin", "layout");
    revalidatePath("/satis", "layout");
    audit({ detail: `Profil bilgilerini güncelledi (${name}, ${email}${username ? `, kullanıcı adı: ${username}` : ""})` });
    return { ok: true, message: "Profil bilgileriniz güncellendi." };
  });
}

/**
 * Şifre değiştirir. tokenVersion artırılarak diğer cihazlardaki oturumlar
 * geçersiz olur; mevcut oturum yeni sürümle yeniden oluşturulur.
 */
export async function changePassword(input: unknown): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
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
    revalidatePath("/satis", "layout");
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
    const username = normalizeUsername(parsed.data.username);
    const taken = await identityTaken(parsed.data.email, username);
    if (taken) return taken;
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        username,
        password: await hashPassword(parsed.data.password),
        role: parsed.data.role,
        // Yeni kullanıcı ilk girişte şifresini değiştirmeye yönlendirilir
        passwordChangedAt: null,
      },
    });
    revalidatePath("/admin/users");
    audit({ detail: `Kullanıcı eklendi: ${parsed.data.name} (kullanıcı adı: ${username}, ${parsed.data.email}, ${ROLE_LABELS[parsed.data.role]})` });
    return { ok: true, message: `Kullanıcı eklendi. "${username}" kullanıcı adı ve geçici şifreyle giriş yapabilir; şifreyi kendisiyle güvenli bir yoldan paylaşın.` };
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

/** Personelin yetkisini değiştirir (yönetici hesapları bu yolla değiştirilemez) */
export async function updateUserRole(id: string, role: string): Promise<ActionResult> {
  return adminAction(async (me, audit) => {
    if (me.role !== "ADMIN") return ADMIN_ONLY;
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) return { ok: false, message: "Geçersiz yetki." };
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true, role: true } });
    if (!user) return { ok: false, message: "Kullanıcı bulunamadı; silinmiş olabilir." };
    if (user.role === "ADMIN") return { ok: false, message: "Yönetici hesabının yetkisi buradan değiştirilemez." };
    if (user.role === role) return { ok: true, message: "" };
    await prisma.user.update({ where: { id }, data: { role } });
    revalidatePath("/admin/users");
    audit({ entity: "User", entityId: id, detail: `${user.name} yetkisi değişti: ${ROLE_LABELS[user.role] ?? user.role} → ${ROLE_LABELS[role]}` });
    return { ok: true, message: `${user.name} artık: ${ROLE_LABELS[role]}` };
  });
}
