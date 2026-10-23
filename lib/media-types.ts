/** Bir görselin kullanıldığı yer (istemci ve sunucuda kullanılabilir) */
export type MediaUsage = { label: string; href: string };

/** Yükleme türü: yalnızca görsel veya görsel + video (hikayeler) */
export type UploadKind = "image" | "media";

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i;

/** Adres bir video dosyasını mı gösteriyor? (uzantıya göre) */
export function isVideoUrl(url?: string | null): boolean {
  return Boolean(url && VIDEO_RE.test(url));
}
