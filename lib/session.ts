import jwt from "jsonwebtoken";

/**
 * Oturum çerezi ve JWT yardımcıları.
 * Veritabanına dokunmaz; hem proxy'de hem sunucu kodunda kullanılabilir.
 */

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-do-not-use-in-production";
const INSECURE_SECRETS = new Set(["", "change-this-secret-key"]);

let warned = false;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? "";
  if (secret.length >= 32 && !INSECURE_SECRETS.has(secret)) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET en az 32 karakterlik rastgele bir değer olmalıdır (.env.example dosyasına bakın).",
    );
  }
  if (!warned) {
    warned = true;
    console.warn("[auth] JWT_SECRET güvenli değil; yalnızca geliştirme için yedek anahtar kullanılıyor.");
  }
  return DEV_FALLBACK_SECRET;
}

export type SessionPayload = {
  /** Kullanıcı id */
  sub: string;
  /** Kullanıcının tokenVersion değeri — şifre değişince eski oturumlar düşer */
  ver: number;
};

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_MAX_AGE });
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (
      typeof decoded === "object" &&
      typeof decoded.sub === "string" &&
      typeof (decoded as { ver?: unknown }).ver === "number"
    ) {
      return { sub: decoded.sub, ver: (decoded as { ver: number }).ver };
    }
    return null;
  } catch {
    return null;
  }
}
