import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { EditLink, DeleteButton, FlagToggle, ViewLink } from "@/components/admin/row-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { deleteBlogPost, toggleBlogFlag } from "@/app/actions/blog";

export const metadata = { title: "Blog" };

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; q?: string }>;
}) {
  const { filtre = "", q = "" } = await searchParams;
  const filter = filtre === "yayinda" || filtre === "taslak" ? filtre : "";
  const term = q.trim();
  const where: Prisma.BlogPostWhereInput = {
    ...(filter ? { isPublished: filter === "yayinda" } : {}),
    ...(term ? { OR: [{ title: { contains: term } }, { category: { contains: term } }] } : {}),
  };

  const [posts, all, published] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { isPublished: true } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Blog Yazıları"
        description="Yayındaki yazılar blog sayfasında, ana sayfada (son 3 yazı) ve ilgili yazılar bölümünde görünür."
        actionLabel="Yeni Yazı"
        actionHref="/admin/blog/new"
      />

      <ListToolbar
        basePath="/admin/blog"
        tabs={[
          { value: "", label: "Tümü", count: all },
          { value: "yayinda", label: "Yayında", count: published },
          { value: "taslak", label: "Taslak", count: all - published },
        ]}
        activeTab={filter}
        query={term}
        searchPlaceholder="Başlık veya kategori ara..."
      />

      {posts.length === 0 ? (
        <EmptyState title="Yazı bulunamadı" actionLabel="Yeni Yazı" actionHref="/admin/blog/new" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
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
                        <div className="min-w-0">
                          <p className="max-w-[320px] truncate font-semibold text-brand-900">{p.title}</p>
                          <p className="text-xs text-muted">{p.readTime ? `${p.readTime} dk okuma` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.category ? <Badge variant="cream" size="sm">{p.category}</Badge> : "—"}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <FlagToggle action={toggleBlogFlag} id={p.id} field="isPublished" value={p.isPublished} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <ViewLink href={`/blog/${p.slug}`} disabled={!p.isPublished} />
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
