import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./prisma";
import { normalizeUsername } from "./username";
import {
  PATHNAME_HEADER,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isProfilePath,
  signSession,
  verifySession,
} from "./session";

export { SESSION_COOKIE } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** Girişte e-posta yerine yazılabilen kullanıcı adı (yoksa null) */
  username: string | null;
  role: string;
  /** Şifre hiç değiştirilmemişse (seed'deki varsayılan şifre) true */
  mustChangePassword: boolean;
};

let dummyHash: string | undefined;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Girişte yazılan değer: "@" içeriyorsa e-posta, değilse kullanıcı adı (sadeleştirilmiş) */
export function loginKey(login: string): { email: string } | { username: string } {
  const value = login.trim();
  return value.includes("@") ? { email: value.toLowerCase() } : { username: normalizeUsername(value) };
}

/** E-posta veya kullanıcı adı + şifre doğrular, geçerliyse kullanıcıyı döndürür */
export async function verifyCredentials(login: string, password: string) {
  const user = await prisma.user.findUnique({ where: loginKey(login) });
  if (!user) {
    // Zamanlama farkıyla hesap tahminini zorlaştırmak için yine de hash karşılaştır
    await bcrypt.compare(password, (dummyHash ??= bcrypt.hashSync("zamanlama-dengesi", 10)));
    return null;
  }
  const ok = await bcrypt.compare(password, user.password);
  return ok ? user : null;
}

export async function checkPassword(userId: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}

/** Oturum çerezini oluşturur */
export async function createSession(user: { id: string; tokenVersion: number; passwordChangedAt: Date | null }) {
  // Geçici şifreyle açılan oturum işaretlenir; proxy kullanıcıyı Hesabım'a yönlendirir
  const token = signSession({ sub: user.id, ver: user.tokenVersion, ...(user.passwordChangedAt === null ? { tmp: true } : {}) });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Oturumu sonlandırır */
export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Aktif kullanıcıyı döndürür (istek başına önbelleklenir).
 * İmza + kullanıcının hâlâ var olması + tokenVersion eşleşmesi kontrol edilir.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const payload = verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      tokenVersion: true,
      passwordChangedAt: true,
    },
  });
  if (!user || user.tokenVersion !== payload.ver) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    mustChangePassword: user.passwordChangedAt === null,
  };
});

/** Server action'larda yetki kontrolü */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
  return user;
}

/**
 * Geçici (ilk verilen) şifreyle giren kullanıcı, kendi şifresini belirleyene kadar
 * yalnızca Hesabım sayfasını açabilir; diğer sayfalar oraya yönlendirir.
 */
export async function requireOwnPassword(user: CurrentUser, profileHref: string) {
  if (!user.mustChangePassword) return;
  const pathname = (await headers()).get(PATHNAME_HEADER);
  if (pathname && !isProfilePath(pathname)) redirect(profileHref);
}
