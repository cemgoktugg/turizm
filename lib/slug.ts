import { prisma } from "./prisma";
import { toSlug } from "./utils";

type SluggableModel = "tour" | "hotel" | "blogPost" | "tourCategory" | "landingPage";

/** Benzersiz slug üretir; çakışma varsa sonuna -2, -3 ekler */
export async function uniqueSlug(
  model: SluggableModel,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = toSlug(base) || "kayit";
  let candidate = root;
  let i = 1;

  for (;;) {
    // @ts-expect-error dinamik model erişimi
    const existing = await prisma[model].findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
    i += 1;
    candidate = `${root}-${i}`;
  }
}
