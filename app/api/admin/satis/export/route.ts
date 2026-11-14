import { getCurrentUser } from "@/lib/auth";
import { REPORT_BUILDERS, isMoneyCell, isReportName, type Cell } from "@/lib/sales-reports";

function csvCell(value: Cell): string {
  // Tutarlar Excel'de toplanabilsin diye düz sayı olarak yazılır
  const raw = isMoneyCell(value) ? value.amount : value;
  const s = raw == null ? "" : String(raw);
  // Excel formül enjeksiyonunu önle
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Satış listesi ve raporları (paneldeki süzgeçlerle) CSV olarak indirir */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });

  const { searchParams } = new URL(req.url);
  const rapor = searchParams.get("rapor");
  if (!isReportName(rapor)) return new Response("Geçersiz rapor", { status: 400 });

  const get = (k: string) => searchParams.get(k) ?? undefined;
  const table = await REPORT_BUILDERS[rapor]({ donem: get("donem"), tur: get("tur"), q: get("q"), bas: get("bas"), bit: get("bit"), durum: get("durum"), personel: get("personel"), referans: get("referans") });

  // Tutar sütunlarının yanına para birimi sütunu eklenir (karışık para birimli listeler için; raporda zaten yoksa)
  const hasMoney =
    !table.columns.some((c) => c.label === "Para Birimi") && table.rows.some((r) => r.cells.some(isMoneyCell));
  const header = [...table.columns.map((c) => c.label), ...(hasMoney ? ["Para Birimi"] : [])];
  const rows = table.rows.map((r) => {
    const cur = r.cells.find(isMoneyCell)?.currency ?? "";
    return [...r.cells.map(csvCell), ...(hasMoney ? [csvCell(cur)] : [])];
  });

  // Excel'in Türkçe karakterleri doğru okuması için BOM + noktalı virgül ayırıcı
  const csv = "﻿" + [header.map(csvCell), ...rows].map((r) => r.join(";")).join("\r\n");
  const name = rapor === "satislar" ? "satislar" : `rapor-${rapor}`;
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
