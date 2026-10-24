/**
 * Panelden yüklenen görsellerin küçültülmüş halleri. /uploads/x.webp?w=800 ilk
 * istendiğinde üretilip diskte saklanır; tarayıcı srcset ile ekranına uygun olanı seçer.
 * Yalnız bu genişlikler üretilir (rastgele boyut istekleriyle disk doldurulamasın).
 */
export const VARIANT_WIDTHS = [480, 800, 1200, 1600] as const;

const RESIZABLE = /^\/uploads\/[^?#]+\.(webp|jpe?g|png|avif)$/i;

export function isResizable(src: string | null | undefined): src is string {
  return Boolean(src && RESIZABLE.test(src));
}

/** Yüklenen görsel için srcset (diğer görseller için undefined) */
export function uploadSrcSet(src: string | null | undefined): string | undefined {
  if (!isResizable(src)) return undefined;
  // Asıl dosya en fazla 2400 px; en büyük seçenek olarak o kullanılır
  return [...VARIANT_WIDTHS.map((w) => `${src}?w=${w} ${w}w`), `${src} 2400w`].join(", ");
}
