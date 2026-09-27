import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TourForm } from "@/components/admin/tour-form";
import { getTourFormOptions } from "@/lib/admin-data";

export const metadata = { title: "Yeni Tur" };

export default async function NewTourPage() {
  const { categories, hotels } = await getTourFormOptions();

  return (
    <div>
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Turlara Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Tur Ekle</h2>
      <TourForm categories={categories} hotels={hotels} />
    </div>
  );
}
