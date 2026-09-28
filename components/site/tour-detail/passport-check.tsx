"use client";

import { useId, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { fill } from "@/lib/content/template";

/** Pasaportun gidiş tarihinden itibaren yeterli süre geçerli olup olmadığını kontrol eder */
export function PassportCheck({
  departureDate,
  months,
  labels,
}: {
  /** "YYYY-MM-DD" */
  departureDate: string | null;
  months: number;
  labels: { passportTitle: string; passportText: string; passportLabel: string; passportOk: string; passportFail: string };
}) {
  const id = useId();
  const [value, setValue] = useState("");

  let required: Date | null = null;
  if (departureDate) {
    required = new Date(`${departureDate}T00:00:00`);
    required.setMonth(required.getMonth() + months);
  }
  const expiry = value ? new Date(`${value}T00:00:00`) : null;
  const ok = required && expiry && !Number.isNaN(expiry.getTime()) ? expiry >= required : null;
  const requiredText = required?.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) ?? "";

  return (
    <div className="flex gap-3 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <ShieldCheck className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-brand-900">{labels.passportTitle}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{labels.passportText}</p>
        {required && (
          <>
            <label htmlFor={id} className="mt-3 block text-xs font-semibold text-brand-800">
              {labels.passportLabel}
            </label>
            <input
              id={id}
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {ok === true && (
              <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-green-700">
                <CheckCircle2 className="size-4 shrink-0" /> {labels.passportOk}
              </p>
            )}
            {ok === false && (
              <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-red-600">
                <XCircle className="size-4 shrink-0" /> {fill(labels.passportFail, { tarih: requiredText })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
