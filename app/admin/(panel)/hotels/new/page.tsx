import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HotelForm } from "@/components/admin/hotel-form";

export const metadata = { title: "Yeni Otel" };

export default function NewHotelPage() {
  return (
    <div>
      <Link href="/admin/hotels" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Otellere Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Otel Ekle</h2>
      <HotelForm />
    </div>
  );
}
