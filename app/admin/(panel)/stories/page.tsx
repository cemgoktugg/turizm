import { prisma } from "@/lib/prisma";
import { isVideoUrl } from "@/lib/media-types";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { DeleteButton, EditLink, FlagToggle, OrderButtons } from "@/components/admin/row-actions";
import { MediaThumb } from "@/components/ui/media-thumb";
import { cn } from "@/lib/utils";
import { STORY_RING } from "@/lib/brand";
import { deleteStory, moveStory, toggleStoryPublished } from "@/app/actions/stories";

export const metadata = { title: "Hikayeler" };

export default async function AdminStoriesPage() {
  const stories = await prisma.story.findMany({
    include: { items: { orderBy: { order: "asc" }, select: { url: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const thumbOf = (s: (typeof stories)[number]) =>
    s.cover || s.items.find((i) => !isVideoUrl(i.url))?.url || s.items[0]?.url || "";

  return (
    <div>
      <AdminPageHeader
        title="Hikayeler"
        description="Ana sayfada slider'ın altında Instagram hikayesi gibi görünen yuvarlak videolar ve fotoğraflar. Oklarla sırayı değiştirebilirsiniz."
        actionLabel="Yeni Hikaye"
        actionHref="/admin/stories/new"
      />

      {stories.length === 0 ? (
        <EmptyState
          title="Henüz hikaye eklenmemiş"
          description="Otel, kafile ve kampanya videolarınızı ekleyerek başlayın."
          actionLabel="Yeni Hikaye"
          actionHref="/admin/stories/new"
        />
      ) : (
        <>
          {/* Sitedeki görünümün önizlemesi */}
          <AdminCard className="mb-6 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Ana sayfadaki görünüm</p>
            <div className="flex gap-5 overflow-x-auto pb-1">
              {stories.map((s) => (
                <div key={s.id} className={cn("flex w-[86px] shrink-0 flex-col items-center gap-1.5", !s.isPublished && "opacity-35")}>
                  <span className="rounded-full p-[3px]" style={{ background: STORY_RING }}>
                    <span className="block rounded-full bg-white p-[3px]">
                      <span className="block size-[70px] overflow-hidden rounded-full bg-brand-900">
                        <MediaThumb src={thumbOf(s)} badge={false} className="size-full" />
                      </span>
                    </span>
                  </span>
                  <span className="w-full truncate text-center text-xs font-medium text-brand-800">{s.title}</span>
                </div>
              ))}
            </div>
          </AdminCard>

          <div className="space-y-3">
            {stories.map((s, i) => {
              const videos = s.items.filter((it) => isVideoUrl(it.url)).length;
              return (
                <AdminCard key={s.id} className="flex flex-wrap items-center gap-4 p-4">
                  <span className="size-14 shrink-0 overflow-hidden rounded-full bg-brand-900 ring-2 ring-gold-300">
                    <MediaThumb src={thumbOf(s)} badge={false} className="size-full" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-900">{s.title}</p>
                    <p className="text-xs text-muted">
                      {videos} video · {s.items.length - videos} fotoğraf
                      {s.buttonLabel && <> · Buton: {s.buttonLabel}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderButtons action={moveStory} id={s.id} first={i === 0} last={i === stories.length - 1} />
                    <FlagToggle action={toggleStoryPublished} id={s.id} field="isPublished" value={s.isPublished} labels={{ on: "Yayında", off: "Gizli" }} />
                    <EditLink href={`/admin/stories/${s.id}/edit`} />
                    <DeleteButton action={deleteStory} id={s.id} label="Bu hikayeyi silmek istediğinize emin misiniz? Yüklenen dosyalar Medya'da kalır." />
                  </div>
                </AdminCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
