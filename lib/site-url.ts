/**
 * Sitenin canlı adresi (ör. https://nemira.com.tr).
 * Çalışma anında `SITE_URL` ortam değişkeninden okunur; böylece alan adı
 * değişince yeniden derleme gerekmez. Yerelde .env'deki NEXT_PUBLIC_SITE_URL kullanılır.
 */
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);
