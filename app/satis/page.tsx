import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { FilterBar, FilterSelect, StatBox, th, td, num, theadRow, qs } from "@/components/admin/sales/ui";
import { SaleRowMenu } from "@/components/admin/sales/sale-row-menu";
import { NewSale } from "@/components/admin/sales/new-sale";
import { GroupDetail } from "@/components/admin/sales/group-detail";
import { SaleSelection, SelectBox, SelectionBar } from "@/components/admin/sales/group-client";
import { SaleDetail } from "@/components/admin/sales/sale-detail";
import { SidePanel } from "@/components/admin/sales/side-panel";
import { SeatHint } from "@/components/admin/sales/seat-hint";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CalendarRange, Pencil, Plus, UsersRound, X } from "lucide-react";
import {
  SALE_STATUSES,
  getCashPeople,
  getGroup,
  getPeriodTours,
  getReferences,
  getSale,
  loadSaleList,
  money,
  moneyList,
  shortDate,
  totalsOf,
  tourParam,
} from "@/lib/sales";
import { cn, formatDateTime } from "@/lib/utils";
import { passengerLabel } from "@/lib/sale-pricing";
import { getSalesBase } from "@/lib/sales-base-server";

// İşlem butonları geniş tabloda kaydırmadan görünsün diye sağa sabitlenir
const stickyEnd = "sticky right-0 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]";

export const metadata = { title: "Satışlar" };

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ donem?: string; tur?: string; q?: string; durum?: string; personel?: string; referans?: string; panel?: string; grup?: string; tip?: string }>;
}) {
  const base = await getSalesBase();
  const { donem = "", tur = "", q = "", durum = "", personel = "", referans = "", panel = "", grup = "", tip = "" } = await searchParams;
  // ?tur=5: yalnızca o turun satışları (dönem listesinde dönemin altından seçilir)
  const tourId = tourParam(tur);
  // Yan panel (liste arkada kalır): ?panel=yeni (yeni satış; &grup=3 o gruba kişi ekler, &tip=grup aile formuyla açar),
  // ?panel=12 (satış detayı), ?panel=g3 (aile / grup)
  const panelId = /^\d{1,9}$/.test(panel) ? Number(panel) : null;
  const panelGroupId = /^g\d{1,9}$/.test(panel) ? Number(panel.slice(1)) : null;
  const [periodTours, sales, tourCount, people, references, panelSale, panelGroup, tour] = await Promise.all([
    getPeriodTours(),
    loadSaleList({ donem, tur, q, durum, personel, referans }),
    prisma.serviceTour.count(),
    getCashPeople(),
    getReferences(),
    panelId ? getSale(panelId) : null,
    panelGroupId ? getGroup(panelGroupId) : null,
    tourId
      ? prisma.serviceTour.findUnique({
          where: { id: tourId },
          include: {
            guide1: { select: { fullName: true } },
            guide2: { select: { fullName: true } },
            _count: { select: { sales: { where: { isCancelled: false } } } },
          },
        })
      : null,
  ]);
  const periods = periodTours.map((g) => g.period);
  const totals = totalsOf(sales);
  const filters = { donem, tur, q, durum, personel, referans };
  const listHref = `${base}${qs(filters)}`;
  const panelHref = (value: string, extra: Record<string, string> = {}) => `${base}${qs({ ...filters, panel: value, ...extra })}`;

  return (
    <div>
      <AdminPageHeader
        title="Satışlar"
        description="Tur kayıtları ve alacak durumu. Ödenen ve kalan tutarlar tahsilatlardan hesaplanır. Satıra tıklayınca ayrıntılar yanda açılır."
      >
        <Link href={panelHref("yeni")} scroll={false} className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Yeni Satış
        </Link>
      </AdminPageHeader>

      <FilterBar
        action={base}
        periods={periods}
        tours={periodTours}
        donem={donem}
        tur={tour ? String(tour.id) : ""}
        q={q}
        searchPlaceholder="Müşteri, T.C., telefon, tur, referans veya satış no..."
        exportHref={`/api/admin/satis/export${qs({ rapor: "satislar", donem, tur, q, durum, personel, referans })}`}
      >
        <FilterSelect
          name="durum"
          value={durum}
          label="Durum"
          allLabel="Tüm durumlar"
          options={Object.entries(SALE_STATUSES).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect name="personel" value={personel} label="Personel" allLabel="Tüm personel" options={people} />
        <FilterSelect name="referans" value={referans} label="Referans" allLabel="Tüm referanslar" options={references} />
      </FilterBar>

      {tour && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4 sm:flex-row sm:items-center">
          <CalendarRange className="hidden size-8 shrink-0 text-gold-600 sm:block" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
              {tour.period} · Tur No {tour.id}
            </p>
            <p className="font-serif text-lg font-bold text-brand-900">
              {tour.name}
              {!tour.isActive && (
                <Badge variant="slate" size="sm" className="ml-2 align-middle">
                  Pasif
                </Badge>
              )}
            </p>
            <p className="text-sm text-muted">
              {shortDate(tour.departureDate)} – {shortDate(tour.returnDate)} · {tour.days} gün · Görevli:{" "}
              {[tour.guide1?.fullName, tour.guide2?.fullName].filter(Boolean).join(", ") || "atanmadı"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-bold text-brand-900">
              {tour._count.sales}
              {tour.capacity != null ? ` / ${tour.capacity}` : ""} kişi
            </p>
            {tour.capacity == null ? <p className="mt-1 text-xs text-muted">Kontenjan girilmemiş</p> : <SeatHint capacity={tour.capacity} sold={tour._count.sales} adding={0} />}
          </div>
          <div className="flex gap-2">
            <Link href={`${base}/turlar/${tour.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="size-3.5" /> Tur Bilgileri
            </Link>
            <Link href={`${base}${qs({ ...filters, tur: "" })}`} className={buttonVariants({ variant: "ghost", size: "sm" })} title="Tur seçimini kaldır (dönemin bütün satışları)">
              <X className="size-3.5" /> Kaldır
            </Link>
          </div>
        </div>
      )}

      {sales.length === 0 ? (
        tourCount === 0 ? (
          <EmptyState
            title="Henüz tur tanımlanmamış"
            description="Satış yapabilmek için önce görevli ve tur ekleyin."
            actionLabel="Tur Ekle"
            actionHref={`${base}/turlar/yeni`}
          />
        ) : (
          <EmptyState title={tour ? "Bu turda henüz satış yok" : "Satış bulunamadı"} actionLabel="Yeni Satış" actionHref={panelHref("yeni")} />
        )
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Satış adedi" value={String(totals.count)} />
            <StatBox label="Toplam ücret" value={moneyList(totals.price)} />
            <StatBox label="Tahsil edilen" value={moneyList(totals.paid)} tone="green" />
            <StatBox label="Kalan alacak" value={moneyList(totals.balance)} tone="red" />
            {Object.keys(totals.refundDue).length > 0 && <StatBox label="İade bekleyen" value={moneyList(totals.refundDue)} tone="red" />}
          </div>

          <SaleSelection>
          <AdminCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] text-sm">
                <thead>
                  <tr className={theadRow}>
                    <th className={cn(th, "w-8 pr-0")} title="Aynı ailenin satırlarını seçip gruplayın">
                      <UsersRound className="size-4" aria-label="Gruplamak için seç" />
                    </th>
                    <th className={th}>Sıra No</th>
                    <th className={th}>Tarih</th>
                    <th className={th}>Dönem</th>
                    <th className={th}>Tur ID</th>
                    <th className={th}>Tur Adı</th>
                    <th className={th}>Müşteri ID</th>
                    <th className={th}>Müşteri Adı</th>
                    <th className={th}>Açıklama</th>
                    <th className={th}>Referans</th>
                    <th className={cn(th, "text-center")}>Oda Kişi</th>
                    <th className={cn(th, num)}>Ücret</th>
                    <th className={cn(th, num)}>Ödenen</th>
                    <th className={cn(th, num)}>Kalan</th>
                    <th className={th}>Kaydeden</th>
                    <th className={cn(th, stickyEnd, "bg-cream-50 text-right")}>İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map((s) => (
                    <tr
                      key={s.id}
                      className={cn(
                        "hover:bg-cream-50/60",
                        s.isCancelled && "text-muted line-through decoration-slate-300",
                        (panelId === s.id || (panelGroupId != null && s.group?.id === panelGroupId)) && "bg-gold-50 hover:bg-gold-50",
                      )}
                    >
                      <td className={cn(td, "pr-0")}>
                        <SelectBox id={s.id} label={`#${s.id} ${s.customer.fullName}`} />
                      </td>
                      <td className={td}>
                        <Link href={panelHref(String(s.id))} scroll={false} className="font-bold text-brand-700 hover:text-gold-600">
                          {s.id}
                        </Link>
                      </td>
                      <td className={td}>{shortDate(s.date)}</td>
                      <td className={td}>{s.tour.period}</td>
                      <td className={td}>{s.tour.id}</td>
                      <td className={cn(td, "max-w-56 truncate")} title={s.tour.name}>
                        {s.tour.name}
                      </td>
                      <td className={td}>{s.customer.id}</td>
                      <td className={td}>
                        <Link href={panelHref(String(s.id))} scroll={false} className="font-semibold text-brand-900 hover:text-brand-600">
                          {s.customer.fullName}
                        </Link>
                        {s.group && (
                          <Link
                            href={panelHref(`g${s.group.id}`)}
                            scroll={false}
                            title="Aile / grup"
                            className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 no-underline hover:bg-brand-100"
                          >
                            <UsersRound className="size-3" /> {s.group.name}
                          </Link>
                        )}
                        {s.passenger && (
                          <Badge variant="slate" size="sm" className="ml-2 no-underline" title={passengerLabel(s.passenger)}>
                            {s.passenger} yaş
                          </Badge>
                        )}
                        {s.isCancelled && (
                          <Badge variant="slate" size="sm" className="ml-2 no-underline">
                            İptal
                          </Badge>
                        )}
                        {s.refundDue > 0 && (
                          <Badge variant="amber" size="sm" className="ml-2 no-underline">
                            İade: {money(s.refundDue, s.currency)}
                          </Badge>
                        )}
                      </td>
                      <td className={cn(td, "max-w-48 truncate")} title={s.note ?? undefined}>
                        {s.note}
                      </td>
                      <td className={td}>{s.reference}</td>
                      <td className={cn(td, "text-center")}>{s.roomSize ?? ""}</td>
                      <td className={cn(td, num)}>{money(s.price, s.currency)}</td>
                      <td className={cn(td, num, "text-green-700")}>{money(s.paid, s.currency)}</td>
                      <td className={cn(td, num, "font-semibold", s.balance > 0 ? "text-red-600" : "text-green-700")}>
                        {money(s.balance, s.currency)}
                      </td>
                      <td className={td}>
                        <p className="font-semibold">{s.createdByName ?? "—"}</p>
                        <p className="text-xs text-muted tabular-nums">{formatDateTime(s.createdAt)}</p>
                      </td>
                      <td className={cn(td, stickyEnd, "bg-white")}>
                        <div className="flex justify-end">
                          <SaleRowMenu
                            id={s.id}
                            isCancelled={s.isCancelled}
                            hasPayments={s.paymentCount > 0}
                            receipts={s.payments.map((p) => ({
                              id: p.id,
                              label: `${p.amount < 0 ? "İade makbuzu" : "Makbuz"} · ${money(Math.abs(p.amount), s.currency)}`,
                              date: shortDate(p.date),
                            }))}
                            detailHref={panelHref(String(s.id))}
                            editHref={`${base}/${s.id}/duzenle`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-cream-50 font-bold text-brand-900">
                    <td className={td} colSpan={11}>
                      Toplam ({totals.count} satış{sales.length > totals.count ? `, ${sales.length - totals.count} iptal hariç` : ""})
                    </td>
                    <td className={cn(td, num)}>{moneyList(totals.price)}</td>
                    <td className={cn(td, num, "text-green-700")}>{moneyList(totals.paid)}</td>
                    <td className={cn(td, num, "text-red-600")}>{moneyList(totals.balance)}</td>
                    <td className={td} />
                    <td className={cn(td, stickyEnd, "bg-cream-50")} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </AdminCard>
          <SelectionBar listHref={listHref} />
          </SaleSelection>
        </>
      )}

      {panel === "yeni" ? (
        <SidePanel key="yeni" title="Yeni Satış" closeHref={listHref} fullHref={`${base}/yeni${qs({ grup, tip })}`}>
          <NewSale base={base} listHref={listHref} groupId={Number(grup)} initialMode={tip === "grup" ? "group" : "single"} />
        </SidePanel>
      ) : panelGroup ? (
        <SidePanel key={`g${panelGroup.id}`} title={panelGroup.name} closeHref={listHref} fullHref={`${base}/gruplar/${panelGroup.id}`}>
          <GroupDetail
            group={panelGroup}
            base={base}
            saleHref={(saleId) => panelHref(String(saleId))}
            addHref={panelHref("yeni", { grup: String(panelGroup.id) })}
            afterDeleteHref={listHref}
          />
        </SidePanel>
      ) : panelSale ? (
        <SidePanel key={panelSale.id} title={`${panelSale.customer.fullName} · ${panelSale.tour.name}`} closeHref={listHref} fullHref={`${base}/${panelSale.id}`}>
          <SaleDetail sale={panelSale} base={base} compact afterDeleteHref={listHref} groupHref={panelSale.group ? panelHref(`g${panelSale.group.id}`) : undefined} />
        </SidePanel>
      ) : panelId || panelGroupId ? (
        <SidePanel key={panel} title={panelId ? `Satış #${panelId}` : "Grup"} closeHref={listHref}>
          <EmptyState title={panelId ? "Satış bulunamadı" : "Grup bulunamadı"} description="Silinmiş olabilir." />
        </SidePanel>
      ) : null}
    </div>
  );
}
