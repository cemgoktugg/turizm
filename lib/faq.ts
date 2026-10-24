import { fill } from "./content/template";
import { toSlug } from "./utils";
import type { ContentData } from "./content/registry";

export type FaqGroup = { id: string; title: string; items: { question: string; answer: string }[] };

/**
 * SSS içerik bloğunu siteye hazırlar: boş sorular atılır, {marka}, {adres}…
 * yer tutucuları doldurulur, her gruba sayfa içi bağlantı kimliği verilir.
 */
export function prepareFaqGroups(
  groups: ContentData<"page.sss">["groups"],
  vars: Record<string, string>,
): FaqGroup[] {
  const used = new Set<string>();
  return groups
    .map((g, i) => {
      let id = toSlug(g.title) || `grup-${i + 1}`;
      while (used.has(id)) id = `${id}-${i + 1}`;
      used.add(id);
      return {
        id,
        title: fill(g.title, vars),
        items: g.items
          .filter((it) => it.question.trim() && it.answer.trim())
          .map((it) => ({ question: fill(it.question, vars), answer: fill(it.answer, vars) })),
      };
    })
    .filter((g) => g.items.length > 0);
}
