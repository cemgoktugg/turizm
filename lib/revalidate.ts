import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Admin panelinde yapılan her değişiklikten sonra çağrılır.
 * Kök layout'u yenileyerek tüm genel sayfaları (ana sayfa, listeler, detaylar,
 * sitemap) ve paneli birlikte günceller; böylece hiçbir sayfa eski veriyle kalmaz.
 */
export function revalidateSite() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
