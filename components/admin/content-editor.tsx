"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { saveContent, resetContent } from "@/app/actions/content";
import { emptyItem, fromFormValues, toFormValues, type FieldSpec } from "@/lib/content/fields";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";
import { IconPicker } from "./icon-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type Obj = Record<string, unknown>;

const LINK_SUGGESTIONS = [
  "/",
  "/turlar",
  "/hac",
  "/hac/programlari",
  "/hac/dua-ve-vazifeler",
  "/hac/yetki-belgeleri",
  "/umre",
  "/umre/kesin-tarihli-turlar",
  "/umre/luks-umre",
  "/umre/ramazan-umresi",
  "/umre/dua-ve-vazifeler",
  "/umre/yetki-belgeleri",
  "/oteller",
  "/oteller/mekke",
  "/oteller/medine",
  "/blog",
  "/gerekli-bilgiler",
  "/hakkimizda",
  "/iletisim",
  "/rezervasyon",
];

export function ContentEditor({
  blockKey,
  fields,
  initial,
  isCustomized,
  path,
}: {
  blockKey: string;
  fields: FieldSpec[];
  initial: Obj;
  isCustomized: boolean;
  path?: string;
}) {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [resetting, startReset] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<FieldValues>({ defaultValues: toFormValues(fields, initial) });
  useUnsavedChanges(isDirty);

  async function onSubmit(values: FieldValues) {
    const data = fromFormValues(fields, values);
    const res = await saveContent(blockKey, data);
    setServerErrors(res.fieldErrors ?? {});
    if (res.ok) {
      toast.success(res.message);
      reset(toFormValues(fields, data));
      router.refresh();
    } else toast.error(res.message);
  }

  function onReset() {
    if (!confirm("Bu bölüm varsayılan içeriğine döndürülecek. Yaptığınız değişiklikler silinir. Emin misiniz?")) return;
    startReset(async () => {
      const res = await resetContent(blockKey);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
        // Sayfa yenilendiğinde varsayılanlar yeniden yüklenir
        window.location.reload();
      } else toast.error(res.message);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <datalist id="site-links">
        {LINK_SUGGESTIONS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6">
        <FieldList fields={fields} prefix="" control={control} register={register} errors={serverErrors} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          {isCustomized && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={resetting}>
              {resetting ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Varsayılana Dön
            </Button>
          )}
          {path && (
            <a
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <ExternalLink className="size-4" /> Sitede Gör
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs font-semibold text-amber-700">Kaydedilmemiş değişiklikler var</span>}
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            Kaydet ve Yayınla
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

type Ctx = {
  control: Control<FieldValues>;
  register: UseFormRegister<FieldValues>;
  errors: Record<string, string>;
};

function FieldList({ fields, prefix, ...ctx }: { fields: FieldSpec[]; prefix: string } & Ctx) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <FieldRenderer key={f.name} field={f} name={prefix ? `${prefix}.${f.name}` : f.name} {...ctx} />
      ))}
    </div>
  );
}

function wide(f: FieldSpec) {
  return f.type === "textarea" || f.type === "lines" || f.type === "list" || f.type === "group" || f.type === "image";
}

function FieldRenderer({ field: f, name, control, register, errors }: { field: FieldSpec; name: string } & Ctx) {
  const error = errors[name];
  const common = { label: f.label, error, className: cn(wide(f) && "sm:col-span-2") };
  const help = f.help ? <p className="mt-1 text-xs text-muted">{f.help}</p> : null;

  switch (f.type) {
    case "text":
      return (
        <Field {...common}>
          <Input placeholder={f.placeholder} {...register(name)} />
          {help}
        </Field>
      );
    case "link":
      return (
        <Field {...common}>
          <Input list="site-links" placeholder={f.placeholder ?? "/sayfa veya https://..."} {...register(name)} />
          {help}
        </Field>
      );
    case "textarea":
    case "lines":
      return (
        <Field {...common}>
          <Textarea
            rows={f.rows ?? (f.type === "lines" ? 4 : 3)}
            placeholder={f.placeholder ?? (f.type === "lines" ? "Her satıra bir öğe yazın" : undefined)}
            className="min-h-0"
            {...register(name)}
          />
          {help ?? (f.type === "lines" ? <p className="mt-1 text-xs text-muted">Her satır ayrı bir öğe olarak gösterilir.</p> : null)}
        </Field>
      );
    case "image":
      return (
        <Field {...common}>
          <div className="max-w-md">
            <Controller
              control={control}
              name={name}
              render={({ field }) => <ImagePicker value={field.value as string} onChange={field.onChange} invalid={!!error} />}
            />
          </div>
          {help}
        </Field>
      );
    case "icon":
      return (
        <Field {...common}>
          <Controller
            control={control}
            name={name}
            render={({ field }) => <IconPicker value={field.value as string} onChange={field.onChange} />}
          />
          {help}
        </Field>
      );
    case "group":
      return (
        <fieldset className="rounded-2xl border border-border bg-cream-50/60 p-4 sm:col-span-2">
          <legend className="px-2 font-serif text-base font-bold text-brand-900">{f.label}</legend>
          {help}
          <FieldList fields={f.fields} prefix={name} control={control} register={register} errors={errors} />
        </fieldset>
      );
    case "list":
      return <ListField field={f} name={name} control={control} register={register} errors={errors} />;
  }
}

function ListField({
  field: f,
  name,
  control,
  register,
  errors,
}: { field: Extract<FieldSpec, { type: "list" }>; name: string } & Ctx) {
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const max = f.max ?? 50;
  const error = errors[name];

  return (
    <div className="sm:col-span-2">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-900">{f.label}</p>
          <p className="text-xs text-muted">
            {fields.length} {f.itemLabel.toLocaleLowerCase("tr")}
            {f.max ? ` · en fazla ${f.max}` : ""}
          </p>
          {f.help && <p className="mt-0.5 text-xs text-muted">{f.help}</p>}
        </div>
        <button
          type="button"
          disabled={fields.length >= max}
          onClick={() => append(emptyItem(f.fields))}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-40"
        >
          <Plus className="size-3.5" /> {f.itemLabel} Ekle
        </button>
      </div>
      {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}

      <div className="space-y-3">
        {fields.map((item, i) => {
          const isCollapsed = collapsed[item.id];
          return (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-cream-50/60">
              <div className="flex items-center gap-2 border-b border-border bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [item.id]: !c[item.id] }))}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <ItemTitle
                    control={control}
                    name={f.titleField ? `${name}.${i}.${f.titleField}` : undefined}
                    fallback={`${f.itemLabel} ${i + 1}`}
                  />
                </button>
                <SmallBtn label="Yukarı taşı" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  <ArrowUp className="size-3.5" />
                </SmallBtn>
                <SmallBtn label="Aşağı taşı" onClick={() => move(i, i + 1)} disabled={i === fields.length - 1}>
                  <ArrowDown className="size-3.5" />
                </SmallBtn>
                <SmallBtn
                  label="Sil"
                  danger
                  disabled={f.min != null && fields.length <= f.min}
                  onClick={() => remove(i)}
                >
                  <Trash2 className="size-3.5" />
                </SmallBtn>
              </div>
              {!isCollapsed && (
                <div className="p-4">
                  <FieldList fields={f.fields} prefix={`${name}.${i}`} control={control} register={register} errors={errors} />
                </div>
              )}
            </div>
          );
        })}
        {fields.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted">
            {"Henüz öğe yok. “" + f.itemLabel + " Ekle” ile başlayın."}
          </p>
        )}
      </div>
    </div>
  );
}

function ItemTitle({ control, name, fallback }: { control: Control<FieldValues>; name?: string; fallback: string }) {
  const value = useWatch({ control, name: name ?? "__none__", disabled: !name });
  return (
    <span className="truncate text-sm font-semibold text-brand-900">
      {typeof value === "string" && value.trim() ? value : fallback}
    </span>
  );
}

function SmallBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg border border-border transition hover:bg-cream-100 disabled:opacity-30",
        danger ? "text-red-600 hover:bg-red-50" : "text-brand-700",
      )}
    >
      {children}
    </button>
  );
}
