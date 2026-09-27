import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { EditLink, DeleteButton } from "@/components/admin/row-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { deleteBlogPost } from "@/app/actions/blog";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <AdminPageHeader
        title="Blog Yazıları"
        description={`Toplam ${posts.length} yazı`}
        actionLabel="Yeni Yazı"
        actionHref="/admin/blog/new"
      />

      {posts.length === 0 ? (
        <EmptyState title="Henüz yazı eklenmemiş" actionLabel="Yeni Yazı" actionHref="/admin/blog/new" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Yazı</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Tarih</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                          <SmartImage src={p.coverImage} alt={p.title} className="size-full" />
                        </span>
                        <p className="font-semibold text-brand-900">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.category ? <Badge variant="cream" size="sm">{p.category}</Badge> : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isPublished ? "green" : "slate"} size="sm">
                        {p.isPublished ? "Yayında" : "Taslak"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <EditLink href={`/admin/blog/${p.id}/edit`} />
                        <DeleteButton action={deleteBlogPost} id={p.id} label="Bu yazıyı silmek istediğinize emin misiniz?" />
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
