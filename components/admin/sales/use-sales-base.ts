"use client";

import { usePathname } from "next/navigation";
import { salesBaseOf } from "@/lib/sales-base";

/** İstemci bileşenlerinde satış sayfalarının adresi (/satis veya eski /admin/satis) */
export function useSalesBase() {
  return salesBaseOf(usePathname());
}
