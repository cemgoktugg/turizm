import "server-only";
import { headers } from "next/headers";
import { LEGACY_SALES_BASE, SALES_BASE, SALES_BASE_HEADER, type SalesBase } from "./sales-base";

/** Sayfanın hangi adresten (Satış Programı / eski panel adresi) açıldığı; başlığı proxy.ts koyar */
export async function getSalesBase(): Promise<SalesBase> {
  return (await headers()).get(SALES_BASE_HEADER) === LEGACY_SALES_BASE ? LEGACY_SALES_BASE : SALES_BASE;
}
