import { UserRound } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/team";

/** Ekip üyeleri kartları (Ekibimiz sayfası ve Hakkımızda bölümü) */
export function TeamGrid({ members, compact = false }: { members: TeamMember[]; compact?: boolean }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2", compact ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4")}>
      {members.map((m, i) => (
        <Reveal key={`${m.name}-${i}`} delay={i % 4}>
          <article className="group h-full overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card">
            <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950">
              {m.photo ? (
                <SmartImage
                  src={m.photo}
                  alt={m.name}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center text-cream-100/40">
                  <UserRound className="size-20" strokeWidth={1.2} />
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-950/60 to-transparent" />
            </div>
            <div className="p-5">
              <h3 className="font-serif text-lg font-bold text-brand-900">{m.name}</h3>
              {m.role && <p className="mt-0.5 text-sm font-semibold text-gold-600">{m.role}</p>}
              {!compact && m.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{m.bio}</p>}
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
