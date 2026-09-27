import { Phone, Mail, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/row-actions";
import { LeadStatusSelect } from "@/components/admin/lead-status";
import { deleteLead } from "@/app/actions/leads";
import { formatDate } from "@/lib/utils";
import { telLink } from "@/lib/settings";
import { LEAD_STATUSES } from "@/lib/validations";

export const metadata = { title: "Başvurular" };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { tour: { select: { title: true, slug: true } } },
  });

  const counts = LEAD_STATUSES.map((s) => ({
    status: s,
    count: leads.filter((l) => l.status === s).length,
  }));

  return (
    <div>
      <AdminPageHeader title="Başvurular" description={`Toplam ${leads.length} başvuru`} />

      {/* Durum özeti */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <AdminCard key={c.status} className="p-4">
            <p className="font-serif text-2xl font-bold text-brand-900">{c.count}</p>
            <p className="text-xs text-muted">{c.status}</p>
          </AdminCard>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState title="Henüz başvuru yok" description="Ziyaretçiler form doldurdukça burada görünecek." />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-900">{lead.fullName}</p>
                      {lead.personCount ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <Users className="size-3" /> {lead.personCount} kişi
                        </p>
                      ) : null}
                      {lead.message && (
                        <p className="mt-1 max-w-xs text-xs text-muted">{lead.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a href={telLink(lead.phone)} className="flex items-center gap-1.5 text-brand-800 hover:text-brand-600">
                        <Phone className="size-3.5" /> {lead.phone}
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="mt-1 flex items-center gap-1.5 text-xs text-muted hover:text-brand-600">
                          <Mail className="size-3.5" /> {lead.email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-800">
                      {lead.tour?.title || lead.tourTitle || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusSelect id={lead.id} status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <DeleteButton action={deleteLead} id={lead.id} label="Bu başvuruyu silmek istediğinize emin misiniz?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
