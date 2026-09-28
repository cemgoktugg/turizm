import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Mail, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { DeleteButton, FlagToggle } from "@/components/admin/row-actions";
import { Stars } from "@/components/site/tour-detail/stars";
import { deleteReview, toggleReviewApproval } from "@/app/actions/reviews";

export const metadata = { title: "Değerlendirmeler" };

const FILTERS: Record<string, { label: string; where: Prisma.ReviewWhereInput }> = {
  "": { label: "Tümü", where: {} },
  bekleyen: { label: "Onay bekleyen", where: { isApproved: false } },
  yayinda: { label: "Yayında", where: { isApproved: true } },
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; q?: string; tur?: string }>;
}) {
  const { durum = "", q = "", tur = "" } = await searchParams;
  const filter = FILTERS[durum] ? durum : "";
  const term = q.trim();

  const tourFilter: Prisma.ReviewWhereInput = tur ? { tourId: tur } : {};
  const where: Prisma.ReviewWhereInput = {
    AND: [
      FILTERS[filter].where,
      tourFilter,
      term
        ? {
            OR: [
              { fullName: { contains: term } },
              { email: { contains: term } },
              { comment: { contains: term } },
              { tour: { title: { contains: term } } },
            ],
          }
        : {},
    ],
  };

  const [reviews, counts, tourName] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { tour: { select: { title: true, slug: true, code: true } } },
      orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      take: 500,
    }),
    Promise.all(
      Object.entries(FILTERS).map(
        async ([k, f]) => [k, await prisma.review.count({ where: { AND: [f.where, tourFilter] } })] as const,
      ),
    ),
    tur ? prisma.tour.findUnique({ where: { id: tur }, select: { title: true } }) : null,
  ]);
  const countMap = Object.fromEntries(counts);

  return (
    <div>
      <AdminPageHeader
        title="Değerlendirmeler"
        description="Ziyaretçilerin tur sayfalarından gönderdiği yorumlar. Onayladığınız yorumlar ilgili turun 'Değerlendirmeler' bölümünde yayınlanır."
      />

      {tourName && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
          Tur: <strong>{tourName.title}</strong>
          <Link href="/admin/reviews" className="grid size-5 place-items-center rounded-full hover:bg-brand-100" aria-label="Tur filtresini kaldır">
            <X className="size-3.5" />
          </Link>
        </p>
      )}

      <ListToolbar
        basePath="/admin/reviews"
        tabParam="durum"
        tabs={Object.entries(FILTERS).map(([value, f]) => ({ value, label: f.label, count: countMap[value] }))}
        activeTab={filter}
        query={term}
        searchPlaceholder="Ad, e-posta, yorum, tur..."
      />

      {reviews.length === 0 ? (
        <EmptyState
          title={term || filter ? "Sonuç bulunamadı" : "Henüz değerlendirme yok"}
          description={term || filter ? "Filtreyi veya aramayı değiştirin." : "Ziyaretçiler tur sayfalarından yorum yazdıkça burada görünecek."}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <AdminCard key={r.id} className={r.isApproved ? "p-5" : "border-amber-200 p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted">{r.createdAt.toLocaleString("tr-TR")}</span>
                  </div>
                  <a
                    href={`/turlar/${r.tour.slug}#degerlendirmeler`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate text-xs font-semibold text-brand-600 hover:text-gold-600"
                  >
                    {r.tour.code && `#${r.tour.code} · `}
                    {r.tour.title}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <FlagToggle
                    action={toggleReviewApproval}
                    id={r.id}
                    field="isPublished"
                    value={r.isApproved}
                    labels={{ on: "Yayında", off: "Onay bekliyor" }}
                  />
                  <DeleteButton action={deleteReview} id={r.id} label="Bu değerlendirmeyi silmek istediğinize emin misiniz?" />
                </div>
              </div>
              {r.title && <p className="mt-3 font-semibold text-brand-900">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-800">{r.comment}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="font-semibold text-brand-800">{r.fullName}</span>
                <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                  <Mail className="size-3.5" /> {r.email}
                </a>
              </p>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
