"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import type { PeriodTours } from "@/lib/sales";

/** Seçenek değeri: "" (tümü), "d:<dönem>" veya "t:<tur no>" */
function parse(value: string, groups: PeriodTours[]) {
  if (value.startsWith("t:")) {
    const id = Number(value.slice(2));
    const group = groups.find((g) => g.tours.some((t) => t.id === id));
    return { donem: group?.period ?? "", tur: String(id) };
  }
  if (value.startsWith("d:")) return { donem: value.slice(2), tur: "" };
  return { donem: "", tur: "" };
}

/**
 * Satış listesindeki dönem seçimi: her dönemin altında o dönemin turları sıralanır.
 * Dönem seçilirse dönemin bütün satışları, tur seçilirse yalnızca o turun satışları listelenir;
 * seçim yapılınca liste hemen yenilenir (formdaki diğer süzgeçler korunur).
 */
export function PeriodTourSelect({ groups, donem, tur, className }: { groups: PeriodTours[]; donem: string; tur: string; className?: string }) {
  const [value, setValue] = useState(tur ? `t:${tur}` : donem ? `d:${donem}` : "");
  const picked = parse(value, groups);

  return (
    <>
      {/* Boş değerler adrese yazılmasın diye devre dışı bırakılır */}
      <input type="hidden" name="donem" value={picked.donem} disabled={!picked.donem} />
      <input type="hidden" name="tur" value={picked.tur} disabled={!picked.tur} />
      <select
        value={value}
        aria-label="Dönem / tur"
        title="Dönem veya tur seçin"
        className={className}
        onChange={(e) => {
          const form = e.currentTarget.form;
          // Gizli alanlar güncellensin, sonra liste yenilensin
          flushSync(() => setValue(e.target.value));
          form?.requestSubmit();
        }}
      >
        <option value="">Tüm dönemler ve turlar</option>
        {groups.map((g) => (
          <optgroup key={g.period} label={g.period}>
            <option value={`d:${g.period}`}>{`${g.period} · tüm turlar`}</option>
            {g.tours.map((t) => (
              <option key={t.id} value={`t:${t.id}`}>
                {`${t.name} · ${t.sold}${t.capacity != null ? `/${t.capacity}` : ""} kişi${t.isActive ? "" : " · pasif"}`}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </>
  );
}
