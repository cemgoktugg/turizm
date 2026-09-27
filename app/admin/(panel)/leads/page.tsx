import Link from "next/link";
import { Download, Mail, MessageCircle, Phone, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DeleteButton } from "@/components/admin/row-actions";
import { LeadNote, LeadStatusSelect } from "@/components/admin/lead-controls";
import { Badge } from "@/components/ui/badge";
import { deleteLead } from "@/app/actions/leads";
import { buildLeadWhere } from "@/lib/leads";
import { telLink, whatsappLink } from "@/lib/settings";
import { LEAD_SOURCES, LEAD_STATUSES, type LeadSource } from "@/lib/validations";
import { LEAD_STATUS_STYLES } from "@/lib/lead-status";

export const metadata = { title: "Başvurular" };

/** Türk cep numaralarını WhatsApp formatına (90…) çevirir */
function toWhatsapp(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "90" + d.slice(1);
  else if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return d.length >= 11 ? d : null;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; q?: string }>;
}) {
  const { durum = "", q = "" } = await searchParams;
  const status = (LEAD_STATUSES as readonly string[]).includes(durum) ? durum : "";
  const term = q.trim();

  const [leads, total, grouped] = await Promise.all([
    prisma.lead.findMany({
      where: buildLeadWhere({ q: term, durum: status }),
      orderBy: { createdAt: "desc" },
      include: { tour: { select: { title: true, slug: true } } },
      take: 500,
    }),
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
  ]);
  const countBy = Object.fromEntries(grouped.map((g) => [g.status, g._count]));

  const exportParams = new URLSearchParams();
  if (status) exportParams.set("durum", status);
  if (term) exportParams.set("q", term);

  return (
    <div>
      <AdminPageHeader
        title="Başvurular"
        description="Sitedeki tüm formlardan (tur detay, rezervasyon, iletişim) gelen talepler."
      />

      <ListToolbar
        basePath="/admin/leads"
        tabParam="durum"
        tabs={[{ value: "", label: "Tümü", count: total }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s, count: countBy[s] ?? 0 }))]}
        activeTab={status}
        query={term}
        searchPlaceholder="Ad, telefon, e-posta, tur..."
      >
        <a
          href={`/api/admin/leads/export?${exportParams.toString()}`}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          title="Filtrelenmiş listeyi Excel (CSV) olarak indir"
        >
          <Download className="size-4" /> <span className="hidden sm:inline">Excel</span>
        </a>
      </ListToolbar>

      {leads.length === 0 ? (
        <EmptyState
          title={term || status ? "Sonuç bulunamadı" : "Henüz başvuru yok"}
          description={term || status ? "Filtreyi veya aramayı değiştirin." : "Ziyaretçiler form doldurdukça burada görünecek."}
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Kişi</th>
                  <th className="px-4 py-3 font-semibold">İletişim</th>
                  <th className="px-4 py-3 font-semibold">İlgilendiği Tur</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => {
                  const wa = toWhatsapp(lead.phone);
                  return (
                    <tr key={lead.id} className={`align-top hover:bg-cream-50/50 ${lead.status === "Yeni" ? "bg-blue-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-900">{lead.fullName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                          {lead.personCount ? (
                            <span className="flex items-center gap-1">
                              <Users className="size-3" /> {lead.personCount} kişi
                            </span>
                          ) : null}
                          {lead.source && (
                            <Badge variant="slate" size="sm">
                              {LEAD_SOURCES[lead.source as LeadSource] ?? lead.source}
                            </Badge>
                          )}
                        </div>
                        {lead.message && <p className="mt-1.5 max-w-xs whitespace-pre-line text-xs text-brand-800">{lead.message}</p>}
                        <LeadNote id={lead.id} note={lead.note} />
                      </td>
                      <td className="px-4 py-3">
                        <a href={telLink(lead.phone)} className="flex items-center gap-1.5 text-brand-800 hover:text-brand-600">
                          <Phone className="size-3.5" /> {lead.phone}
                        </a>
                        {wa && (
                          <a
                            href={whatsappLink(wa, `Merhaba ${lead.fullName.split(" ")[0]}, başvurunuzla ilgili yazıyoruz.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#1eb955] hover:underline"
                          >
                            <MessageCircle className="size-3.5" /> WhatsApp&apos;tan yaz
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="mt-1 flex items-center gap-1.5 text-xs text-muted hover:text-brand-600">
                            <Mail className="size-3.5" /> {lead.email}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-800">
                        {lead.tour ? (
                          <Link href={`/turlar/${lead.tour.slug}`} target="_blank" className="hover:text-gold-600 hover:underline">
                            {lead.tour.title}
                          </Link>
                        ) : (
                          lead.tourTitle || <span className="text-muted">Genel bilgi</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge variant={LEAD_STATUS_STYLES[lead.status] ?? "slate"} size="sm">
                            {lead.status}
                          </Badge>
                          <LeadStatusSelect id={lead.id} status={lead.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{lead.createdAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DeleteButton action={deleteLead} id={lead.id} label="Bu başvuruyu silmek istediğinize emin misiniz?" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
