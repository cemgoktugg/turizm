"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LEAD_STATUSES } from "@/lib/validations";
import { updateLeadStatus } from "@/app/actions/leads";

export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    start(async () => {
      const res = await updateLeadStatus(id, next);
      if (res.ok) {
        toast.success("Durum güncellendi.");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
