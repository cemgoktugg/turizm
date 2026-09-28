import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { fieldSchema, type FieldSpec } from "./fields";
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

type Obj = Record<string, unknown>;

/** Grupları alt alan bazında birleştirir: gruba sonradan eklenen alanlar eski kayıtları bozmaz */
function mergeFields(fields: FieldSpec[], defaults: Obj, raw: Obj): Obj {
  const out: Obj = { ...defaults };
  for (const f of fields) {
    const value = raw[f.name];
    if (value === undefined) continue;
    if (f.type === "group") {
      if (value && typeof value === "object") {
        out[f.name] = mergeFields(f.fields, (defaults[f.name] as Obj) ?? {}, value as Obj);
      }
      continue;
    }
    const parsed = fieldSchema(f).safeParse(value);
    if (parsed.success) out[f.name] = parsed.data;
  }
  return out;
}

/**
 * Veritabanındaki kaydı varsayılanlarla alan bazında birleştirir.
 * Geçersiz / eksik alanlarda varsayılan değer kullanılır; site asla boş kalmaz.
 */
export function mergeWithDefaults<K extends ContentKey>(key: K, raw: unknown): ContentData<K> {
  const def = CONTENT_BLOCKS[key];
  if (!raw || typeof raw !== "object") return def.defaults as ContentData<K>;
  return mergeFields(def.fields, def.defaults as Obj, raw as Obj) as ContentData<K>;
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
