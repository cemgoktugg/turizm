import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata = { title: "Yeni Yazı" };

export default function NewBlogPage() {
  return (
    <div>
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Yazılara Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Blog Yazısı</h2>
      <BlogForm />
    </div>
  );
}
