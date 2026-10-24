import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { parseFaqs, splitCategories } from "@/lib/landing";
import { LANDING_SORTS } from "@/lib/validations";
import { LandingForm } from "@/components/admin/landing-form";

export const metadata = { title: "SEO Sayfası Düzenle" };

export default async function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, categories] = await Promise.all([
    prisma.landingPage.findUnique({ where: { id } }),
    prisma.tourCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { name: true, slug: true } }),
  ]);
  if (!page) notFound();
  const sort = (LANDING_SORTS as readonly string[]).includes(page.toursSort ?? "")
    ? (page.toursSort as (typeof LANDING_SORTS)[number])
    : "onerilen";

  return (
    <div>
      <Link href="/admin/landing" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> SEO Sayfalarına Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Sayfa Düzenle: <span className="text-brand-600">{page.title}</span>
      </h2>
      <LandingForm
        pageId={page.id}
        slug={page.slug}
        categories={categories}
        siteUrl={SITE_URL}
        defaultValues={{
          title: page.title,
          slug: page.slug,
          description: page.description ?? "",
          image: page.image ?? "",
          content: page.content,
          tourCategories: splitCategories(page.tourCategories),
          tourSearch: page.tourSearch ?? "",
          toursTitle: page.toursTitle ?? "",
          toursSort: sort,
          faqs: parseFaqs(page.faqs),
          seoTitle: page.seoTitle ?? "",
          seoDescription: page.seoDescription ?? "",
          isPublished: page.isPublished,
        }}
      />
    </div>
  );
}
