"use client";

import type { UploadKind } from "@/lib/media-types";

export type UploadedFile = {
  id: string;
  url: string;
  originalName: string;
  width: number | null;
  height: number | null;
  size: number;
};

/** Dosyaları /api/admin/upload uç noktasına yükler. Videolar yalnızca kind="media" ile kabul edilir. */
export async function uploadFiles(
  files: File[],
  kind: UploadKind = "image",
): Promise<{ files: UploadedFile[]; errors: string[] }> {
  const body = new FormData();
  body.append("kind", kind);
  for (const f of files) body.append("files", f);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const json = (await res.json().catch(() => null)) as { files?: UploadedFile[]; errors?: string[]; error?: string } | null;
    if (!json) return { files: [], errors: ["Sunucudan yanıt alınamadı. Dosya çok büyük olabilir."] };
    return {
      files: json.files ?? [],
      errors: json.error ? [json.error] : (json.errors ?? []),
    };
  } catch {
    return { files: [], errors: ["Bağlantı hatası. İnternet bağlantınızı kontrol edin."] };
  }
}

export const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/avif";
export const ACCEPT_MEDIA = `${ACCEPT_IMAGES},video/mp4,video/quicktime,video/webm`;

export function acceptFor(kind: UploadKind) {
  return kind === "media" ? ACCEPT_MEDIA : ACCEPT_IMAGES;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
