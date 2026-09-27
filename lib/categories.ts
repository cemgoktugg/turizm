/**
 * Sitenin sabit sayfalarına bağlı kategoriler.
 * Bu slug'lar /hac, /umre, /umre/luks-umre gibi sayfaların tur listelerini
 * belirler; bu yüzden panelden slug'ları değiştirilemez ve silinemezler.
 */
export const SYSTEM_CATEGORIES: Record<string, { landing: string; usedBy: string }> = {
  hac: { landing: "/hac", usedBy: "Hac ve Hac Programları sayfaları" },
  umre: { landing: "/umre", usedBy: "Umre ve Kesin Tarihli Turlar sayfaları" },
  "luks-umre": { landing: "/umre/luks-umre", usedBy: "Lüks Umre sayfası" },
  "ramazan-umresi": { landing: "/umre/ramazan-umresi", usedBy: "Ramazan Umresi sayfası" },
  "kultur-turlari": { landing: "/turlar?kategori=kultur-turlari", usedBy: "Footer ve tur filtresi" },
};

/** Umre sayfalarında listelenen kategoriler */
export const UMRE_CATEGORY_SLUGS = ["umre", "luks-umre", "ramazan-umresi"];

export function isSystemCategory(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(SYSTEM_CATEGORIES, slug);
}

/** Kategori kartının gideceği sayfa */
export function categoryHref(slug: string): string {
  return SYSTEM_CATEGORIES[slug]?.landing ?? `/turlar?kategori=${encodeURIComponent(slug)}`;
}
