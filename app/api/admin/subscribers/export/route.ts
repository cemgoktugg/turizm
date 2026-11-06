import { getCurrentUser } from "@/lib/auth";
import { canManageSite } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { buildSubscriberWhere } from "@/lib/subscriber-query";
import { formatContact } from "@/lib/subscribers";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Excel formül enjeksiyonunu önle
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Kampanya abonelerini (panelde uygulanan filtrelerle) CSV olarak indirir */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });
  if (!canManageSite(user.role)) return new Response("Yetkisiz", { status: 403 });

  const { searchParams } = new URL(req.url);
  const subscribers = await prisma.subscriber.findMany({
    where: buildSubscriberWhere({ tur: searchParams.get("tur") ?? undefined, q: searchParams.get("q") ?? undefined }),
    orderBy: { createdAt: "desc" },
  });

  const header = ["Kayıt Tarihi", "Tür", "Telefon / E-posta", "Ad", "Kayıt Sayfası"];
  const rows = subscribers.map((s) => [
    s.createdAt.toLocaleString("tr-TR"),
    s.type === "phone" ? "Telefon" : "E-posta",
    formatContact(s.type, s.contact, true),
    s.fullName,
    s.source,
  ]);

  // Excel'in Türkçe karakterleri doğru okuması için BOM + noktalı virgül ayırıcı
  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aboneler-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
