/**
 * Kullanıcı adı kuralı (giriş ekranı, Hesabım ve Kullanıcılar ortak kullanır).
 * Küçük harfe çevrilir, Türkçe harfler sadeleştirilir: "Ömer", "ÖMER", "omer" aynı hesaptır.
 */
const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

export function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (c) => TR[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Sadeleştirilmiş hali: 3-30 karakter; harf, rakam, nokta, alt çizgi, tire */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export const USERNAME_HINT = "3-30 karakter; harf, rakam, nokta, alt çizgi veya tire (ör. omer)";
