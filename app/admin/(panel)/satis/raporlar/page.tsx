import Link from "next/link";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";
import { DateInput, FilterBar, StatBox, th, td, num, theadRow, qs } from "@/components/admin/sales/ui";
import { getPeriods, money, REPORTS, type ReportKey } from "@/lib/sales";
import { REPORT_BUILDERS, isMoneyCell, type Cell } from "@/lib/sales-reports";
import { cn } from "@/lib/utils";

export const metadata = { title: "Satış Raporları" };

function cellText(c: Cell) {
  if (isMoneyCell(c)) return money(c.amount, c.currency);
  return c == null || c === "" ? "" : String(c);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ rapor?: string; donem?: string; bas?: string; bit?: string }>;
}) {
  const sp = await searchParams;
  const rapor: ReportKey = sp.rapor && Object.hasOwn(REPORTS, sp.rapor) ? (sp.rapor as ReportKey) : "ozet";
  const donem = sp.donem ?? "";
  // Tahsilat listesi varsayılan olarak bu ayın başından bugüne
  const today = new Date();
  const bas = rapor === "tahsilat" ? (sp.bas ?? new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString("sv-SE")) : "";
  const bit = rapor === "tahsilat" ? (sp.bit ?? today.toLocaleDateString("sv-SE")) : "";

  const [periods, table] = await Promise.all([getPeriods(), REPORT_BUILDERS[rapor]({ donem, bas, bit })]);
  const params = { donem, bas, bit };

  return (
    <div>
      <AdminPageHeader title="Raporlar" description="Dönem bazında ciro, tahsilat ve alacak durumu. Listeler Excel'e aktarılabilir." />

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(REPORTS) as ReportKey[]).map((key) => (
          <Link
            key={key}
            href={`/admin/satis/raporlar${qs({ rapor: key, donem })}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
              rapor === key ? "border-brand-700 bg-brand-700 text-white" : "border-border bg-white text-brand-800 hover:border-brand-300",
            )}
          >
            {REPORTS[key]}
          </Link>
        ))}
      </div>

      <FilterBar
        action="/admin/satis/raporlar"
        periods={periods}
        donem={donem}
        hidden={{ rapor }}
        exportHref={`/api/admin/satis/export${qs({ rapor, ...params })}`}
      >
        {rapor === "tahsilat" && (
          <>
            <DateInput name="bas" value={bas} label="Başlangıç tarihi" />
            <DateInput name="bit" value={bit} label="Bitiş tarihi" />
          </>
        )}
      </FilterBar>

      {table.summary && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {table.summary.map((s) => (
            <StatBox key={s.label} label={s.label} value={s.value} tone={s.tone} />
          ))}
        </div>
      )}

      {table.rows.length === 0 ? (
        <EmptyState title="Bu süzgeçle kayıt bulunamadı" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className={theadRow}>
                  {table.columns.map((c) => (
                    <th key={c.label} className={cn(th, c.align === "right" && num, c.align === "center" && "text-center")}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {table.rows.map((r, i) => (
                  <tr key={i} className={cn("hover:bg-cream-50/60", r.muted && "text-muted")}>
                    {r.cells.map((c, j) => {
                      const col = table.columns[j];
                      const text = cellText(c);
                      return (
                        <td key={j} className={cn(td, col.align === "right" && num, col.align === "center" && "text-center")}>
                          {j === 0 && r.href ? (
                            <Link href={r.href} className="font-semibold text-brand-800 hover:text-gold-600">
                              {text}
                            </Link>
                          ) : (
                            text
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {table.footer && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-cream-50 font-bold text-brand-900">
                    {table.footer.map((f, j) => (
                      <td key={j} className={cn(td, table.columns[j]?.align === "right" && num, table.columns[j]?.align === "center" && "text-center")}>
                        {f}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
