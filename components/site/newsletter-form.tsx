"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { subscribe } from "@/app/actions/subscribers";
import { track } from "@/lib/track";
import type { ContentData } from "@/lib/content/registry";

type Texts = ContentData<"shared.newsletter">;

const input =
  "h-12 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-cream-200/50 transition focus:border-gold-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold-400/30";

/** Footer'daki kampanya / duyuru kayıt kutusu */
export function NewsletterForm({ texts, consentText }: { texts: Texts; consentText: string }) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await subscribe({
        contact: String(form.get("contact") ?? ""),
        fullName: String(form.get("fullName") ?? "") || undefined,
        consent: form.get("consent") === "on",
        source: pathname,
        website: String(form.get("website") ?? ""),
      });
      if (res.ok) {
        setDone(res.message);
        track("signup");
      } else {
        const fieldMsg = res.fieldErrors?.contact ?? res.fieldErrors?.consent;
        setError({ message: fieldMsg ?? res.message, field: res.fieldErrors?.contact ? "contact" : res.fieldErrors?.consent ? "consent" : undefined });
      }
    });
  }

  return (
    <div className="grid items-center gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-brand-900/80 to-brand-950 p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold-400/15 text-gold-300">
          <BellRing className="size-6" />
        </span>
        <div>
          <h3 className="font-serif text-xl font-bold text-white sm:text-2xl">{texts.title}</h3>
          {texts.text && <p className="mt-1.5 text-sm leading-relaxed text-cream-200/70">{texts.text}</p>}
        </div>
      </div>

      {done ? (
        <p role="status" className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 text-sm font-semibold text-cream-100">
          <CheckCircle2 className="size-5 shrink-0 text-gold-300" /> {done}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className="sr-only">{texts.contactPlaceholder}</span>
              <input
                name="contact"
                required
                maxLength={120}
                autoComplete="tel"
                placeholder={texts.contactPlaceholder}
                aria-invalid={error?.field === "contact"}
                className={input}
              />
            </label>
            <label className="min-w-0">
              <span className="sr-only">{texts.namePlaceholder}</span>
              <input name="fullName" maxLength={80} autoComplete="name" placeholder={texts.namePlaceholder} className={input} />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold-400 px-7 text-sm font-semibold text-brand-950 shadow-gold transition hover:bg-gold-300 disabled:opacity-70"
            >
              {pending && <Loader2 className="size-4 animate-spin" />} {texts.button}
            </button>
          </div>
          {/* Honeypot */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-cream-200/60">
            <input
              type="checkbox"
              name="consent"
              required
              aria-invalid={error?.field === "consent"}
              className="mt-0.5 size-4 shrink-0 accent-gold-400"
            />
            <span>
              {consentText}{" "}
              {texts.consentLinkLabel && (
                <Link href="/kvkk" className="font-semibold text-gold-300 underline-offset-2 hover:underline">
                  {texts.consentLinkLabel}
                </Link>
              )}
            </span>
          </label>
          {error && (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-300">
              {error.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
