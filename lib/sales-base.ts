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

/**
 * Tahsilat / iade makbuzu. Yalnızca Satış Programı adresinde açılır (yazdırırken
 * programın çerçevesi gizlenir); print: sayfa açılınca yazdırma penceresi gelir.
 */
export function receiptHref(paymentId: number, print = false) {
  return `${SALES_BASE}/makbuz/${paymentId}${print ? "?yazdir=1" : ""}`;
}

/** Satışın yazdırılabilir umre sözleşmesi (makbuz gibi yalnızca Satış Programı adresinde) */
export function contractHref(saleId: number) {
  return `${SALES_BASE}/sozlesme/${saleId}`;
}

export function salesBaseOf(pathname: string): SalesBase {
  return pathname === LEGACY_SALES_BASE || pathname.startsWith(`${LEGACY_SALES_BASE}/`) ? LEGACY_SALES_BASE : SALES_BASE;
}
