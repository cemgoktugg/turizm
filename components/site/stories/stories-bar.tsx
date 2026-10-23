"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Play } from "lucide-react";
import { MediaThumb } from "@/components/ui/media-thumb";
import { STORY_RING, STORY_RING_SEEN } from "@/lib/brand";
import { StoryViewer, type StoryLabels, type StoryView } from "./story-viewer";

/* Görülen hikayeler tarayıcıda (localStorage) saklanır */
const SEEN_KEY = "rh-stories-seen";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

const getServerSnapshot = () => "[]";

function parseSeen(raw: string): string[] {
  try {
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Slider altındaki Instagram hikayesi tarzı yuvarlaklar */
export function StoriesBar({ stories, title, labels }: { stories: StoryView[]; title: string; labels: StoryLabels }) {
  const [open, setOpen] = useState<number | null>(null);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const seen = useMemo(() => parseSeen(raw), [raw]);

  const markSeen = useCallback((key: string) => {
    const prev = parseSeen(getSnapshot());
    if (prev.includes(key)) return;
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...prev, key].slice(-200)));
    } catch {
      /* gizli sekme vb. */
    }
    listeners.forEach((l) => l());
  }, []);

  const close = useCallback(() => setOpen(null), []);

  if (!stories.length) return null;

  return (
    <section aria-label={title || "Hikayeler"} className="border-b border-border bg-white">
      <div className="container-tr py-5">
        {title && <p className="mb-3 text-center font-serif text-lg font-bold text-brand-900">{title}</p>}
        <div className="-mx-5 overflow-x-auto [scrollbar-width:none] sm:mx-0">
          <ul className="mx-auto flex w-max gap-3 px-5 sm:gap-5 sm:px-0">
            {stories.map((s, i) => {
              const isSeen = seen.includes(s.seenKey);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="group flex w-[78px] flex-col items-center gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:w-[92px]"
                    aria-label={s.title}
                  >
                    <span
                      className="relative rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105"
                      style={{ background: isSeen ? STORY_RING_SEEN : STORY_RING }}
                    >
                      <span className="block rounded-full bg-white p-[3px]">
                        <span className="block size-[64px] overflow-hidden rounded-full bg-brand-900 sm:size-[78px]">
                          <MediaThumb src={s.thumb} alt="" badge={false} className="size-full" />
                        </span>
                      </span>
                      {s.items[0]?.isVideo && (
                        <span className="absolute bottom-0 right-0 grid size-6 place-items-center rounded-full border-2 border-white bg-brand-800 text-white">
                          <Play className="ml-px size-3 fill-current" />
                        </span>
                      )}
                    </span>
                    <span className="w-full truncate text-center text-xs font-medium text-brand-800">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {open !== null && <StoryViewer stories={stories} start={open} onClose={close} onSeen={markSeen} labels={labels} />}
    </section>
  );
}
