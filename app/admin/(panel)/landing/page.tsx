import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { EditLink, DeleteButton, FlagToggle, ViewLink } from "@/components/admin/row-actions";
import { formatDate } from "@/lib/utils";
import { parseFaqs, splitCategories } from "@/lib/landing";
import { deleteLandingPage, toggleLandingFlag } from "@/app/actions/landing";

export const metadata = { title: "SEO Sayfaları" };

export default async function AdminLandingPage() {
  const [pages, categories] = await Promise.all([
    prisma.landingPage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.tourCategory.findMany({ select: { slug: true, name: true } }),
  ]);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));

  return (
    <div>
      <AdminPageHeader
        title="SEO Sayfaları"
        description="Google'da belirli aramalar için açılış sayfaları (ör. “Sivas umre”, “umre fiyatları”). Her sayfada metin, ilgili turlar ve sık sorulan sorular yer alır."
        actionLabel="Yeni Sayfa"
        actionHref="/admin/landing/new"
      />

      {pages.length === 0 ? (
        <EmptyState title="Henüz sayfa yok" actionLabel="Yeni Sayfa" actionHref="/admin/landing/new" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Sayfa</th>
                  <th className="px-4 py-3 font-semibold">Listelenen turlar</th>
                  <th className="px-4 py-3 font-semibold">SSS</th>
                  <th className="px-4 py-3 font-semibold">Güncelleme</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pages.map((p) => {
                  const cats = splitCategories(p.tourCategories);
                  return (
                    <tr key={p.id} className="hover:bg-cream-50/50">
                      <td className="px-4 py-3">
                        <p className="max-w-[320px] truncate font-semibold text-brand-900">{p.title}</p>
                        <p className="text-xs text-muted">/{p.slug}</p>
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-xs text-brand-800">
                        {cats.length ? cats.map((c) => catName.get(c) ?? c).join(", ") : "Tüm turlar"}
                        {p.tourSearch && <span className="text-muted"> · “{p.tourSearch}”</span>}
                      </td>
                      <td className="px-4 py-3 text-muted">{parseFaqs(p.faqs).length}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(p.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <FlagToggle action={toggleLandingFlag} id={p.id} field="isPublished" value={p.isPublished} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ViewLink href={`/${p.slug}`} disabled={!p.isPublished} />
                          <EditLink href={`/admin/landing/${p.id}/edit`} />
                          <DeleteButton action={deleteLandingPage} id={p.id} label="Bu sayfayı silmek istediğinize emin misiniz?" />
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
