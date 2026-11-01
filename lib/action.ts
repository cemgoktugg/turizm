import "server-only";
import { Prisma } from "@prisma/client";
import type { ZodError } from "zod";
import { recordActivity, type AuditEntry } from "./activity";
import { getCurrentUser, type CurrentUser } from "./auth";
import type { ActionResult } from "./types";

export type { ActionResult } from "./types";

/** Zod hatalarını alan → mesaj eşlemesine çevirir (iç içe yollar "a.0.b" biçiminde) */
export function toFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function invalid(error: ZodError): ActionResult<never> {
  const fieldErrors = toFieldErrors(error);
  const first = Object.values(fieldErrors)[0];
  return { ok: false, message: first ? `Lütfen formu kontrol edin: ${first}` : "Geçersiz veri.", fieldErrors };
}

/** Yalnızca yönetici hesabının yapabileceği işlemlerde dönülen sonuç */
export const ADMIN_ONLY = { ok: false, message: "Bu işlemi yalnızca yönetici hesabı yapabilir." } as const;

/**
 * Admin işlemleri için sarmalayıcı: oturum kontrolü + beklenmeyen hataları
 * kullanıcı dostu mesaja çevirme. (Hata fırlatmak yerine sonuç döndürür ki
 * formlar her durumda bildirim gösterebilsin.)
 *
 * Başarılı her işlem işlem geçmişine yazılır: audit() çağrıldıysa o ayrıntı,
 * çağrılmadıysa kullanıcıya gösterilen mesaj. Mesajı boş olanlar (arama gibi
 * salt okunur işlemler) yazılmaz.
 */
export async function adminAction<T>(
  fn: (user: CurrentUser, audit: (entry: AuditEntry) => void) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Oturumunuz sona erdi. Lütfen sayfayı yenileyip tekrar giriş yapın." };
  try {
    const entries: AuditEntry[] = [];
    const result = await fn(user, (entry) => entries.push(entry));
    if (result.ok) {
      const entry = entries[0] ?? (result.message ? { detail: result.message } : null);
      if (entry) await recordActivity(user, entry);
    }
    return result;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return { ok: false, message: "Bu değer (ör. slug veya e-posta) zaten kullanılıyor." };
      if (e.code === "P2025") return { ok: false, message: "Kayıt bulunamadı; silinmiş olabilir. Sayfayı yenileyin." };
      if (e.code === "P2003") return { ok: false, message: "Bu kayıt başka kayıtlarla ilişkili olduğu için işlem yapılamadı." };
    }
    console.error("[admin-action]", e);
    return { ok: false, message: "İşlem sırasında beklenmeyen bir hata oluştu." };
  }
}
