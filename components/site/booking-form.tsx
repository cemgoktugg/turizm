"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { z } from "zod";
import { leadSchema, type LeadInput, type LeadSource } from "@/lib/validations";
import { createLead } from "@/app/actions/leads";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";
import type { ContentData } from "@/lib/content/registry";

type TourOption = { id: string; title: string };

/** Form metinleri "Sayfa İçerikleri › Başvuru Formu" bloğundan gelir */
export type BookingTexts = Pick<
  ContentData<"shared.booking">,
  "form" | "submitLabel" | "consentText" | "consentLinkLabel" | "successTitle" | "successText"
>;

export function BookingForm({
  tourId,
  tourTitle,
  tourOptions,
  variant = "card",
  source,
  texts,
  defaultMessage,
}: {
  tourId?: string;
  tourTitle?: string;
  tourOptions?: TourOption[];
  variant?: "card" | "bare";
  source: LeadSource;
  texts: BookingTexts;
  /** Mesaj alanına önceden yazılacak metin (ör. grup teklifi) */
  defaultMessage?: string;
}) {
  const [done, setDone] = useState(false);
  const f = texts.form;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof leadSchema>, unknown, LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      tourId: tourId ?? "",
      tourTitle: tourTitle ?? "",
      personCount: "1",
      message: defaultMessage ?? "",
      source,
      website: "",
    },
  });

  async function onSubmit(values: LeadInput) {
    const res = await createLead(values);
    if (res.ok) {
      track("lead", { source, tour: tourTitle });
      setDone(true);
      reset();
      toast.success(res.message);
    } else {
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(field as keyof z.input<typeof leadSchema>, { message });
      }
      toast.error(res.message);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-600 text-white">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="mt-4 font-serif text-xl font-bold text-brand-900">{texts.successTitle}</h3>
        <p className="mt-2 text-sm text-muted">{texts.successText}</p>
        <Button variant="outline" className="mt-5" onClick={() => setDone(false)}>
          {f.newApplication}
        </Button>
      </div>
    );
  }

  const inner = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Honeypot — gizli */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register("website")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.fullName} required error={errors.fullName?.message}>
          <Input placeholder={f.fullNamePlaceholder} autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label={f.phone} required error={errors.phone?.message}>
          <Input placeholder={f.phonePlaceholder} inputMode="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.email} error={errors.email?.message}>
          <Input placeholder={f.emailPlaceholder} inputMode="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label={f.personCount} error={errors.personCount?.message as string | undefined}>
          <Input type="number" min={1} max={50} {...register("personCount")} />
        </Field>
      </div>

      {tourOptions && tourOptions.length > 0 ? (
        <Field label={f.program} error={errors.tourId?.message}>
          <select
            className="w-full appearance-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            {...register("tourId")}
          >
            <option value="">{f.programGeneral}</option>
            {tourOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        tourTitle && (
          <div className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm">
            <span className="text-muted">{f.programSelected} </span>
            <span className="font-semibold text-brand-900">{tourTitle}</span>
          </div>
        )
      )}

      <Field label={f.message} error={errors.message?.message}>
        <Textarea placeholder={f.messagePlaceholder} {...register("message")} />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" /> {f.sending}
          </>
        ) : (
          <>
            <Send className="size-5" /> {texts.submitLabel}
          </>
        )}
      </Button>
      {(texts.consentText || texts.consentLinkLabel) && (
        <p className="text-center text-xs text-muted">
          {texts.consentText}{" "}
          {texts.consentLinkLabel && (
            <Link href="/kvkk" target="_blank" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-gold-600">
              {texts.consentLinkLabel}
            </Link>
          )}
        </p>
      )}
    </form>
  );

  if (variant === "bare") return inner;

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
      {inner}
    </div>
  );
}
