import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { LandingForm } from "@/components/admin/landing-form";

export const metadata = { title: "Yeni SEO Sayfası" };

export default async function NewLandingPage() {
  const categories = await prisma.tourCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { name: true, slug: true },
  });
  return (
    <div>
      <Link href="/admin/landing" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> SEO Sayfalarına Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni SEO Sayfası</h2>
      <LandingForm categories={categories} siteUrl={SITE_URL} />
    </div>
  );
}
