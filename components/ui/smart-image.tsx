import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Görsel yoksa gösterilecek yedek */
  fallback?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">;

/**
 * Yerel SVG placeholder'lar ve uzak URL'lerle uyumlu, güvenli görsel bileşeni.
 * next/image'in SVG/remote kısıtlarından kaçınmak için sade <img> kullanır.
 */
export function SmartImage({
  src,
  alt = "",
  className,
  fallback = "/images/logo-mark.svg",
  loading = "lazy",
  ...props
}: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || fallback}
      alt={alt}
      loading={loading}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
