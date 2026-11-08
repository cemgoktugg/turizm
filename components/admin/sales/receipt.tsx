import { SmartImage } from "@/components/ui/smart-image";
import { amountInWords } from "@/lib/number-words";
import type { ReceiptData } from "@/lib/receipts";
import { money, shortDate } from "@/lib/sales";
import type { SiteSettings } from "@/lib/settings";
import { cn, formatDateTime } from "@/lib/utils";

type Company = Pick<SiteSettings, "siteName" | "companyTitle" | "logo" | "address" | "phone" | "email" | "tursabNo">;

/** Makbuz numarası: 000123 */
export const receiptNo = (no: number) => String(no).padStart(6, "0");

/**
 * Tek makbuz nüshası. A4'e iki nüsha (müşteri + acente) sığacak boyutta;
 * grup tahsilatında kişiler tablo olarak listelenir.
 */
export function ReceiptCopy({ r, company, copyLabel }: { r: ReceiptData; company: Company; copyLabel: string }) {
  const refund = r.isRefund;
  const one = r.lines.length === 1 ? r.lines[0] : null;
  const cur = r.currency;
  const payer = r.group?.name ?? r.lines.map((l) => l.customer.fullName).join(", ");
  const sum = (pick: (l: ReceiptData["lines"][number]) => number) => r.lines.reduce((t, l) => t + pick(l), 0);

  return (
    <section className="receipt-copy avoid-break print-exact rounded-xl border-[1.5px] border-brand-900/70 px-[6mm] py-[5mm] text-[11px] leading-snug text-brand-900">
      {/* Başlık: logo ve firma bilgisi | makbuz türü, no, tarih */}
      <header className="flex items-start justify-between gap-6 border-b border-brand-900/20 pb-[3mm]">
        <div className="min-w-0">
          <SmartImage src={company.logo} alt={company.siteName} loading="eager" className="h-[13mm] w-auto max-w-[60mm] object-contain object-left" />
          <div className="mt-[2mm] space-y-px text-[9.5px] text-slate-600">
            {company.companyTitle && <p className="font-semibold text-brand-900">{company.companyTitle}</p>}
            <p>{company.address}</p>
            <p>
              Tel: {company.phone}
              {company.email && ` · ${company.email}`}
              {company.tursabNo && ` · TÜRSAB Belge No: ${company.tursabNo}`}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-serif text-[17px] font-bold tracking-wide">{refund ? "İADE MAKBUZU" : "TAHSİLAT MAKBUZU"}</p>
          <dl className="mt-[1.5mm] grid grid-cols-[auto_auto] justify-end gap-x-2 text-[11px]">
            <dt className="text-slate-500">Makbuz No:</dt>
            <dd className="font-bold tabular-nums">{receiptNo(r.no)}</dd>
            <dt className="text-slate-500">Tarih:</dt>
            <dd className="font-bold tabular-nums">{shortDate(r.date)}</dd>
          </dl>
          <p className="mt-[1.5mm] inline-block rounded-full border border-gold-500 bg-gold-50 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gold-700">
            {copyLabel}
          </p>
        </div>
      </header>

      {/* Kimden / hangi tur */}
      {one ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-[1.2mm] py-[3mm]">
          <Info label={refund ? "İade Alan" : "Ödeme Yapan"} value={<strong>{one.customer.fullName}</strong>} />
          <Info label="T.C. / Telefon" value={[one.customer.tc, one.customer.phone].filter(Boolean).join(" · ") || "—"} />
          <Info label="Tur" value={<strong>{one.tour.name}</strong>} />
          <Info label="Tur Tarihi" value={`${shortDate(one.tour.departureDate)} – ${shortDate(one.tour.returnDate)} (${one.tour.days} gün)`} />
          <Info label="Dönem" value={one.tour.period} />
          <Info label="Satış No / Oda" value={`#${one.saleId}${one.roomSize ? ` · ${one.roomSize} kişilik oda` : ""}`} />
        </dl>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-[1.2mm] py-[3mm]">
          <Info label="Aile / Grup" value={<strong>{payer}</strong>} />
          <Info label="Kişi Sayısı" value={`${r.lines.length} kişi`} />
          <Info label="Tur" value={<strong>{[...new Set(r.lines.map((l) => l.tour.name))].join(", ")}</strong>} />
          <Info label="Dönem" value={[...new Set(r.lines.map((l) => l.tour.period))].join(", ")} />
        </dl>
      )}

      {/* Tutarlar */}
      {one ? (
        <div className={cn("grid gap-[2mm]", refund ? "grid-cols-3" : "grid-cols-4")}>
          {refund ? (
            <>
              <Amount label="Ödenmiş Tutar" value={money(one.previous, cur)} />
              <Amount label="İade Edilen" value={money(-one.amount, cur)} strong />
              <Amount label="Kalan İade" value={money(one.remaining, cur)} />
            </>
          ) : (
            <>
              <Amount label="Tur Ücreti" value={money(one.price, cur)} />
              <Amount label="Önceki Ödemeler" value={money(one.previous, cur)} />
              <Amount label="Bu Ödeme" value={money(one.amount, cur)} strong />
              <Amount label="Kalan Borç" value={money(Math.max(one.remaining, 0), cur)} alert={one.remaining > 0} />
            </>
          )}
        </div>
      ) : (
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="border-y border-brand-900/30 bg-cream-50 text-left text-[9.5px] uppercase tracking-wide text-slate-600">
              <th className="px-2 py-1 font-semibold">Kişi</th>
              <th className="px-2 py-1 font-semibold">Satış</th>
              <th className="px-2 py-1 text-right font-semibold">Tur Ücreti</th>
              <th className="px-2 py-1 text-right font-semibold">Önceki</th>
              <th className="px-2 py-1 text-right font-semibold">Bu Ödeme</th>
              <th className="px-2 py-1 text-right font-semibold">Kalan Borç</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l) => (
              <tr key={l.paymentId} className="border-b border-brand-900/10">
                <td className="px-2 py-[0.8mm] font-semibold">{l.customer.fullName}</td>
                <td className="px-2 py-[0.8mm] tabular-nums">#{l.saleId}</td>
                <td className="px-2 py-[0.8mm] text-right tabular-nums">{money(l.price, cur)}</td>
                <td className="px-2 py-[0.8mm] text-right tabular-nums">{money(l.previous, cur)}</td>
                <td className="px-2 py-[0.8mm] text-right font-bold tabular-nums">{money(l.amount, cur)}</td>
                <td className="px-2 py-[0.8mm] text-right tabular-nums">{money(Math.max(l.remaining, 0), cur)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-b border-brand-900/30 font-bold">
              <td className="px-2 py-1" colSpan={2}>
                Toplam
              </td>
              <td className="px-2 py-1 text-right tabular-nums">{money(sum((l) => l.price), cur)}</td>
              <td className="px-2 py-1 text-right tabular-nums">{money(sum((l) => l.previous), cur)}</td>
              <td className="px-2 py-1 text-right tabular-nums">{money(r.total, cur)}</td>
              <td className="px-2 py-1 text-right tabular-nums">{money(sum((l) => Math.max(l.remaining, 0)), cur)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <div className="mt-[3mm] space-y-[1mm] rounded-lg bg-cream-50 px-[3mm] py-[2mm]">
        <p>
          <span className="text-slate-500">Yalnız:</span> <strong>{amountInWords(Math.abs(r.total), cur)}</strong>
          <span className="text-slate-500"> ({money(Math.abs(r.total), cur)})</span>
        </p>
        <p>
          <span className="text-slate-500">Ödeme Şekli:</span> <strong>{r.method}</strong>
          {r.note && (
            <>
              <span className="text-slate-500"> · Açıklama:</span> {r.note}
            </>
          )}
        </p>
        {!refund && r.lines.some((l) => l.isCancelled) && <p className="font-semibold text-red-700">Not: Bu satış sonradan iptal edilmiştir.</p>}
      </div>

      {/* İmzalar */}
      <div className="mt-[4mm] grid grid-cols-2 gap-[10mm]">
        <Signature label={refund ? "İadeyi Yapan" : "Tahsil Eden"} name={r.receivedByName ?? ""} />
        <Signature label={refund ? "İadeyi Alan" : "Ödeme Yapan"} name={payer} />
      </div>

      <p className="mt-[3mm] text-[8.5px] text-slate-400">
        {company.siteName} Satış Programı · Kaydeden: {r.createdByName ?? "—"} · {formatDateTime(r.createdAt)}
      </p>
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="w-[25mm] shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}

function Amount({ label, value, strong, alert }: { label: string; value: string; strong?: boolean; alert?: boolean }) {
  return (
    <div className={cn("rounded-lg border px-[2.5mm] py-[1.8mm]", strong ? "border-brand-900 bg-brand-900 text-white" : "border-brand-900/25")}>
      <p className={cn("text-[9px] font-semibold uppercase tracking-wide", strong ? "text-gold-300" : "text-slate-500")}>{label}</p>
      <p className={cn("mt-0.5 text-[14px] font-bold tabular-nums", alert && "text-red-700")}>{value}</p>
    </div>
  );
}

function Signature({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-semibold">{name || " "}</p>
      <div className="mt-[9mm] border-t border-dashed border-brand-900/40 pt-0.5 text-[8.5px] text-slate-400">İmza</div>
    </div>
  );
}
