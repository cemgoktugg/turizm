"use server";

import { redirect } from "next/navigation";
import {
  verifyCredentials,
  createSession,
  destroySession,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import type { ActionResult } from "./leads";

/** Admin girişi */
export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Lütfen bilgilerinizi kontrol edin." };
  }

  const { email, password } = parsed.data;
  const user = await verifyCredentials(email, password);
  if (!user) {
    return { ok: false, message: "E-posta veya şifre hatalı." };
  }

  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return { ok: true, message: "Giriş başarılı. Yönlendiriliyorsunuz..." };
}

/** Çıkış */
export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
