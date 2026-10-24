import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { activeTourWhere } from "@/lib/queries";
import { getContent } from "@/lib/content";
import { visibleMembers } from "@/lib/team";

import { SITE_URL as BASE } from "@/lib/site-url";

// Her istekte canlı veritabanından üretilir (yeni tur / yazı anında görünür)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/hac",
    "/hac/programlari",
    "/hac/yetki-belgeleri",
    "/hac/dua-ve-vazifeler",
    "/umre",
    "/umre/kesin-tarihli-turlar",
    "/umre/luks-umre",
    "/umre/ramazan-umresi",
    "/umre/yetki-belgeleri",
    "/umre/dua-ve-vazifeler",
    "/turlar",
    "/oteller",
    "/oteller/mekke",
    "/oteller/medine",
    "/blog",
    "/gerekli-bilgiler",
    "/sss",
    "/hakkimizda",
    "/iletisim",
    "/rezervasyon",
    "/kvkk",
    "/cerez-politikasi",
    "/iptal-ve-iade",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [tours, posts, landings, team] = await Promise.all([
      prisma.tour.findMany({
        where: activeTourWhere(),
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.landingPage.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      getContent("page.ekibimiz"),
    ]);

    dynamicRoutes = [
      ...landings.map((l) => ({
        url: `${BASE}/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      // Ekip sayfası yalnız kişi eklendiyse yayındadır
      ...(visibleMembers(team.members).length
        ? [{ url: `${BASE}/ekibimiz`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 }]
        : []),
      ...tours.map((t) => ({
        url: `${BASE}/turlar/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...posts.map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // veritabanı erişilemezse yalnızca statik rotalar
  }

  return [...staticRoutes, ...dynamicRoutes];
}
