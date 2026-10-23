import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContent } from "@/lib/content";
import { StoryForm } from "@/components/admin/story-form";

export const metadata = { title: "Yeni Hikaye" };

export default async function NewStoryPage() {
  const labels = await getContent("home.stories");
  return (
    <div>
      <Link href="/admin/stories" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Hikayelere Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">Yeni Hikaye</h2>
      <StoryForm labels={labels} />
    </div>
  );
}
