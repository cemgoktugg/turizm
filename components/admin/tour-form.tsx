"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Bus,
  CalendarClock,
  ExternalLink,
  Hotel,
  ListPlus,
  Loader2,
  Plane,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { adminTourSchema, CURRENCIES, HOTEL_CARD_CITIES, LEG_TYPES, type AdminTourInput } from "@/lib/validations";
import { createTour, updateTour } from "@/app/actions/tours";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { FormSection, CheckboxRow } from "./form-parts";
import { GalleryPicker, ImagePicker } from "./image-picker";
import { useUnsavedChanges } from "./use-unsaved-changes";

type Category = { id: string; name: string };
type HotelOption = { id: string; name: string; city: string; distance: string | null; stars: number | null; image: string | null };
type FormIn = z.input<typeof adminTourSchema>;

type Props = {
  categories: Category[];
  hotels: HotelOption[];
  tourId?: string;
  slug?: string;
  defaultValues?: Partial<FormIn>;
};

const CURRENCY_LABELS: Record<(typeof CURRENCIES)[number], string> = {
  USD: "USD ($)",
  EUR: "EUR (€)",
  TRY: "TRY (₺)",
  SAR: "SAR (Riyal)",
};

/** Sık kullanılan havalimanı / şehir kodları (kod yazılınca şehir otomatik dolar) */
const PLACES: [string, string][] = [
  ["IST", "İstanbul"],
  ["SAW", "İstanbul Sabiha Gökçen"],
  ["ESB", "Ankara"],
  ["ADB", "İzmir"],
  ["AYT", "Antalya"],
  ["TZX", "Trabzon"],
  ["GZT", "Gaziantep"],
  ["KYA", "Konya"],
  ["ASR", "Kayseri"],
  ["DIY", "Diyarbakır"],
  ["ERZ", "Erzurum"],
  ["SZF", "Samsun"],
  ["JED", "Cidde"],
  ["MED", "Medine"],
  ["MEK", "Mekke"],
  ["TIF", "Taif"],
  ["YNB", "Yanbu"],
  ["RUH", "Riyad"],
  ["TLV", "Tel Aviv"],
  ["SJJ", "Saraybosna"],
];

/** Sağdaki "Oda Ücretleri" listesinin standart satırları */
const ROOM_PRESETS = [
  "2 kişilik odada",
  "3 kişilik odada",
  "4 kişilik odada",
  "Tek kişilik oda",
  "0-2 yaş bebek",
  "2-6 yaş çocuk",
  "6-11 yaş çocuk",
];

/** Form bölümleri — sitedeki tur detay sayfasıyla aynı sırada */
const SECTIONS = [
  ["baslik", "Başlık"],
  ["tarih", "Tarih ve Kontenjan"],
  ["galeri", "Galeri"],
  ["oteller", "Oteller"],
  ["ucuslar", "Uçuş ve Transfer"],
  ["fiyat", "Fiyatlar"],
  ["genel-bakis", "Genel Bakış"],
  ["hizmetler", "Hizmetler"],
  ["program", "Günlük Program"],
  ["sss", "SSS"],
  ["seo", "SEO ve Yayın"],
] as const;

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2) || d2 < d1) return null;
  return Math.round((d2 - d1) / 86_400_000);
}

const emptyLeg = (type: "flight" | "bus", title = "", extra: Partial<NonNullable<FormIn["legs"]>[number]> = {}) => ({
  type,
  title,
  carrier: "",
  flightNo: "",
  fromCode: "",
  fromCity: "",
  toCode: "",
  toCity: "",
  date: "",
  time: "",
  ...extra,
});

const emptyHotel = (city = "") => ({
  city,
  name: "",
  nights: "",
  stars: "",
  distance: "",
  image: "",
  videoUrl: "",
  link: "",
});

export function TourForm({ categories, hotels, tourId, slug, defaultValues }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormIn, unknown, AdminTourInput>({
    resolver: zodResolver(adminTourSchema),
    defaultValues: {
      currency: "USD",
      isPublished: true,
      isFeatured: false,
      images: [],
      prices: [],
      hotels: [],
      legs: [],
      dayPrograms: [],
      faqs: [],
      ...defaultValues,
    },
  });
  useUnsavedChanges(isDirty);

  const prices = useFieldArray({ control, name: "prices" });
  const hotelRows = useFieldArray({ control, name: "hotels" });
  const legs = useFieldArray({ control, name: "legs" });
  const days = useFieldArray({ control, name: "dayPrograms" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const [departure, ret, airline, legValues] = useWatch({ control, name: ["departureDate", "returnDate", "airline", "legs"] });
  const nights = daysBetween(departure, ret);

  const dirtyOpt = { shouldDirty: true } as const;

  function fillFromHotel(i: number, hotelId: string) {
    const h = hotels.find((x) => x.id === hotelId);
    if (!h) return;
    setValue(`hotels.${i}.city`, h.city, dirtyOpt);
    setValue(`hotels.${i}.name`, h.name, dirtyOpt);
    if (h.stars != null) setValue(`hotels.${i}.stars`, String(h.stars), dirtyOpt);
    if (h.distance) setValue(`hotels.${i}.distance`, h.distance, dirtyOpt);
    if (h.image && !getValues(`hotels.${i}.image`)) setValue(`hotels.${i}.image`, h.image, dirtyOpt);
  }

  function fillPlace(i: number, side: "from" | "to", code: string) {
    const place = PLACES.find(([c]) => c === code.trim().toLocaleUpperCase("tr"));
    if (place && !getValues(`legs.${i}.${side}City`)) setValue(`legs.${i}.${side}City`, place[1], dirtyOpt);
  }

  function addStandardLegs() {
    legs.append([
      emptyLeg("flight", "Gidiş", { fromCode: "IST", fromCity: "İstanbul", toCode: "MED", toCity: "Medine", date: departure ?? "" }),
      emptyLeg("bus", "Otobüs Transfer", { carrier: "Lüks otobüs", fromCode: "MED", fromCity: "Medine", toCode: "MEK", toCity: "Mekke" }),
      emptyLeg("flight", "Dönüş", { fromCode: "JED", fromCity: "Cidde", toCode: "IST", toCity: "İstanbul", date: ret ?? "" }),
    ]);
  }

  function addRoomPresets() {
    const existing = new Set((getValues("prices") ?? []).map((p) => p.roomType.trim().toLocaleLowerCase("tr")));
    const missing = ROOM_PRESETS.filter((r) => !existing.has(r.toLocaleLowerCase("tr")));
    if (!missing.length) return toast.info("Standart satırların hepsi zaten ekli.");
    prices.append(missing.map((roomType) => ({ roomType, price: "" })));
  }

  async function onSubmit(values: AdminTourInput) {
    const res = tourId ? await updateTour(tourId, values) : await createTour(values);
    if (res.ok) {
      toast.success(res.message);
      reset(values as unknown as FormIn);
      router.push("/admin/tours");
      router.refresh();
    } else {
      for (const [path, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(path as Parameters<typeof setError>[0], { message });
      }
      toast.error(res.message);
    }
  }

  function onInvalid() {
    toast.error("Formda eksik veya hatalı alanlar var. Kırmızı ile işaretli alanları kontrol edin.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6" noValidate>
      <datalist id="hotel-cities">
        {HOTEL_CARD_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="place-codes">
        {PLACES.map(([code, city]) => (
          <option key={code} value={code}>
            {city}
          </option>
        ))}
      </datalist>
      <datalist id="leg-titles">
        {["Gidiş", "Dönüş", "Otobüs Transfer", "İç Hat Uçuşu", "Aktarma"].map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {/* Bölüm menüsü */}
      <nav className="sticky top-16 z-20 -mx-4 border-b border-border bg-cream-100/95 px-4 py-2.5 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <span className="mr-1 hidden shrink-0 text-xs font-semibold text-muted xl:inline">Sayfadaki sırayla:</span>
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* 1. Başlık ve bilgi satırı */}
      <FormSection
        id="baslik"
        title="Başlık ve Üst Bilgiler"
        description="Sayfanın en üstünde görünür: küçük etiket, tur başlığı ve altındaki 'Tur No · Tarih · Süre · Havayolu' satırı."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tur Başlığı" required error={errors.title?.message} className="sm:col-span-2">
            <Input placeholder="Örn. Umre Turları Ekonomik Mekke Maysan Al Makam Hotel" {...register("title")} />
          </Field>
          <Field label="Üst Etiket (isteğe bağlı)" error={errors.badge?.message}>
            <Input placeholder="Örn. Miraç Kandili Medine · Kampanya" {...register("badge")} />
          </Field>
          <Field label="Tur No (boş bırakılırsa otomatik)" error={errors.code?.message}>
            <Input placeholder="Örn. 11543" {...register("code")} />
          </Field>
          <Field label="Kategori" required error={errors.categoryId?.message}>
            <Select {...register("categoryId")}>
              <option value="">Kategori seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Slug (boş bırakılırsa otomatik)" error={errors.slug?.message}>
            <Input placeholder="13-gunluk-ekonomik-umre" {...register("slug")} />
          </Field>
          <Field label="Kısa Açıklama (başlık altında ve kartlarda görünür)" error={errors.shortDescription?.message} className="sm:col-span-2">
            <Textarea rows={2} className="min-h-0" placeholder="Kartlarda görünecek kısa özet" {...register("shortDescription")} />
          </Field>
        </div>
      </FormSection>

      {/* 2. Tarih, süre, kontenjan */}
      <FormSection
        id="tarih"
        title="Tarih, Süre ve Kontenjan"
        description="Gidiş tarihi geçen turlar sitedeki listelerden otomatik olarak kalkar. Kalan koltuk girilirse 'Son X koltuk' uyarısı çıkar."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Gidiş Tarihi" error={errors.departureDate?.message}>
            <Input type="date" {...register("departureDate")} />
          </Field>
          <Field label="Dönüş Tarihi" error={errors.returnDate?.message}>
            <Input type="date" min={departure || undefined} {...register("returnDate")} />
          </Field>
          <Field label="Gün" error={errors.durationDays?.message}>
            <Input type="number" min={1} {...register("durationDays")} />
          </Field>
          <Field label="Gece" error={errors.durationNights?.message}>
            <Input type="number" min={0} {...register("durationNights")} />
          </Field>
          <Field label="Kalkış Şehri" error={errors.departureCity?.message}>
            <Input placeholder="İstanbul" {...register("departureCity")} />
          </Field>
          <Field label="Havayolu" error={errors.airline?.message}>
            <Input placeholder="Türk Hava Yolları" {...register("airline")} />
          </Field>
          <Field label="Kalan Koltuk (isteğe bağlı)" error={errors.seatsLeft?.message}>
            <Input type="number" min={0} placeholder="Örn. 4" {...register("seatsLeft")} />
          </Field>
        </div>
        {nights !== null && (
          <button
            type="button"
            onClick={() => {
              setValue("durationDays", String(nights + 1), dirtyOpt);
              setValue("durationNights", String(nights), dirtyOpt);
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-gold-600"
          >
            <CalendarClock className="size-4" /> Tarihlere göre doldur: {nights + 1} gün / {nights} gece
          </button>
        )}
      </FormSection>

      {/* 3. Galeri ve video */}
      <FormSection
        id="galeri"
        title="Galeri ve Video"
        description="Kapak görseli büyük kutuda, galerinin ilk iki görseli sağda, kalanlar alt sırada görünür. Video eklenirse galeride 'Videoyu İzle' kutusu çıkar."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-4">
            <Field label="Kapak Görseli (büyük görsel)" error={errors.coverImage?.message}>
              <Controller
                control={control}
                name="coverImage"
                render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} invalid={!!errors.coverImage} />}
              />
            </Field>
            <Field label="Tanıtım Videosu (YouTube bağlantısı)" error={errors.videoUrl?.message}>
              <Input placeholder="https://www.youtube.com/watch?v=..." {...register("videoUrl")} />
            </Field>
          </div>
          <Field label="Galeri" error={errors.images?.message ?? errors.images?.root?.message}>
            <Controller
              control={control}
              name="images"
              render={({ field }) => <GalleryPicker value={field.value ?? []} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </FormSection>

      {/* 4. Otel kartları */}
      <FormSection
        id="oteller"
        title="Otel Kartları"
        description="Galerinin altındaki otel kartları. İlk kartın mesafesi başlık altındaki bilgi satırında da gösterilir. 'Kayıtlı otellerden seç' ile Oteller bölümündeki bilgiler otomatik dolar."
        action={
          <div className="flex flex-wrap gap-2">
            <AddButton onClick={() => hotelRows.append(emptyHotel("Mekke"))} label="Mekke Oteli" />
            <AddButton onClick={() => hotelRows.append(emptyHotel("Medine"))} label="Medine Oteli" />
            <AddButton onClick={() => hotelRows.append(emptyHotel())} label="Diğer" />
          </div>
        }
      >
        <div className="space-y-4">
          {hotelRows.fields.map((f, i) => {
            const e = errors.hotels?.[i];
            return (
              <div key={f.id} className="rounded-2xl border border-border bg-cream-50 p-4">
                <RowHeader
                  icon={<Hotel className="size-4" />}
                  title={`Otel kartı ${i + 1}`}
                  onUp={i > 0 ? () => hotelRows.move(i, i - 1) : undefined}
                  onDown={i < hotelRows.fields.length - 1 ? () => hotelRows.move(i, i + 1) : undefined}
                  onRemove={() => hotelRows.remove(i)}
                >
                  {hotels.length > 0 && (
                    <select
                      value=""
                      onChange={(ev) => fillFromHotel(i, ev.target.value)}
                      className="h-8 max-w-[220px] rounded-lg border border-border bg-white px-2 text-xs font-semibold text-brand-800"
                    >
                      <option value="">Kayıtlı otellerden seç…</option>
                      {HOTEL_CARD_CITIES.map((city) => (
                        <optgroup key={city} label={city}>
                          {hotels
                            .filter((h) => h.city === city)
                            .map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </RowHeader>
                <div className="mt-3 grid gap-4 md:grid-cols-[180px_1fr]">
                  <Field label="Otel Görseli" error={e?.image?.message}>
                    <Controller
                      control={control}
                      name={`hotels.${i}.image`}
                      render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} aspect="portrait" />}
                    />
                  </Field>
                  <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Şehir" required error={e?.city?.message}>
                      <Input list="hotel-cities" placeholder="Mekke" {...register(`hotels.${i}.city`)} />
                    </Field>
                    <Field label="Otel Adı" required error={e?.name?.message} className="sm:col-span-1 lg:col-span-3">
                      <Input placeholder="Maysan Al Makam" {...register(`hotels.${i}.name`)} />
                    </Field>
                    <Field label="Konaklama (gece)" error={e?.nights?.message}>
                      <Input type="number" min={0} placeholder="4" {...register(`hotels.${i}.nights`)} />
                    </Field>
                    <Field label="Yıldız" error={e?.stars?.message}>
                      <Select {...register(`hotels.${i}.stars`)}>
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {"★".repeat(n)} ({n})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Mesafe" error={e?.distance?.message} className="lg:col-span-2">
                      <Input placeholder="Mescid-i Haram'a 400 m" {...register(`hotels.${i}.distance`)} />
                    </Field>
                    <Field label="Otel Videosu (YouTube)" error={e?.videoUrl?.message} className="lg:col-span-2">
                      <Input placeholder="https://youtu.be/..." {...register(`hotels.${i}.videoUrl`)} />
                    </Field>
                    <Field label="Detay Bağlantısı (otel sitesi)" error={e?.link?.message} className="lg:col-span-2">
                      <Input placeholder="Boşsa 'Haritada göster' çıkar" {...register(`hotels.${i}.link`)} />
                    </Field>
                  </div>
                </div>
              </div>
            );
          })}
          {hotelRows.fields.length === 0 && <EmptyHint text="Henüz otel kartı eklenmedi. Yukarıdan Mekke / Medine oteli ekleyin." />}
        </div>
      </FormSection>

      {/* 5. Uçuş ve transfer */}
      <FormSection
        id="ucuslar"
        title="Uçuş ve Transfer Bilgileri"
        description="Otel kartlarının altında 'Gidiş → Otobüs Transfer → Dönüş' kartları olarak görünür. Saat boş bırakılırsa 'Belirlenecek' yazar; havayolu boşsa yukarıdaki havayolu kullanılır."
        action={
          <div className="flex flex-wrap gap-2">
            {legs.fields.length === 0 && (
              <AddButton onClick={addStandardLegs} label="Standart şablon" icon={<ListPlus className="size-3.5" />} />
            )}
            <AddButton onClick={() => legs.append(emptyLeg("flight"))} label="Uçuş" icon={<Plane className="size-3.5" />} />
            <AddButton onClick={() => legs.append(emptyLeg("bus", "Otobüs Transfer"))} label="Transfer" icon={<Bus className="size-3.5" />} />
          </div>
        }
      >
        <div className="space-y-4">
          {legs.fields.map((f, i) => {
            const e = errors.legs?.[i];
            return (
              <div key={f.id} className="rounded-2xl border border-border bg-cream-50 p-4">
                <RowHeader
                  icon={(legValues?.[i]?.type ?? f.type) === "bus" ? <Bus className="size-4" /> : <Plane className="size-4" />}
                  title={`${i + 1}. bacak`}
                  onUp={i > 0 ? () => legs.move(i, i - 1) : undefined}
                  onDown={i < legs.fields.length - 1 ? () => legs.move(i, i + 1) : undefined}
                  onRemove={() => legs.remove(i)}
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Tür" error={e?.type?.message}>
                    <Select {...register(`legs.${i}.type`)}>
                      {Object.entries(LEG_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Başlık" required error={e?.title?.message}>
                    <Input list="leg-titles" placeholder="Gidiş" {...register(`legs.${i}.title`)} />
                  </Field>
                  <Field label="Havayolu / Firma" error={e?.carrier?.message}>
                    <Input placeholder={airline || "Türk Hava Yolları"} {...register(`legs.${i}.carrier`)} />
                  </Field>
                  <Field label="Sefer No" error={e?.flightNo?.message}>
                    <Input placeholder="TK 108" {...register(`legs.${i}.flightNo`)} />
                  </Field>
                  <Field label="Nereden (kod)" error={e?.fromCode?.message}>
                    <Input
                      list="place-codes"
                      placeholder="IST"
                      className="uppercase"
                      {...register(`legs.${i}.fromCode`, { onChange: (ev) => fillPlace(i, "from", ev.target.value) })}
                    />
                  </Field>
                  <Field label="Nereden (şehir)" error={e?.fromCity?.message}>
                    <Input placeholder="İstanbul" {...register(`legs.${i}.fromCity`)} />
                  </Field>
                  <Field label="Nereye (kod)" error={e?.toCode?.message}>
                    <Input
                      list="place-codes"
                      placeholder="MED"
                      className="uppercase"
                      {...register(`legs.${i}.toCode`, { onChange: (ev) => fillPlace(i, "to", ev.target.value) })}
                    />
                  </Field>
                  <Field label="Nereye (şehir)" error={e?.toCity?.message}>
                    <Input placeholder="Medine" {...register(`legs.${i}.toCity`)} />
                  </Field>
                  <Field label="Tarih" error={e?.date?.message}>
                    <Input type="date" {...register(`legs.${i}.date`)} />
                  </Field>
                  <Field label="Saat" error={e?.time?.message}>
                    <Input placeholder="14:00 (boşsa 'Belirlenecek')" {...register(`legs.${i}.time`)} />
                  </Field>
                </div>
              </div>
            );
          })}
          {legs.fields.length === 0 && (
            <EmptyHint text="Henüz uçuş/transfer eklenmedi. 'Standart şablon' ile Gidiş, Otobüs Transfer ve Dönüş tek tıkla eklenir." />
          )}
        </div>
      </FormSection>

      {/* 6. Fiyatlar */}
      <FormSection
        id="fiyat"
        title="Fiyatlar"
        description="Sağdaki fiyat kutusunda görünür. Başlangıç fiyatı boşsa 'Fiyat için arayınız' yazar; oda ücretleri 'Oda Ücretleri · Kişi başı' listesinde sıralanır."
        action={
          <div className="flex flex-wrap gap-2">
            <AddButton onClick={addRoomPresets} label="Standart satırlar" icon={<ListPlus className="size-3.5" />} />
            <AddButton onClick={() => prices.append({ roomType: "", price: "" })} label="Satır Ekle" />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Başlangıç Fiyatı (büyük fiyat)" error={errors.startingPrice?.message}>
            <Input type="number" min={0} step="0.01" placeholder="Örn. 1900" {...register("startingPrice")} />
          </Field>
          <Field label="Para Birimi" error={errors.currency?.message}>
            <Select {...register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fiyat Notu (fiyatın yanında)" error={errors.priceNote?.message}>
            <Input placeholder="Kişi Başı" {...register("priceNote")} />
          </Field>
        </div>

        <p className="mb-2 mt-6 text-sm font-semibold text-brand-900">Oda Ücretleri</p>
        <div className="space-y-2">
          {prices.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <MoveButtons
                onUp={i > 0 ? () => prices.move(i, i - 1) : undefined}
                onDown={i < prices.fields.length - 1 ? () => prices.move(i, i + 1) : undefined}
              />
              <Field className="flex-1" error={errors.prices?.[i]?.roomType?.message}>
                <Input placeholder="2 kişilik odada" {...register(`prices.${i}.roomType`)} />
              </Field>
              <Field className="w-36" error={errors.prices?.[i]?.price?.message}>
                <Input type="number" min={0} step="0.01" placeholder="Fiyat" {...register(`prices.${i}.price`)} />
              </Field>
              <RemoveButton onClick={() => prices.remove(i)} />
            </div>
          ))}
          {prices.fields.length === 0 && (
            <EmptyHint text="Henüz oda ücreti eklenmedi. 'Standart satırlar' ile 2'li, 3'lü, 4'lü oda, tek kişilik ve çocuk satırları eklenir." />
          )}
        </div>
      </FormSection>

      {/* 7. Genel bakış */}
      <FormSection
        id="genel-bakis"
        title="Genel Bakış"
        description="Sayfadaki 'Genel Bakış' bölümü. Uzun metinler 'Devamını oku' ile kısaltılır. Başlık için satır başına '## ', madde için '- ', kalın için **metin** yazabilirsiniz."
      >
        <Field error={errors.description?.message}>
          <Textarea rows={10} placeholder={"## Program Hakkında\nProgramı anlatan paragraf...\n\n- Harem'e yürüme mesafesi\n- Tabldot kahvaltı ve akşam yemeği"} {...register("description")} />
        </Field>
      </FormSection>

      {/* 8. Hizmetler */}
      <FormSection id="hizmetler" title="Dahil / Hariç Hizmetler ve Evraklar" description="Her satıra bir madde yazın. Sayfada ✓ ve ✗ işaretli iki sütun olarak görünür.">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Fiyata Dahil" error={errors.includedServices?.message}>
            <Textarea rows={8} {...register("includedServices")} />
          </Field>
          <Field label="Fiyata Dahil Değil" error={errors.excludedServices?.message}>
            <Textarea rows={8} {...register("excludedServices")} />
          </Field>
          <Field label="Gerekli Evraklar" error={errors.requiredDocuments?.message}>
            <Textarea rows={8} {...register("requiredDocuments")} />
          </Field>
        </div>
      </FormSection>

      {/* 9. Günlük program */}
      <FormSection
        id="program"
        title="Günlük Program"
        description="Sayfada numaralı, açılır-kapanır gün kartları olarak görünür. Tarih, turun gidiş tarihinden otomatik hesaplanır (1. gün = gidiş günü)."
        action={
          <AddButton
            onClick={() =>
              days.append({ dayNumber: String(days.fields.length + 1), title: "", description: "", time: "", place: "" })
            }
            label="Gün Ekle"
          />
        }
      >
        <div className="space-y-3">
          {days.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-border bg-cream-50 p-3">
              <div className="flex items-start gap-3">
                <Field label="Gün" className="w-20" error={errors.dayPrograms?.[i]?.dayNumber?.message}>
                  <Input type="number" min={1} {...register(`dayPrograms.${i}.dayNumber`)} />
                </Field>
                <Field label="Başlık" className="flex-1" error={errors.dayPrograms?.[i]?.title?.message}>
                  <Input placeholder="İstanbul'dan Medine'ye hareket" {...register(`dayPrograms.${i}.title`)} />
                </Field>
                <RemoveButton onClick={() => days.remove(i)} offset />
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-[140px_1fr]">
                <Field label="Saat (isteğe bağlı)" error={errors.dayPrograms?.[i]?.time?.message}>
                  <Input placeholder="07:30" inputMode="numeric" maxLength={5} {...register(`dayPrograms.${i}.time`)} />
                </Field>
                <Field label="Buluşma yeri (isteğe bağlı)" error={errors.dayPrograms?.[i]?.place?.message}>
                  <Input placeholder="Otel lobisi" {...register(`dayPrograms.${i}.place`)} />
                </Field>
              </div>
              <Field label="Açıklama (isteğe bağlı)" className="mt-2" error={errors.dayPrograms?.[i]?.description?.message}>
                <Textarea rows={2} className="min-h-0" {...register(`dayPrograms.${i}.description`)} />
              </Field>
            </div>
          ))}
          {days.fields.length === 0 && <EmptyHint text="Henüz program günü eklenmedi." />}
        </div>
      </FormSection>

      {/* 10. SSS */}
      <FormSection
        id="sss"
        title="Sık Sorulan Sorular"
        description="Tur detayında ve Google arama sonuçlarında (SSS zengin sonuç) gösterilir."
        action={<AddButton onClick={() => faqs.append({ question: "", answer: "" })} label="Soru Ekle" />}
      >
        <div className="space-y-3">
          {faqs.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-border bg-cream-50 p-3">
              <div className="flex items-start gap-3">
                <Field label="Soru" className="flex-1" error={errors.faqs?.[i]?.question?.message}>
                  <Input {...register(`faqs.${i}.question`)} />
                </Field>
                <RemoveButton onClick={() => faqs.remove(i)} offset />
              </div>
              <Field label="Cevap" className="mt-2" error={errors.faqs?.[i]?.answer?.message}>
                <Textarea rows={2} className="min-h-0" {...register(`faqs.${i}.answer`)} />
              </Field>
            </div>
          ))}
          {faqs.fields.length === 0 && <EmptyHint text="Henüz soru eklenmedi." />}
        </div>
      </FormSection>

      {/* 11. SEO ve yayın */}
      <FormSection id="seo" title="SEO ve Yayın Durumu" description="SEO alanları boş bırakılırsa tur başlığı ve kısa açıklama kullanılır.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO Başlık" error={errors.seoTitle?.message}>
            <Input {...register("seoTitle")} />
          </Field>
          <Field label="SEO Açıklama" error={errors.seoDescription?.message}>
            <Input {...register("seoDescription")} />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-6 border-t border-border pt-5">
          <CheckboxRow label="Yayında (sitede görünür)" {...register("isPublished")} />
          <CheckboxRow label="Öne Çıkan (ana sayfada gösterilir)" {...register("isFeatured")} />
        </div>
      </FormSection>

      {/* Kaydet */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div>
          {tourId && slug && (
            <a
              href={`/turlar/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600"
            >
              <ExternalLink className="size-4" /> Sitede Gör
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDirty && <span className="hidden text-xs font-semibold text-amber-700 sm:inline">Kaydedilmemiş değişiklikler var</span>}
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/tours")}>
            İptal
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            {tourId ? "Değişiklikleri Kaydet" : "Turu Oluştur"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function AddButton({ onClick, label, icon }: { onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
    >
      {icon ?? <Plus className="size-3.5" />} {label}
    </button>
  );
}

function RemoveButton({ onClick, offset }: { onClick: () => void; offset?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${offset ? "mt-7" : ""} grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-white text-red-600 hover:bg-red-50`}
      aria-label="Kaldır"
      title="Kaldır"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function MoveButtons({ onUp, onDown }: { onUp?: () => void; onDown?: () => void }) {
  const cls = "grid h-5 w-7 place-items-center rounded-md text-brand-700 hover:bg-brand-50 disabled:opacity-25";
  return (
    <span className="flex shrink-0 flex-col justify-center pt-0.5">
      <button type="button" onClick={onUp} disabled={!onUp} className={cls} aria-label="Yukarı taşı" title="Yukarı taşı">
        <ArrowUp className="size-3.5" />
      </button>
      <button type="button" onClick={onDown} disabled={!onDown} className={cls} aria-label="Aşağı taşı" title="Aşağı taşı">
        <ArrowDown className="size-3.5" />
      </button>
    </span>
  );
}

/** Tekrarlanan kart başlığı: ikon, başlık, sıralama ve silme */
function RowHeader({
  icon,
  title,
  onUp,
  onDown,
  onRemove,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="grid size-7 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">{icon}</span>
      <span className="text-sm font-bold text-brand-900">{title}</span>
      <span className="ml-auto flex items-center gap-1.5">
        {children}
        <button
          type="button"
          onClick={onUp}
          disabled={!onUp}
          className={cn(iconBtn, "disabled:opacity-30")}
          aria-label="Yukarı taşı"
          title="Yukarı taşı"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={!onDown}
          className={cn(iconBtn, "disabled:opacity-30")}
          aria-label="Aşağı taşı"
          title="Aşağı taşı"
        >
          <ArrowDown className="size-4" />
        </button>
        <button type="button" onClick={onRemove} className={cn(iconBtn, "text-red-600 hover:bg-red-50")} aria-label="Kaldır" title="Kaldır">
          <Trash2 className="size-4" />
        </button>
      </span>
    </div>
  );
}

const iconBtn = "grid size-8 place-items-center rounded-lg border border-border bg-white text-brand-700 hover:bg-brand-50";

function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted">{text}</p>;
}
