"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";
import { verifyCredentials, createSession, destroySession } from "@/lib/auth";
import { clientIp, clearHits, formatWait, registerHit, retryAfter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/action";

const WINDOW = 15 * 60 * 1000; // 15 dakika
const MAX_PER_IP = 20;
const MAX_PER_ACCOUNT = 5;

/** Admin girişi (kaba kuvvet denemelerine karşı hız sınırlı) */
export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Lütfen bilgilerinizi kontrol edin." };

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  const ipKey = `login-ip:${ip}`;
  const accountKey = `login-acc:${email}`;

  const wait = Math.max(retryAfter(ipKey, MAX_PER_IP, WINDOW), retryAfter(accountKey, MAX_PER_ACCOUNT, WINDOW));
  if (wait > 0) {
    return { ok: false, message: `Çok fazla hatalı deneme. Lütfen ${formatWait(wait)} sonra tekrar deneyin.` };
  }

  const user = await verifyCredentials(email, parsed.data.password);
  if (!user) {
    registerHit(ipKey);
    registerHit(accountKey);
    return { ok: false, message: "E-posta veya şifre hatalı." };
  }

  clearHits(accountKey);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user);
  await recordActivity(user, { detail: "Panele giriş yaptı" });
  return { ok: true, message: "Giriş başarılı. Yönlendiriliyorsunuz..." };
}

/** Çıkış */
export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
