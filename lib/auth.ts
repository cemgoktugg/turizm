import "server-only";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function getSecret(): string {
  return process.env.JWT_SECRET || "change-this-secret-key";
}

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

/** E-posta + şifre doğrular, geçerliyse kullanıcıyı döndürür */
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  return user;
}

/** Oturum çerezini oluşturur */
export async function createSession(payload: SessionPayload) {
  const token = signToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Oturumu sonlandırır */
export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Aktif kullanıcıyı döndürür (istek başına önbelleklenir) */
export const getCurrentUser = cache(
  async (): Promise<SessionPayload | null> => {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  },
);
