import { Play } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { isVideoUrl } from "@/lib/media-types";
import { cn } from "@/lib/utils";

/**
 * Görsel veya video küçük resmi. Videolarda ilk kare gösterilir
 * (yalnızca üst veri indirilir) ve köşede oynat simgesi çıkar.
 */
export function MediaThumb({
  src,
  alt = "",
  className,
  badge = true,
  sizes = "160px",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  badge?: boolean;
  /** Küçük resim olduğu için varsayılan olarak küçük kopya seçilir */
  sizes?: string;
}) {
  if (!isVideoUrl(src)) return <SmartImage src={src} alt={alt} sizes={sizes} className={className} />;
  return (
    <span className={cn("relative block overflow-hidden bg-brand-950", className)}>
      <video src={`${src}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" aria-label={alt} />
      {badge && (
        <span className="absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white">
          <Play className="ml-px size-3 fill-current" />
        </span>
      )}
    </span>
  );
}
