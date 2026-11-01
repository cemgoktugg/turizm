import "server-only";
import { prisma } from "./prisma";

/** Hangi kayıtta ne yapıldığı. entityId verilmezse kayda bağlantı kurulmaz (ör. silinen kayıt) */
export type AuditEntry = { entity?: string; entityId?: string | number; detail: string };

/** İşlem geçmişine yazar. Kayıt yazılamazsa asıl işlem geri alınamayacağından hata yalnızca loglanır. */
export async function recordActivity(user: { id: string; name: string }, entry: AuditEntry) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        entity: entry.entity ?? null,
        entityId: entry.entityId == null ? null : String(entry.entityId),
        detail: entry.detail,
      },
    });
  } catch (e) {
    console.error("[işlem-geçmişi]", e);
  }
}

/** Tek kaydın işlem geçmişi (en yeni önce) */
export function getActivityFor(entity: string, entityId: string | number) {
  return prisma.activityLog.findMany({
    where: { entity, entityId: String(entityId) },
    orderBy: { id: "desc" },
  });
}

/** İşlem geçmişi satırından kaydın panel sayfasına bağlantı */
export function activityHref(entity: string | null, entityId: string | null) {
  if (!entity || !entityId) return null;
  const base: Record<string, string> = {
    Sale: "/admin/satis",
    Customer: "/admin/satis/musteriler",
    ServiceTour: "/admin/satis/turlar",
    Staff: "/admin/satis/gorevliler",
  };
  return base[entity] ? `${base[entity]}/${entityId}` : null;
}
