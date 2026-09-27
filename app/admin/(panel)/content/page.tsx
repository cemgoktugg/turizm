import Link from "next/link";
import { ChevronRight, ExternalLink, PencilLine } from "lucide-react";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { getContentStatus } from "@/lib/content";
import { CONTENT_BLOCKS, CONTENT_GROUPS, CONTENT_KEYS, type ContentGroup } from "@/lib/content/registry";

export const metadata = { title: "Sayfa İçerikleri" };

export default async function ContentIndexPage() {
  const status = await getContentStatus();
  const groups = Object.entries(CONTENT_GROUPS) as [ContentGroup, string][];

  return (
    <div>
      <AdminPageHeader
        title="Sayfa İçerikleri"
        description="Sitedeki tüm metinler, başlıklar, görseller ve bölümler. Düzenlediğiniz içerik kaydettiğiniz anda sitede yayınlanır."
      />

      <div className="space-y-8">
        {groups.map(([group, label]) => {
          const keys = CONTENT_KEYS.filter((k) => CONTENT_BLOCKS[k].group === group);
          return (
            <section key={group}>
              <h3 className="mb-3 font-serif text-lg font-bold text-brand-900">{label}</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {keys.map((key) => {
                  const block = CONTENT_BLOCKS[key];
                  const updated = status[key];
                  return (
                    <AdminCard key={key} className="group flex flex-col p-4 transition hover:border-brand-300 hover:shadow-card">
                      <Link href={`/admin/content/${key}`} className="flex flex-1 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white">
                          <PencilLine className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-brand-900">{block.title}</span>
                            <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5" />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">{block.description}</span>
                        </span>
                      </Link>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        {updated ? (
                          <Badge variant="green" size="sm">
                            Düzenlendi · {updated.toLocaleDateString("tr-TR")}
                          </Badge>
                        ) : (
                          <Badge variant="slate" size="sm">
                            Varsayılan içerik
                          </Badge>
                        )}
                        {block.path && (
                          <a href={block.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-gold-600">
                            <ExternalLink className="size-3.5" /> Sitede gör
                          </a>
                        )}
                      </div>
                    </AdminCard>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
