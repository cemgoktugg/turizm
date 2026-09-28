import { cn } from "@/lib/utils";

/** Bilinen havayolları için IATA kodu ve renk; bilinmeyenlerde baş harfler */
const AIRLINES: { match: RegExp; code: string; className: string }[] = [
  { match: /türk hava|turkish|thy/i, code: "TK", className: "bg-[#c70a0c] text-white" },
  { match: /saudi|suud/i, code: "SV", className: "bg-[#0a7a3d] text-white" },
  { match: /pegasus/i, code: "PC", className: "bg-[#fdb913] text-[#1d1d1b]" },
  { match: /ajet|anadolujet/i, code: "VF", className: "bg-[#12284c] text-white" },
  { match: /flynas|nas air/i, code: "XY", className: "bg-[#6c2c91] text-white" },
  { match: /flyadeal/i, code: "F3", className: "bg-[#b5d334] text-[#1d1d1b]" },
];

function resolve(name: string) {
  const hit = AIRLINES.find((a) => a.match.test(name));
  if (hit) return hit;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr"))
    .join("");
  return { code: initials || "✈", className: "bg-brand-700 text-white" };
}

export function AirlineMark({ name, withName, className }: { name: string; withName?: boolean; className?: string }) {
  const a = resolve(name);
  return (
    <span className={cn("inline-flex items-center gap-2", className)} title={name}>
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold tracking-tight", a.className)}>
        {a.code}
      </span>
      {withName && <span className="text-xs font-semibold text-brand-800">{name}</span>}
    </span>
  );
}
