"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { z } from "zod";
import { leadSchema, type LeadInput } from "@/lib/validations";
import { createLead } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/form-controls";

type TourOption = { id: string; title: string };

export function BookingForm({
  tourId,
  tourTitle,
  tourOptions,
  variant = "card",
}: {
  tourId?: string;
  tourTitle?: string;
  tourOptions?: TourOption[];
  variant?: "card" | "bare";
}) {
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof leadSchema>, unknown, LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      tourId: tourId ?? "",
      tourTitle: tourTitle ?? "",
      personCount: 1,
      website: "",
    },
  });

  async function onSubmit(values: LeadInput) {
    const res = await createLead(values);
    if (res.ok) {
      setDone(true);
      reset();
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-600 text-white">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="mt-4 font-serif text-xl font-bold text-brand-900">
          Başvurunuz Alındı
        </h3>
        <p className="mt-2 text-sm text-muted">
          Talebiniz bize ulaştı. Danışmanlarımız en kısa sürede sizinle iletişime geçecek.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setDone(false)}>
          Yeni Başvuru
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
        <Field label="Ad Soyad" required error={errors.fullName?.message}>
          <Input placeholder="Adınız ve soyadınız" {...register("fullName")} />
        </Field>
        <Field label="Telefon" required error={errors.phone?.message}>
          <Input placeholder="05xx xxx xx xx" inputMode="tel" {...register("phone")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-posta" error={errors.email?.message}>
          <Input placeholder="ornek@eposta.com" inputMode="email" {...register("email")} />
        </Field>
        <Field label="Kişi Sayısı" error={errors.personCount?.message}>
          <Input type="number" min={1} max={50} {...register("personCount")} />
        </Field>
      </div>

      {tourOptions && tourOptions.length > 0 ? (
        <Field label="İlgilendiğiniz Program" error={errors.tourId?.message}>
          <select
            className="w-full appearance-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            {...register("tourId")}
          >
            <option value="">Genel bilgi / Kararsızım</option>
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
            <span className="text-muted">İlgilendiğiniz program: </span>
            <span className="font-semibold text-brand-900">{tourTitle}</span>
          </div>
        )
      )}

      <Field label="Mesajınız" error={errors.message?.message}>
        <Textarea
          placeholder="Tarih tercihleriniz, sorularınız veya özel talepleriniz..."
          {...register("message")}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Gönderiliyor...
          </>
        ) : (
          <>
            <Send className="size-5" /> Başvuruyu Gönder
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted">
        Formu göndererek bilgilerinizin başvurunuz kapsamında işlenmesini kabul edersiniz.
      </p>
    </form>
  );

  if (variant === "bare") return inner;

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
      {inner}
    </div>
  );
}
