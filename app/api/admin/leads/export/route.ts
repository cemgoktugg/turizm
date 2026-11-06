import { getCurrentUser } from "@/lib/auth";
import { canManageSite } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { buildLeadWhere } from "@/lib/leads";
import { LEAD_SOURCES, type LeadSource } from "@/lib/validations";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Excel formül enjeksiyonunu önle
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Başvuruları (panelde uygulanan filtrelerle) CSV olarak indirir */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });
  if (!canManageSite(user.role)) return new Response("Yetkisiz", { status: 403 });

  const { searchParams } = new URL(req.url);
  const leads = await prisma.lead.findMany({
    where: buildLeadWhere({ q: searchParams.get("q") ?? undefined, durum: searchParams.get("durum") ?? undefined }),
    orderBy: { createdAt: "desc" },
    include: { tour: { select: { title: true } } },
  });

  const header = ["Tarih", "Ad Soyad", "Telefon", "E-posta", "Kişi", "Tur", "Mesaj", "Kaynak", "Durum", "Not"];
  const rows = leads.map((l) => [
    l.createdAt.toLocaleString("tr-TR"),
    l.fullName,
    l.phone,
    l.email,
    l.personCount,
    l.tour?.title ?? l.tourTitle,
    l.message,
    l.source ? (LEAD_SOURCES[l.source as LeadSource] ?? l.source) : "",
    l.status,
    l.note,
  ]);

  // Excel'in Türkçe karakterleri doğru okuması için BOM + noktalı virgül ayırıcı
  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="basvurular-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
