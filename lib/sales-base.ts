/**
 * Satış Programı'nın adresi. Aynı sayfalar geçiş dönemi için eski adreste
 * (/admin/satis, yönetim panelinin içinde) de açılır; sayfalardaki bağlantılar
 * hangi adresten girildiyse orada kalır.
 *
 * Sunucuda: getSalesBase() (lib/sales-base-server.ts), istemcide: useSalesBase().
 */
export const SALES_BASE = "/satis";
export const LEGACY_SALES_BASE = "/admin/satis";
export type SalesBase = typeof SALES_BASE | typeof LEGACY_SALES_BASE;

/** Proxy'nin sayfalara ilettiği istek başlığı */
export const SALES_BASE_HEADER = "x-sales-base";

export function salesBaseOf(pathname: string): SalesBase {
  return pathname === LEGACY_SALES_BASE || pathname.startsWith(`${LEGACY_SALES_BASE}/`) ? LEGACY_SALES_BASE : SALES_BASE;
}
