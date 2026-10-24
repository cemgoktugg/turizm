import { Download, Mail, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DeleteButton } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { deleteSubscriber } from "@/app/actions/subscribers";
import { buildSubscriberWhere } from "@/lib/subscriber-query";
import { formatContact } from "@/lib/subscribers";
import { whatsappLink } from "@/lib/settings";

export const metadata = { title: "Aboneler" };

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string; q?: string }>;
}) {
  const { tur = "", q = "" } = await searchParams;
  const type = tur === "phone" || tur === "email" ? tur : "";
  const term = q.trim();

  const [subscribers, total, phones] = await Promise.all([
    prisma.subscriber.findMany({ where: buildSubscriberWhere({ tur: type, q: term }), orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { type: "phone" } }),
  ]);

  const exportParams = new URLSearchParams();
  if (type) exportParams.set("tur", type);
  if (term) exportParams.set("q", term);

  return (
    <div>
      <AdminPageHeader
        title="Kampanya Aboneleri"
        description="Sayfa altındaki kayıt kutusundan ticari ileti onayı vererek kaydolan kişiler. Onayını geri alan kişiyi listeden silin."
      />

      <ListToolbar
        basePath="/admin/subscribers"
        tabParam="tur"
        tabs={[
          { value: "", label: "Tümü", count: total },
          { value: "phone", label: "Telefon", count: phones },
          { value: "email", label: "E-posta", count: total - phones },
        ]}
        activeTab={type}
        query={term}
        searchPlaceholder="Telefon, e-posta veya ad..."
      >
        <a
          href={`/api/admin/subscribers/export?${exportParams.toString()}`}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          title="Listeyi Excel (CSV) olarak indir"
        >
          <Download className="size-4" /> <span className="hidden sm:inline">Excel</span>
        </a>
      </ListToolbar>

      {subscribers.length === 0 ? (
        <EmptyState title={total ? "Aramaya uygun abone yok" : "Henüz abone yok"} />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">İletişim</th>
                  <th className="px-4 py-3 font-semibold">Ad</th>
                  <th className="px-4 py-3 font-semibold">Kayıt sayfası</th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={s.type === "phone" ? "brand" : "cream"} size="sm">
                          {s.type === "phone" ? "Telefon" : "E-posta"}
                        </Badge>
                        <span className="font-semibold text-brand-900">{formatContact(s.type, s.contact)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-800">{s.fullName || "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">{s.source || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{s.createdAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {s.type === "phone" ? (
                          <a
                            href={whatsappLink(s.contact)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp'tan yaz"
                            className="grid size-9 place-items-center rounded-lg border border-border text-[#1eb955] hover:bg-[#25D366]/10"
                          >
                            <MessageCircle className="size-4" />
                          </a>
                        ) : (
                          <a
                            href={`mailto:${s.contact}`}
                            title="E-posta gönder"
                            className="grid size-9 place-items-center rounded-lg border border-border text-brand-700 hover:bg-brand-50"
                          >
                            <Mail className="size-4" />
                          </a>
                        )}
                        <DeleteButton action={deleteSubscriber} id={s.id} label="Bu kişiyi abone listesinden çıkarmak istediğinize emin misiniz?" />
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
