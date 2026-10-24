export type ContactType = "phone" | "email";

/**
 * Kayıt kutusuna yazılan değeri telefon ya da e-posta olarak tanır ve tek biçime
 * getirir (0555 111 22 33 → 905551112233). Tanınamazsa null döner.
 */
export function normalizeContact(raw: string): { type: ContactType; contact: string } | null {
  const value = raw.trim();
  if (value.includes("@")) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120 ? { type: "email", contact: email } : null;
  }
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `9${digits}`;
  else if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? { type: "phone", contact: digits } : null;
}

/**
 * Gösterim: 905551112233 → +90 555 111 22 33. `national` → 0555 111 22 33
 * (Excel "+" ile başlayan hücreleri formül sandığı için dışa aktarmada kullanılır).
 */
export function formatContact(type: string, contact: string, national = false): string {
  if (type !== "phone") return contact;
  const m = contact.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (m) return national ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+90 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
  return national ? `00${contact}` : `+${contact}`;
}
