import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui";
import { CategoryManager, type CategoryRow } from "@/components/admin/category-manager";
import { SYSTEM_CATEGORIES } from "@/lib/categories";
import { activeTourWhere } from "@/lib/queries";

export const metadata = { title: "Kategoriler" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.tourCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { tours: true } } },
  });
  const active = await prisma.tour.groupBy({ by: ["categoryId"], where: activeTourWhere(), _count: true });
  const activeMap = new Map(active.map((a) => [a.categoryId, a._count]));

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    icon: c.icon,
    order: c.order,
    tourCount: c._count.tours,
    activeCount: activeMap.get(c.id) ?? 0,
    system: SYSTEM_CATEGORIES[c.slug] ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Tur Kategorileri"
        description="Ana sayfadaki 'Yolculuk Kategorileri' kartları ve /turlar sayfasındaki filtreler buradan yönetilir. Sıralama sitede de aynen uygulanır."
      />
      <CategoryManager categories={rows} />
    </div>
  );
}
