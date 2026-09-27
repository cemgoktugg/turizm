import type { BadgeProps } from "@/components/ui/badge";

/** Başvuru durumu → rozet rengi eşlemesi */
export const LEAD_STATUS_STYLES: Record<string, BadgeProps["variant"]> = {
  Yeni: "blue",
  Arandı: "amber",
  "Teklif Verildi": "navy",
  "Rezervasyon Alındı": "green",
  İptal: "red",
};
