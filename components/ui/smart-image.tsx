import { cn } from "@/lib/utils";
import { uploadSrcSet } from "@/lib/image-variants";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Görsel yoksa gösterilecek yedek */
  fallback?: string;
  /**
   * Görselin ekranda kaplayacağı genişlik (ör. "(min-width: 1024px) 33vw, 100vw").
   * Panelden yüklenen görsellerde tarayıcı buna göre küçültülmüş kopyayı seçer.
   */
  sizes?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">;

/**
 * Yerel SVG placeholder'lar ve uzak URL'lerle uyumlu, güvenli görsel bileşeni.
 * next/image'in SVG/remote kısıtlarından kaçınmak için sade <img> kullanır;
 * yüklenen görseller için srcset ile mobilde küçük dosya indirilir.
 */
export function SmartImage({
  src,
  alt = "",
  className,
  fallback = "/images/logo-mark.svg",
  loading = "lazy",
  sizes = "100vw",
  ...props
}: Props) {
  const url = src || fallback;
  const srcSet = uploadSrcSet(url);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
