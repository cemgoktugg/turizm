/**
 * Kullanıcı rolleri:
 * - ADMIN: her şey (kullanıcı yönetimi, tahsilat silme, kasa teslimi dahil)
 * - STAFF: site içeriği + satış
 * - SALES: yalnızca Satış Programı (/satis); site içeriğine giremez
 */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yönetici",
  STAFF: "Personel (site + satış)",
  SALES: "Satış personeli",
};

/** Yöneticinin personele atayabileceği roller */
export const ASSIGNABLE_ROLES = ["STAFF", "SALES"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/** Yönetim paneline (site içeriği) girebilir mi */
export function canManageSite(role: string) {
  return role === "ADMIN" || role === "STAFF";
}
