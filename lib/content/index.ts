import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { schemaFromFields } from "./fields";
import {
  CONTENT_BLOCKS,
  type ContentData,
  type ContentKey,
} from "./registry";

/** Tüm içerik kayıtları (istek başına tek sorgu) */
const loadRows = cache(async () => {
  try {
    const rows = await prisma.contentBlock.findMany();
    return new Map(rows.map((r) => [r.key, r]));
  } catch {
    return new Map<string, { key: string; data: string; updatedAt: Date }>();
  }
});

/**
 * Veritabanındaki kaydı varsayılanlarla alan bazında birleştirir.
 * Geçersiz / eksik alanlarda varsayılan değer kullanılır; site asla boş kalmaz.
 */
export function mergeWithDefaults<K extends ContentKey>(key: K, raw: unknown): ContentData<K> {
  const def = CONTENT_BLOCKS[key];
  const defaults = def.defaults as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return def.defaults as ContentData<K>;

  const shape = schemaFromFields(def.fields).shape;
  const out: Record<string, unknown> = { ...defaults };
  for (const [name, schema] of Object.entries(shape)) {
    const value = (raw as Record<string, unknown>)[name];
    if (value === undefined) continue;
    const parsed = schema.safeParse(value);
    if (parsed.success) out[name] = parsed.data;
  }
  return out as ContentData<K>;
}

export async function getContent<K extends ContentKey>(key: K): Promise<ContentData<K>> {
  const rows = await loadRows();
  const row = rows.get(key);
  if (!row) return CONTENT_BLOCKS[key].defaults as ContentData<K>;
  let raw: unknown = null;
  try {
    raw = JSON.parse(row.data);
  } catch {
    raw = null;
  }
  return mergeWithDefaults(key, raw);
}

type PageLike = {
  title: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
};

/** Sayfa içerik bloğundan metadata üretir */
export async function pageMetadata(key: ContentKey): Promise<Metadata> {
  const data = (await getContent(key)) as unknown as PageLike;
  const def = CONTENT_BLOCKS[key];
  const title = data.seoTitle || data.title;
  const description = data.seoDescription || data.description || undefined;
  return {
    title,
    description,
    alternates: def.path ? { canonical: def.path } : undefined,
    openGraph: {
      title,
      description,
      images: data.image ? [data.image] : undefined,
    },
  };
}

/** Admin listesi için: hangi bloklar düzenlenmiş, ne zaman */
export async function getContentStatus(): Promise<Record<string, Date>> {
  const rows = await loadRows();
  const out: Record<string, Date> = {};
  for (const [key, row] of rows) out[key] = row.updatedAt;
  return out;
}
