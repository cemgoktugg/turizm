import { CONTRACT_SECTIONS, CONTRACT_TITLE } from "@/lib/contract-text";
import type { ContractData } from "@/lib/contracts";
import { money, shortDate } from "@/lib/sales";
import { cn } from "@/lib/utils";
import { CompanyBlock, type Company } from "./receipt";
import { roomAndPassenger } from "@/lib/sale-pricing";

/**
 * Umre hizmet sözleşmesi (tek A4 sayfası). Taraflar, tur ve ücret bilgileri
 * satıştan otomatik doldurulur; boş olan T.C. / telefon / oda elle yazılsın
 * diye noktalı çizgi olarak basılır. Sözleşme tarihi satışın kayıt tarihidir.
 */
export function UmreContract({ sale, company }: { sale: ContractData; company: Company }) {
  const { customer, tour } = sale;
  const agency = company.companyTitle || company.siteName;

  return (
    <article className="print-exact text-[10px] leading-snug text-brand-900">
      {/* Başlık: logo ve firma bilgisi | sözleşme adı, kayıt no, tarih */}
      <header className="flex items-start justify-between gap-6 border-b-[1.5px] border-brand-900/70 pb-[3mm]">
        <CompanyBlock company={company} />
        <div className="shrink-0 text-right">
          <p className="font-serif text-[17px] font-bold tracking-wide">{CONTRACT_TITLE}</p>
          <dl className="mt-[1.5mm] grid grid-cols-[auto_auto] justify-end gap-x-2 text-[11px]">
            <dt className="text-slate-500">Kayıt No:</dt>
            <dd className="font-bold tabular-nums">#{sale.id}</dd>
            <dt className="text-slate-500">Tarih:</dt>
            <dd className="font-bold tabular-nums">{shortDate(sale.date)}</dd>
          </dl>
        </div>
      </header>

      {/* Taraflar ve tur */}
      <div className="mt-[3mm] grid grid-cols-2 gap-[3mm]">
        <Box title="Acente">
          <Field label="Unvan" value={<strong>{agency}</strong>} />
          {company.companyTitle && company.siteName !== company.companyTitle && <Field label="Marka" value={company.siteName} />}
          {company.tursabNo && <Field label="TÜRSAB Belge No" value={company.tursabNo} />}
        </Box>
        <Box title="Umreci">
          <Field label="Adı Soyadı" value={<strong>{customer.fullName}</strong>} />
          <Field label="T.C. Kimlik No" value={customer.tc || <Blank />} />
          <Field label="Telefon" value={customer.phone || <Blank />} />
          {sale.group && <Field label="Aile / Grup" value={sale.group.name} />}
        </Box>
        <Box title="Tur Bilgileri" wide>
          <Field label="Tur" value={<strong>{tour.name}</strong>} />
          <Field label="Dönem" value={tour.period} />
          <Field label="Gidiş – Dönüş" value={`${shortDate(tour.departureDate)} – ${shortDate(tour.returnDate)} (${tour.days} gün)`} />
          {tour.accommodation && <Field label="Konaklama" value={tour.accommodation} />}
          <Field label={sale.passenger ? "Oda / Yolcu" : "Oda Tipi"} value={roomAndPassenger(sale.roomSize, sale.passenger) || <Blank />} />
          <Field label="Tur Ücreti" value={<strong>{money(sale.price, tour.currency)} (kişi başı)</strong>} />
        </Box>
      </div>

      {/* Maddeler */}
      <div className="mt-[3mm] columns-2 gap-[6mm] text-justify text-[9px] leading-[1.33]">
        {CONTRACT_SECTIONS.map((s, si) => (
          <section key={s.title} className={si > 0 ? "mt-[2.5mm]" : undefined}>
            <h3 className="mb-[1mm] font-serif text-[10.5px] font-bold tracking-wide break-after-avoid">{s.title}</h3>
            {s.clauses.map((c, i) => (
              <p key={i} className="mb-[1mm]">
                {c.parts.map(([title, text], j) => (
                  <span key={title}>
                    {j > 0 && " "}
                    <strong>
                      {j === 0 && c.letter && `${c.letter}) `}
                      {title}:
                    </strong>{" "}
                    {text}
                  </span>
                ))}
              </p>
            ))}
          </section>
        ))}
      </div>

      {/* Kabul ve imzalar */}
      <div className="avoid-break mt-[2.5mm] border-t border-brand-900/20 pt-[2mm]">
        <p className="text-[9.5px]">
          Taraflar, yukarıdaki şartları okuyup anladıklarını ve kabul ettiklerini beyan ederek işbu sözleşmeyi{" "}
          <strong className="tabular-nums">{shortDate(sale.date)}</strong> tarihinde imza altına almışlardır.
        </p>
        <div className="mt-[3mm] grid grid-cols-2 gap-x-[8mm]">
          <Signature label="Acente" name={agency} hint="Kaşe / İmza" />
          <Signature label="Umreci" name={customer.fullName} hint="İmza" />
        </div>
      </div>
    </article>
  );
}

/** Bilgi kutusu; wide: iki sütunu kaplar ve alanları iki sütuna dizer */
function Box({ title, wide, children }: { title: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-brand-900/25 px-[3mm] py-[1.8mm]", wide && "col-span-2")}>
      <p className="mb-[0.8mm] text-[8.5px] font-bold uppercase tracking-[0.16em] text-gold-700">{title}</p>
      <dl className={wide ? "grid grid-cols-2 gap-x-[4mm] gap-y-[0.6mm]" : "space-y-[0.6mm]"}>{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="w-[24mm] shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}

/** Elle doldurulacak boş alan */
function Blank() {
  return <span className="inline-block w-[40mm] border-b border-dotted border-slate-400 align-bottom">&nbsp;</span>;
}

function Signature({ label, name, hint }: { label: string; name: string; hint: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[8.5px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate font-semibold">{name}</p>
      <div className="mt-[8mm] border-t border-dashed border-brand-900/40 pt-0.5 text-[8.5px] text-slate-400">{hint}</div>
    </div>
  );
}
