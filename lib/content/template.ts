/**
 * Panelde düzenlenen metinlerdeki {anahtar} yer tutucularını doldurur.
 * Örn. fill("{gun} Gün / {gece} Gece", { gun: 13, gece: 12 }) → "13 Gün / 12 Gece"
 * Bilinmeyen yer tutucular olduğu gibi bırakılır.
 */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
