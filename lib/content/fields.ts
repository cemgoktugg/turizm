import { z } from "zod";

/**
 * İçerik bloklarının alan tanımları.
 * Aynı tanımdan hem admin formu (components/admin/content-editor.tsx)
 * hem de sunucu doğrulaması (schemaFromFields) üretilir; böylece panel ile
 * site arasında alan uyuşmazlığı oluşamaz.
 */

type Base = { name: string; label: string; help?: string };

export type FieldSpec =
  | (Base & { type: "text"; placeholder?: string; max?: number })
  | (Base & { type: "textarea"; rows?: number; placeholder?: string; max?: number })
  /** Her satır bir öğe (string[]) */
  | (Base & { type: "lines"; rows?: number; placeholder?: string })
  | (Base & { type: "image" })
  | (Base & { type: "icon" })
  /** Site içi veya dış bağlantı */
  | (Base & { type: "link"; placeholder?: string })
  | (Base & {
      type: "list";
      itemLabel: string;
      fields: FieldSpec[];
      min?: number;
      max?: number;
      /** Liste öğesinin başlığında gösterilecek alan */
      titleField?: string;
    })
  | (Base & { type: "group"; fields: FieldSpec[] });

const text = (max = 2000) => z.string().trim().max(max, `En fazla ${max} karakter`);

function fieldSchema(f: FieldSpec): z.ZodType {
  switch (f.type) {
    case "text":
      return text(f.max ?? 300);
    case "textarea":
      return text(f.max ?? 5000);
    case "lines":
      return z.array(text(1000)).max(100);
    case "image":
    case "link":
      return text(1000);
    case "icon":
      return text(60);
    case "list": {
      let arr = z.array(schemaFromFields(f.fields));
      if (f.min != null) arr = arr.min(f.min, `En az ${f.min} öğe olmalı`);
      arr = arr.max(f.max ?? 50, `En fazla ${f.max ?? 50} öğe eklenebilir`);
      return arr;
    }
    case "group":
      return schemaFromFields(f.fields);
  }
}

export function schemaFromFields(fields: FieldSpec[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f);
  return z.object(shape);
}

/* ------------------------------------------------------------------ */
/* Form <-> veri dönüşümü: "lines" alanları formda tek textarea'dır     */
/* ------------------------------------------------------------------ */

type Obj = Record<string, unknown>;

export function toFormValues(fields: FieldSpec[], data: Obj): Obj {
  const out: Obj = {};
  for (const f of fields) {
    const v = data?.[f.name];
    if (f.type === "lines") out[f.name] = Array.isArray(v) ? v.join("\n") : "";
    else if (f.type === "list")
      out[f.name] = Array.isArray(v) ? v.map((item) => toFormValues(f.fields, item as Obj)) : [];
    else if (f.type === "group") out[f.name] = toFormValues(f.fields, (v as Obj) ?? {});
    else out[f.name] = typeof v === "string" ? v : "";
  }
  return out;
}

export function fromFormValues(fields: FieldSpec[], values: Obj): Obj {
  const out: Obj = {};
  for (const f of fields) {
    const v = values?.[f.name];
    if (f.type === "lines")
      out[f.name] = String(v ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (f.type === "list")
      out[f.name] = Array.isArray(v) ? v.map((item) => fromFormValues(f.fields, item as Obj)) : [];
    else if (f.type === "group") out[f.name] = fromFormValues(f.fields, (v as Obj) ?? {});
    else out[f.name] = typeof v === "string" ? v : "";
  }
  return out;
}

/** Liste için boş öğe üretir */
export function emptyItem(fields: FieldSpec[]): Obj {
  return toFormValues(fields, {});
}

/* ------------------------------------------------------------------ */
/* Sık kullanılan alan setleri                                          */
/* ------------------------------------------------------------------ */

export const headingFields = (label = "Bölüm başlığı"): FieldSpec[] => [
  { type: "text", name: "eyebrow", label: `${label} — üst etiket`, placeholder: "Küçük üst başlık" },
  { type: "text", name: "title", label: `${label} — başlık` },
  { type: "textarea", name: "description", label: `${label} — açıklama`, rows: 2 },
];

export const seoFields: FieldSpec[] = [
  {
    type: "text",
    name: "seoTitle",
    label: "SEO başlığı",
    help: "Boş bırakılırsa sayfa başlığı kullanılır. Google'da ~60 karakter görünür.",
    max: 120,
  },
  {
    type: "textarea",
    name: "seoDescription",
    label: "SEO açıklaması",
    rows: 2,
    help: "Arama sonuçlarında görünen açıklama (~155 karakter). Boşsa sayfa açıklaması kullanılır.",
    max: 320,
  },
];

export const heroFields: FieldSpec[] = [
  { type: "text", name: "title", label: "Sayfa başlığı" },
  {
    type: "text",
    name: "crumb",
    label: "Sayfa yolundaki kısa ad",
    help: "Sayfa başındaki 'Ana Sayfa › …' yolunda ve alt sayfalarda üst sayfa adı olarak görünür.",
  },
  { type: "textarea", name: "description", label: "Başlık altı açıklama", rows: 2 },
  { type: "image", name: "image", label: "Üst görsel (arka plan)" },
];
