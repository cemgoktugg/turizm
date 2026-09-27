"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Route, FileText, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQAccordion, type FaqItem } from "./faq-accordion";

type DayProgram = { dayNumber: number; title: string; description: string };

export function TourDetailTabs({
  program,
  included,
  excluded,
  documents,
  faqs,
}: {
  program: DayProgram[];
  included: string[];
  excluded: string[];
  documents: string[];
  faqs: FaqItem[];
}) {
  const tabs = [
    { id: "program", label: "Gün Gün Program", icon: Route, show: program.length > 0 },
    { id: "services", label: "Hizmetler", icon: Check, show: included.length > 0 || excluded.length > 0 },
    { id: "docs", label: "Gerekli Evraklar", icon: FileText, show: documents.length > 0 },
    { id: "faq", label: "Sık Sorulan Sorular", icon: HelpCircle, show: faqs.length > 0 },
  ].filter((t) => t.show);

  const [active, setActive] = useState(tabs[0]?.id ?? "program");

  if (!tabs.length) return null;

  return (
    <div>
      {/* Sekme başlıkları */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
                isActive ? "text-brand-800" : "text-muted hover:text-brand-700",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gold-400"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sekme içeriği */}
      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {active === "program" && <ProgramTab program={program} />}
            {active === "services" && (
              <ServicesTab included={included} excluded={excluded} />
            )}
            {active === "docs" && <DocsTab documents={documents} />}
            {active === "faq" && <FAQAccordion items={faqs} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgramTab({ program }: { program: DayProgram[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-dashed border-brand-200 pl-8">
      {program.map((d) => (
        <li key={d.dayNumber} className="relative">
          <span className="absolute -left-[41px] grid size-8 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white shadow-soft">
            {d.dayNumber}
          </span>
          <h4 className="font-serif text-lg font-bold text-brand-900">{d.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-muted">{d.description}</p>
        </li>
      ))}
    </ol>
  );
}

function ServicesTab({
  included,
  excluded,
}: {
  included: string[];
  excluded: string[];
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h4 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-brand-800">
          <span className="grid size-7 place-items-center rounded-full bg-brand-100">
            <Check className="size-4 text-brand-700" />
          </span>
          Fiyata Dâhil Olanlar
        </h4>
        <ul className="space-y-2.5">
          {included.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-brand-800">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-brand-800">
          <span className="grid size-7 place-items-center rounded-full bg-red-100">
            <X className="size-4 text-red-600" />
          </span>
          Fiyata Dâhil Olmayanlar
        </h4>
        <ul className="space-y-2.5">
          {excluded.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
              <X className="mt-0.5 size-4 shrink-0 text-red-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DocsTab({ documents }: { documents: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {documents.map((d, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-2xl border border-border bg-cream-50 p-4 text-sm text-brand-800"
        >
          <FileText className="mt-0.5 size-5 shrink-0 text-gold-500" />
          {d}
        </li>
      ))}
    </ul>
  );
}
