import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { StoryForm } from "@/components/admin/story-form";

export const metadata = { title: "Hikaye Düzenle" };

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [story, labels] = await Promise.all([
    prisma.story.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } }),
    getContent("home.stories"),
  ]);
  if (!story) notFound();

  return (
    <div>
      <Link href="/admin/stories" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Hikayelere Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Hikaye Düzenle: <span className="text-brand-600">{story.title}</span>
      </h2>
      <StoryForm
        storyId={story.id}
        labels={labels}
        defaultValues={{
          title: story.title,
          cover: story.cover ?? "",
          buttonLabel: story.buttonLabel ?? "",
          buttonUrl: story.buttonUrl ?? "",
          isPublished: story.isPublished,
          items: story.items.map((it) => ({
            url: it.url,
            caption: it.caption ?? "",
            duration: it.duration == null ? "" : String(it.duration),
          })),
        }}
      />
    </div>
  );
}
