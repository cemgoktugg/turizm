"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, Images, Loader2, Save, Trash2, Upload } from "lucide-react";
import { storySchema, type StoryInput } from "@/lib/validations";
import { createStory, updateStory } from "@/app/actions/stories";
import { isVideoUrl } from "@/lib/media-types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { MediaThumb } from "@/components/ui/media-thumb";
import { StoryViewer, type StoryLabels } from "@/components/site/stories/story-viewer";
import { cn } from "@/lib/utils";
import { STORY_RING } from "@/lib/brand";
import { CheckboxRow, FormSection } from "./form-parts";
import { ImagePicker, MediaLibraryDialog, useDropZone, useUploader } from "./image-picker";
import { ACCEPT_MEDIA } from "./upload";
import { useUnsavedChanges } from "./use-unsaved-changes";

type FormIn = z.input<typeof storySchema>;

const LINK_SUGGESTIONS = ["/turlar", "/umre", "/umre/luks-umre", "/umre/ramazan-umresi", "/hac", "/rezervasyon", "/iletisim"];

export function StoryForm({
  storyId,
  defaultValues,
  labels,
}: {
  storyId?: string;
  defaultValues?: Partial<FormIn>;
  labels: StoryLabels;
}) {
  const router = useRouter();
  const [libOpen, setLibOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, StoryInput>({
    resolver: zodResolver(storySchema),
    defaultValues: { title: "", cover: "", buttonLabel: "", buttonUrl: "", isPublished: true, items: [], ...defaultValues },
  });
  useUnsavedChanges(isDirty);

  const items = useFieldArray({ control, name: "items" });
  const values = useWatch({ control });
  const watchedItems = values.items ?? [];

  const addUrls = (urls: string[]) => items.append(urls.map((url) => ({ url, caption: "", duration: "" })));
  const { uploading, upload } = useUploader(addUrls, "media");
  const drop = useDropZone((files) => void upload(files));

  const firstUrl = watchedItems.find((it) => it?.url)?.url ?? "";
  const thumb = values.cover || watchedItems.find((it) => it?.url && !isVideoUrl(it.url))?.url || firstUrl;
  const previewItems = watchedItems
    .filter((it): it is NonNullable<typeof it> & { url: string } => Boolean(it?.url))
    .map((it, i) => ({
      id: `p${i}`,
      url: it.url,
      caption: it.caption || null,
      duration: Number(it.duration) || null,
      isVideo: isVideoUrl(it.url),
    }));

  async function onSubmit(data: StoryInput) {
    const res = storyId ? await updateStory(storyId, data) : await createStory(data);
    if (res.ok) {
      toast.success(res.message);
      reset(data as unknown as FormIn);
      router.push("/admin/stories");
    } else {
      for (const [path, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(path as Parameters<typeof setError>[0], { message });
      }
      toast.error(res.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Formda eksik veya hatalı alanlar var."))}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
      noValidate
    >
      <div className="space-y-6">
        <FormSection title="Yuvarlak ve Başlık" description="Slider'ın altındaki yuvarlakta görünen kapak ve kısa başlık.">
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            <Field label="Kapak görseli" error={errors.cover?.message}>
              <Controller
                control={control}
                name="cover"
                render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} aspect="square" />}
              />
              <p className="mt-1 text-xs text-muted">Boş bırakılırsa ilk içerik kullanılır.</p>
            </Field>
            <div className="space-y-4">
              <Field label="Başlık (yuvarlağın altında)" required error={errors.title?.message}>
                <Input maxLength={30} placeholder="Örn. Mekke, Otellerimiz, Kampanya" {...register("title")} />
                <p className="mt-1 text-right text-[11px] text-muted">{(values.title ?? "").length}/30</p>
              </Field>
              <CheckboxRow label="Yayında (ana sayfada görünür)" {...register("isPublished")} />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="İçerikler"
          description="Videolar ve fotoğraflar bu sırayla oynar. Dikey (9:16), 15-30 saniyelik MP4 videolar en iyi sonucu verir; en fazla 50 MB."
          action={
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Video / Fotoğraf Yükle
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setLibOpen(true)}>
                <Images className="size-4" /> Kütüphaneden
              </Button>
            </div>
          }
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_MEDIA}
            multiple
            hidden
            onChange={(e) => {
              void upload(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <div {...drop.props} className={cn("space-y-3 rounded-2xl transition", drop.over && "bg-brand-50 ring-2 ring-brand-300")}>
            {items.fields.map((f, i) => {
              const url = watchedItems[i]?.url ?? "";
              const video = isVideoUrl(url);
              const e = errors.items?.[i];
              return (
                <div key={f.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-cream-50 p-4 sm:flex-row">
                  <div className="w-full sm:w-[130px]">
                    <Controller
                      control={control}
                      name={`items.${i}.url`}
                      render={({ field }) => (
                        <ImagePicker value={field.value} onChange={field.onChange} aspect="story" kind="media" invalid={!!e?.url} />
                      )}
                    />
                    {e?.url?.message && <p className="mt-1 text-xs font-medium text-red-600">{e.url.message}</p>}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-800 shadow-sm">
                        {i + 1}. {video ? "Video" : "Fotoğraf"}
                      </span>
                      <span className="ml-auto flex gap-1.5">
                        <IconButton label="Yukarı taşı" disabled={i === 0} onClick={() => items.move(i, i - 1)}>
                          <ArrowUp className="size-4" />
                        </IconButton>
                        <IconButton label="Aşağı taşı" disabled={i === items.fields.length - 1} onClick={() => items.move(i, i + 1)}>
                          <ArrowDown className="size-4" />
                        </IconButton>
                        <IconButton label="Kaldır" danger onClick={() => items.remove(i)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      </span>
                    </div>
                    <Field label="Açıklama (isteğe bağlı, altta yazar)" error={e?.caption?.message}>
                      <Input placeholder="Örn. Otelimizden Harem manzarası" {...register(`items.${i}.caption`)} />
                    </Field>
                    {video ? (
                      <p className="text-xs text-muted">Video kendi süresi boyunca oynar.</p>
                    ) : (
                      <Field label="Ekranda kalma süresi (saniye)" error={e?.duration?.message} className="max-w-[220px]">
                        <Input type="number" min={2} max={30} placeholder="5" {...register(`items.${i}.duration`)} />
                      </Field>
                    )}
                  </div>
                </div>
              );
            })}
            {items.fields.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border px-6 py-10 text-center text-sm text-muted">
                <Upload className="mx-auto mb-2 size-7 text-brand-300" />
                Videoları ve fotoğrafları buraya sürükleyin veya yukarıdaki butonları kullanın.
              </div>
            )}
            {(errors.items?.root?.message || errors.items?.message) && (
              <p className="text-sm font-medium text-red-600">{errors.items?.root?.message ?? errors.items?.message}</p>
            )}
          </div>
        </FormSection>

        <FormSection title="Alt Buton (isteğe bağlı)" description="Hikayenin altında görünen buton; ör. ilgili tura veya WhatsApp'a yönlendirir.">
          <datalist id="story-links">
            {LINK_SUGGESTIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Buton yazısı" error={errors.buttonLabel?.message}>
              <Input placeholder="Örn. Turu İncele" {...register("buttonLabel")} />
            </Field>
            <Field label="Bağlantı" error={errors.buttonUrl?.message}>
              <Input list="story-links" placeholder="/turlar/13-gunluk-ekonomik-umre veya https://wa.me/..." {...register("buttonUrl")} />
            </Field>
          </div>
        </FormSection>
      </div>

      {/* Önizleme */}
      <aside className="xl:sticky xl:top-24 xl:h-fit">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="font-serif text-lg font-bold text-brand-900">Önizleme</p>
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <span className="rounded-full p-[3px]" style={{ background: STORY_RING }}>
              <span className="block rounded-full bg-white p-[3px]">
                <span className="block size-[78px] overflow-hidden rounded-full bg-brand-900">
                  {thumb && <MediaThumb src={thumb} badge={false} className="size-full" />}
                </span>
              </span>
            </span>
            <span className="max-w-[92px] truncate text-xs font-medium text-brand-800">{values.title || "Başlık"}</span>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            {previewItems.filter((p) => p.isVideo).length} video · {previewItems.filter((p) => !p.isVideo).length} fotoğraf
          </p>
          <Button type="button" variant="outline" className="mt-4 w-full" disabled={!previewItems.length} onClick={() => setPreview(true)}>
            <Eye className="size-4" /> Tam ekran önizle
          </Button>
        </div>
      </aside>

      {/* Kaydet */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8 xl:col-span-2">
        {isDirty && <span className="mr-auto hidden text-xs font-semibold text-amber-700 sm:inline">Kaydedilmemiş değişiklikler var</span>}
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/stories")}>
          İptal
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          {storyId ? "Değişiklikleri Kaydet" : "Hikayeyi Oluştur"}
        </Button>
      </div>

      <MediaLibraryDialog open={libOpen} onClose={() => setLibOpen(false)} onSelect={addUrls} multiple kind="media" />
      {preview && previewItems.length > 0 && (
        <StoryViewer
          stories={[
            {
              id: "preview",
              seenKey: "preview",
              title: values.title || "Başlık",
              thumb: thumb || previewItems[0].url,
              buttonLabel: values.buttonLabel || null,
              buttonUrl: values.buttonUrl || null,
              items: previewItems,
            },
          ]}
          start={0}
          onClose={() => setPreview(false)}
          onSeen={noop}
          labels={labels}
        />
      )}
    </form>
  );
}

function noop() {}

function IconButton({
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
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-lg border border-border bg-white text-brand-700 hover:bg-brand-50 disabled:opacity-30",
        danger && "text-red-600 hover:bg-red-50",
      )}
    >
      {children}
    </button>
  );
}
