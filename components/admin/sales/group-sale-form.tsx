"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { createGroupSale, type CustomerOption } from "@/app/actions/sales";
import { PAYMENT_METHODS } from "@/lib/validations";
import { splitProportional } from "@/lib/split";
import { Input, Textarea, Select, Field } from "@/components/ui/form-controls";
import { currencySymbol, formatPrice } from "@/lib/utils";
import { FormSection } from "../form-parts";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { FormFooter } from "./form-footer";
import { CustomerPicker } from "./customer-picker";
import type { SaleTourOption } from "./sale-form";
import { useSalesBase } from "./use-sales-base";
import { withParam } from "./ui";
import { toastWithReceipt } from "./receipt-toolbar";
import { DiscountHint } from "./discount-hint";
import { DISCOUNT_WARN_RATE, discountOf, listPriceOf } from "@/lib/sale-pricing";

type Member = { key: number; customer: CustomerOption | null; price: string; priceEdited: boolean };

let nextKey = 1;
const emptyMember = (price = ""): Member => ({ key: nextKey++, customer: null, price, priceEdited: false });

/**
 * Aile / grup satışı: tur, tarih ve oda tipi bir kez seçilir; kişiler arka
 * arkaya eklenir. Her kişi ayrı satış olur ve hepsi aynı grupta toplanır.
 * Peşinat toplam girilir, kişilere ücretlerine göre dağıtılır.
 */
export function GroupSaleForm({
  tours,
  references,
  people,
  today,
  person,
  group,
  listHref,
}: {
  tours: SaleTourOption[];
  references: string[];
  people: string[];
  today: string;
  /** Peşinatı alan için varsayılan: giriş yapan kullanıcı */
  person: string;
  /** Var olan gruba kişi ekleniyorsa */
  group?: { id: number; name: string } | null;
  listHref?: string;
}) {
  const router = useRouter();
  const base = useSalesBase();
  const [groupName, setGroupName] = useState("");
  const [tourId, setTourId] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [members, setMembers] = useState<Member[]>(() => [emptyMember(), emptyMember()]);
  const [down, setDown] = useState({ amount: "", method: "Nakit", by: person });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);

  const tour = tours.find((t) => String(t.id) === tourId);
  const cur = tour ? currencySymbol(tour.currency).trim() : "";
  const fmt = (v: number) => (tour ? formatPrice(v, tour.currency, "0") : String(v));
  const roomSizes = tour ? Object.keys(tour.prices).map(Number).sort((a, b) => a - b) : [2, 3, 4];
  const priceFor = (t: SaleTourOption | undefined, size: number) => (t ? String(t.prices[size] ?? Object.values(t.prices)[0] ?? "") : "");
  const periods = tours.reduce<Record<string, SaleTourOption[]>>((acc, t) => {
    (acc[t.period] ??= []).push(t);
    return acc;
  }, {});

  /** Tur / oda değişince fiyatı elle değiştirilmemiş kişilere yeni fiyat önerilir */
  function repriceMembers(t: SaleTourOption | undefined, size: number) {
    setMembers((ms) => ms.map((m) => (m.priceEdited ? m : { ...m, price: priceFor(t, size) })));
  }
  const update = (key: number, patch: Partial<Member>) => {
    setDirty(true);
    setMembers((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  };

  const filled = members.filter((m) => m.customer);
  const prices = filled.map((m) => Number(m.price) || 0);
  const totalPrice = prices.reduce((a, b) => a + b, 0);
  const downNum = Number(down.amount) || 0;
  const downParts = downNum ? splitProportional(downNum, prices) : [];
  // Liste fiyatı sunucudakiyle aynı kuralla: seçili oda tipinin kişi başı ücreti
  const listPrice = tour ? listPriceOf(tour.prices, Number(roomSize) || null) : null;
  const memberDiscounts = filled.map((m) => (m.price === "" ? null : discountOf(listPrice, Number(m.price))));
  const totalDiscount = memberDiscounts.reduce((t, d) => t + (d?.amount ?? 0), 0);
  const warnCount = memberDiscounts.filter((d) => d?.warn).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!group && groupName.trim().length < 2) errs.groupName = "Grup adı gerekli (ör. Yılmaz Ailesi)";
    if (!tourId) errs.tourId = "Tur seçiniz";
    if (filled.length === 0) errs.members = "En az bir kişi ekleyin";
    if (members.some((m) => m.customer && m.price === "")) errs.members = "Her kişinin ücretini girin";
    const ids = filled.map((m) => m.customer!.id);
    if (new Set(ids).size !== ids.length) errs.members = "Aynı kişi iki kez eklenmiş";
    if (downNum > totalPrice) errs.downPayment = "Toplam ücretten fazla olamaz";
    setErrors(errs);
    if (Object.keys(errs).length) return void toast.error(Object.values(errs)[0]);

    setSubmitting(true);
    const res = await createGroupSale({
      groupId: group?.id,
      groupName: group ? undefined : groupName,
      date,
      tourId,
      roomSize,
      reference,
      note,
      members: filled.map((m) => ({ customerId: m.customer!.id, price: m.price })),
      downPayment: down.amount,
      downPaymentMethod: down.method,
      downPaymentBy: down.by,
    });
    setSubmitting(false);
    if (!res.ok || !res.data) {
      setErrors(res.fieldErrors ?? {});
      return void toast.error(res.message);
    }
    toastWithReceipt(res.message, res.data.paymentId, (href) => router.push(href));
    if (warnCount) toast.warning(`Dikkat: ${warnCount} kişide liste fiyatından %${DISCOUNT_WARN_RATE * 100} üzeri indirim var.`);
    setDirty(false);
    const gid = res.data.groupId;
    if (listHref) router.push(withParam(listHref, "panel", `g${gid}`), { scroll: false });
    else router.push(`${base}/gruplar/${gid}`);
  }

  return (
    <form onSubmit={onSubmit} onInput={() => setDirty(true)} className="@container space-y-6" noValidate>
      <FormSection title={group ? `${group.name} grubuna kişi ekle` : "Aile / Grup"} description="Her kişi ayrı satış olarak kaydedilir; iptal ve borç kişi bazında tutulur.">
        <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-4">
          {!group && (
            <Field label="Grup adı" required error={errors.groupName} className="@lg:col-span-2">
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ör. Yılmaz Ailesi" />
            </Field>
          )}
          <Field label="Tur" required error={errors.tourId} className="@lg:col-span-2">
            <Select
              value={tourId}
              onChange={(e) => {
                const t = tours.find((x) => String(x.id) === e.target.value);
                let size = Number(roomSize);
                if (t && size && t.prices[size] == null) {
                  size = 0;
                  setRoomSize("");
                }
                setTourId(e.target.value);
                repriceMembers(t, size);
              }}
            >
              <option value="">Tur seçiniz</option>
              {Object.entries(periods).map(([period, list]) => (
                <optgroup key={period} label={period}>
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} {t.name} · {t.departure}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Satış Tarihi" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Oda Kişi Sayısı">
            <Select
              value={roomSize}
              onChange={(e) => {
                setRoomSize(e.target.value);
                repriceMembers(tour, Number(e.target.value));
              }}
            >
              <option value="">—</option>
              {roomSizes.map((n) => (
                <option key={n} value={n}>
                  {n} kişilik oda{tour?.prices[n] != null ? ` · ${formatPrice(tour.prices[n], tour.currency)}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Referans">
            <Input list="grup-referanslar" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Kim yönlendirdi?" autoComplete="off" />
            <datalist id="grup-referanslar">
              {references.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
          <Field label="Açıklama" className="@lg:col-span-2 @3xl:col-span-3">
            <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tüm kişilerin satışına yazılır" />
          </Field>
        </div>
      </FormSection>

      <FormSection title={`Kişiler${filled.length ? ` (${filled.length})` : ""}`} description="Müşteriyi arayın veya yeni müşteri ekleyin. Ücret, seçili oda tipine göre önerilir.">
        <div className="space-y-3">
          {members.map((m, i) => (
            <div key={m.key} className="grid items-start gap-3 rounded-xl border border-border bg-cream-50/50 p-3 @lg:grid-cols-[1fr_9rem_auto]">
              <CustomerPicker value={m.customer} onChange={(c) => update(m.key, { customer: c })} invalid={!!errors.members && !m.customer && i === 0} />
              <Input
                type="number"
                min={0}
                step={1}
                value={m.price}
                onChange={(e) => update(m.key, { price: e.target.value, priceEdited: true })}
                placeholder={`Ücret${cur ? ` (${cur})` : ""}`}
                aria-label={`${i + 1}. kişinin ücreti`}
                className="h-11 text-right tabular-nums"
              />
              <button
                type="button"
                onClick={() => {
                  setDirty(true);
                  setMembers((ms) => (ms.length > 1 ? ms.filter((x) => x.key !== m.key) : ms));
                }}
                disabled={members.length === 1}
                className="grid size-11 place-items-center rounded-xl border border-border text-red-600 hover:bg-red-50 disabled:opacity-40"
                aria-label="Kişiyi çıkar"
                title="Kişiyi çıkar"
              >
                <Trash2 className="size-4" />
              </button>
              {tour && m.price !== "" && (
                <DiscountHint listPrice={listPrice} price={Number(m.price)} currency={tour.currency} className="-mt-2 @lg:col-span-3 @lg:text-right @lg:pr-14" />
              )}
            </div>
          ))}
          {errors.members && <p className="text-sm font-semibold text-red-600">{errors.members}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMembers((ms) => [...ms, emptyMember(priceFor(tour, Number(roomSize)))])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <UserPlus className="size-4" /> Kişi ekle
            </button>
            <p className="text-sm text-muted">
              Toplam ücret: <span className="font-bold text-brand-900 tabular-nums">{fmt(totalPrice)}</span>
              {totalDiscount > 0 && (
                <>
                  {" · "}Toplam indirim: <span className="font-semibold tabular-nums">{fmt(totalDiscount)}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Peşinat" description="İsteğe bağlı. Toplam girilir; kişilere ücretlerine göre dağıtılır.">
        <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-4">
          <Field label={`Toplam peşinat${cur ? ` (${cur})` : ""}`} error={errors.downPayment}>
            <Input type="number" min={0} step={1} value={down.amount} onChange={(e) => setDown((d) => ({ ...d, amount: e.target.value }))} />
          </Field>
          <Field label="Ödeme Şekli">
            <Select value={down.method} onChange={(e) => setDown((d) => ({ ...d, method: e.target.value }))}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Parayı Alan" error={errors.downPaymentBy}>
            <Select value={down.by} onChange={(e) => setDown((d) => ({ ...d, by: e.target.value }))}>
              {people.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
        </div>
        {downNum > 0 && filled.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Dağılım: {filled.map((m, i) => `${m.customer!.fullName} ${fmt(downParts[i] ?? 0)}`).join(" · ")}
          </p>
        )}
      </FormSection>

      <FormFooter
        cancelHref={listHref ?? base}
        keepScroll={!!listHref}
        submitting={submitting}
        label={filled.length > 1 ? `${filled.length} Kişiyi Kaydet` : "Satışı Kaydet"}
      />
    </form>
  );
}
