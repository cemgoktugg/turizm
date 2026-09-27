import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContent, getContentStatus } from "@/lib/content";
import { CONTENT_BLOCKS, CONTENT_GROUPS, isContentKey } from "@/lib/content/registry";
import { ContentEditor } from "@/components/admin/content-editor";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return { title: isContentKey(key) ? CONTENT_BLOCKS[key].title : "İçerik" };
}

export default async function ContentEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isContentKey(key)) notFound();

  const block = CONTENT_BLOCKS[key];
  const [data, status] = await Promise.all([getContent(key), getContentStatus()]);

  return (
    <div>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Sayfa İçerikleri
      </Link>
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">{CONTENT_GROUPS[block.group]}</p>
      <h2 className="font-serif text-2xl font-bold text-brand-900">{block.title}</h2>
      <p className="mb-6 mt-1 text-sm text-muted">{block.description}</p>

      <ContentEditor
        blockKey={key}
        fields={block.fields}
        initial={data as Record<string, unknown>}
        isCustomized={!!status[key]}
        path={block.path}
      />
    </div>
  );
}
