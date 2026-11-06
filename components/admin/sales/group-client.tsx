"use client";

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, UsersRound, X } from "lucide-react";
import { addGroupPayment, groupSales, listGroups, updateGroup } from "@/app/actions/sales";
import { PAYMENT_METHODS } from "@/lib/validations";
import { splitProportional } from "@/lib/split";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { cn, formatPrice } from "@/lib/utils";
import { withParam } from "./ui";

/* ------------------------------------------------------------------ */
/* Onaylı işlem düğmesi (gruptan çıkar, grubu dağıt…)                   */
/* ------------------------------------------------------------------ */

export function ActionButton({
  action,
  id,
  label,
  confirm,
  redirectTo,
  variant = "button",
}: {
  action: (id: string) => Promise<ActionResult>;
  id: string | number;
  label: string;
  confirm?: string;
  redirectTo?: string;
  variant?: "button" | "link";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action(String(id));
          if (!res.ok) return void toast.error(res.message);
          toast.success(res.message);
          if (redirectTo) router.push(redirectTo, { scroll: false });
          else router.refresh();
        });
      }}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold transition disabled:opacity-60",
        variant === "button"
          ? "h-9 rounded-full border border-border bg-white px-4 text-sm text-brand-800 hover:bg-cream-100"
          : "text-xs text-muted hover:text-red-600",
      )}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Grup adı / notu                                                      */
/* ------------------------------------------------------------------ */

export function GroupEditForm({ id, name, note }: { id: number; name: string; note: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ name, note: note ?? "" });
  const [pending, start] = useTransition();

  if (!editing)
    return (
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <Pencil className="size-3.5" /> Adı / notu düzenle
      </button>
    );

  return (
    <form
      className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateGroup(String(id), values);
          if (!res.ok) return void toast.error(res.message);
          toast.success(res.message);
          setEditing(false);
          router.refresh();
        });
      }}
    >
      <Field label="Grup adı" required>
        <Input value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} autoFocus />
      </Field>
      <Field label="Not">
        <Textarea rows={2} value={values.note} onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))} placeholder="Ör. ödemeyi baba yapıyor, telefon..." />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Vazgeç
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Kaydet
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Grup tahsilatı                                                       */
/* ------------------------------------------------------------------ */

export type GroupPayMember = { saleId: number; name: string; balance: number };

/**
 * Tek tutar girilir; kişilerin kalan borçlarına orantılı dağıtım önerilir.
 * Paylar elle değiştirilebilir; kaydedilen her pay o kişinin satışına ayrı tahsilat olur.
 */
export function GroupPaymentForm({
  groupId,
  members,
  currency,
  people,
  person,
  today,
}: {
  groupId: number;
  /** Yalnızca kalan borcu olan, iptal edilmemiş satışlar (aynı para birimi) */
  members: GroupPayMember[];
  currency: string;
  people: string[];
  person: string;
  today: string;
}) {
  const router = useRouter();
  const totalDebt = members.reduce((t, m) => t + m.balance, 0);
  const [total, setTotal] = useState(String(totalDebt));
  const [parts, setParts] = useState<string[]>(() => members.map((m) => String(m.balance)));
  const [edited, setEdited] = useState(false);
  const [form, setForm] = useState({ date: today, method: "Nakit", receivedBy: person, note: "" });
  const [pending, start] = useTransition();

  const nums = parts.map((p) => Number(p) || 0);
  const partsSum = nums.reduce((a, b) => a + b, 0);
  const totalNum = Number(total) || 0;
  const over = members.findIndex((m, i) => nums[i] > m.balance);
  const fmt = (v: number) => formatPrice(v, currency, "0");

  function changeTotal(v: string) {
    setTotal(v);
    setEdited(false);
    setParts(splitProportional(Number(v) || 0, members.map((m) => m.balance)).map(String));
  }

  return (
    <form
      className="@container space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (over >= 0) return void toast.error(`${members[over].name}: pay kalan borçtan fazla.`);
        if (partsSum <= 0) return void toast.error("Dağıtılacak tutar girin.");
        start(async () => {
          const res = await addGroupPayment(String(groupId), { ...form, parts: members.map((m, i) => ({ saleId: m.saleId, amount: nums[i] })) });
          if (!res.ok) return void toast.error(res.message);
          toast.success(res.message);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-3 @md:grid-cols-2">
        <Field label={`Toplam tutar (${currency})`} required>
          <Input type="number" min={1} step={1} value={total} onChange={(e) => changeTotal(e.target.value)} />
        </Field>
        <Field label="Tarih" required>
          <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Ödeme şekli">
          <Select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Parayı alan" required>
          <Select value={form.receivedBy} onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))}>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border bg-cream-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Kişilere dağılım</span>
          <span>{edited ? "Elle düzenlendi" : "Kalan borca orantılı"}</span>
        </div>
        <ul className="divide-y divide-border">
          {members.map((m, i) => (
            <li key={m.saleId} className="flex items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-semibold text-brand-900">{m.name}</p>
                <p className="text-xs text-muted">Kalan: {fmt(m.balance)}</p>
              </div>
              <Input
                type="number"
                min={0}
                max={m.balance}
                step={1}
                value={parts[i]}
                aria-label={`${m.name} payı`}
                onChange={(e) => {
                  setEdited(true);
                  setParts((p) => p.map((x, j) => (j === i ? e.target.value : x)));
                }}
                className={cn("h-9 w-32 py-0 text-right tabular-nums", nums[i] > m.balance && "border-red-400")}
              />
            </li>
          ))}
        </ul>
        <div className={cn("flex justify-between border-t border-border px-4 py-2 text-sm font-semibold", partsSum !== totalNum ? "text-amber-700" : "text-brand-900")}>
          <span>{partsSum !== totalNum ? `Paylar toplamı, girilen tutardan farklı (${fmt(totalNum)})` : "Toplam"}</span>
          <span className="tabular-nums">{fmt(partsSum)}</span>
        </div>
      </div>

      <Field label="Açıklama">
        <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Dekont no, not..." />
      </Field>
      <Button type="submit" disabled={pending || partsSum <= 0} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {fmt(partsSum)} Grup Tahsilatı Ekle
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Satış listesinde seçim → "Grup yap" / "Gruba ekle"                   */
/* ------------------------------------------------------------------ */

const SelectionContext = createContext<{ selected: Set<number>; toggle: (id: number) => void; clear: () => void } | null>(null);

export function SaleSelection({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const value = useMemo(
    () => ({
      selected,
      toggle: (id: number) =>
        setSelected((s) => {
          const n = new Set(s);
          if (n.has(id)) n.delete(id);
          else n.add(id);
          return n;
        }),
      clear: () => setSelected(new Set()),
    }),
    [selected],
  );
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function SelectBox({ id, label }: { id: number; label: string }) {
  const ctx = useContext(SelectionContext);
  if (!ctx) return null;
  return (
    <input
      type="checkbox"
      checked={ctx.selected.has(id)}
      onChange={() => ctx.toggle(id)}
      aria-label={`${label} seç`}
      className="size-4 cursor-pointer accent-brand-700"
    />
  );
}

/** Seçim varken altta görünen çubuk: yeni grup yap veya var olan gruba ekle */
export function SelectionBar({ listHref }: { listHref: string }) {
  const ctx = useContext(SelectionContext);
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "new" | "add">("idle");
  const [name, setName] = useState("");
  const [groups, setGroups] = useState<{ id: number; name: string; count: number }[] | null>(null);
  const [groupId, setGroupId] = useState("");
  const [pending, start] = useTransition();
  const count = ctx?.selected.size ?? 0;

  useEffect(() => {
    if (mode !== "add" || groups) return;
    listGroups().then((r) => setGroups(r.data ?? []));
  }, [mode, groups]);

  if (!ctx || count === 0) return null;

  function submit(input: { groupId?: number; name?: string }) {
    start(async () => {
      const res = await groupSales({ saleIds: [...ctx!.selected], ...input });
      if (!res.ok || !res.data) return void toast.error(res.message);
      toast.success(res.message);
      ctx!.clear();
      setMode("idle");
      setName("");
      router.push(withParam(listHref, "panel", `g${res.data.groupId}`), { scroll: false });
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-border bg-brand-950 p-3 text-sm text-white shadow-2xl">
        <span className="flex items-center gap-2 px-2 font-semibold">
          <UsersRound className="size-4 text-gold-400" /> {count} satış seçildi
        </span>
        {mode === "idle" && (
          <>
            <button type="button" onClick={() => setMode("new")} className="rounded-xl bg-gold-400 px-3 py-2 font-bold text-brand-950 hover:bg-gold-300">
              Grup yap
            </button>
            <button type="button" onClick={() => setMode("add")} className="rounded-xl bg-white/10 px-3 py-2 font-semibold hover:bg-white/20">
              Var olan gruba ekle
            </button>
          </>
        )}
        {mode === "new" && (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit({ name });
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grup adı (ör. Yılmaz Ailesi)"
              className="h-9 min-w-0 flex-1 rounded-xl border-0 bg-white px-3 text-brand-900 placeholder:text-muted"
            />
            <button type="submit" disabled={pending || name.trim().length < 2} className="rounded-xl bg-gold-400 px-3 font-bold text-brand-950 disabled:opacity-50">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Oluştur"}
            </button>
          </form>
        )}
        {mode === "add" && (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (groupId) submit({ groupId: Number(groupId) });
            }}
          >
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-9 min-w-0 flex-1 rounded-xl border-0 bg-white px-3 text-brand-900 placeholder:text-muted" autoFocus>
              <option value="">{groups ? (groups.length ? "Grup seçin" : "Henüz grup yok") : "Yükleniyor..."}</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.count} kişi)
                </option>
              ))}
            </select>
            <button type="submit" disabled={pending || !groupId} className="rounded-xl bg-gold-400 px-3 font-bold text-brand-950 disabled:opacity-50">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Ekle"}
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={() => {
            ctx.clear();
            setMode("idle");
          }}
          className="ml-auto grid size-9 place-items-center rounded-xl hover:bg-white/10"
          aria-label="Seçimi temizle"
          title="Seçimi temizle"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
