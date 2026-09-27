import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TourForm } from "@/components/admin/tour-form";

export const metadata = { title: "Yeni Tur" };

export default async function NewTourPage() {
  const categories = await prisma.tourCategory.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Turlara Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Tur Ekle</h2>
      <TourForm categories={categories} />
    </div>
  );
}
