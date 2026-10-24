"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { z } from "zod";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { createReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import type { ContentData } from "@/lib/content/registry";

type FormIn = z.input<typeof reviewSchema>;
export type ReviewLabels = ContentData<"ui.tours">["reviews"];

export function ReviewForm({ tourId, labels }: { tourId: string; labels: ReviewLabels }) {
  const [done, setDone] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { tourId, title: "", rating: "", comment: "", fullName: "", email: "", website: "" },
  });

  async function onSubmit(values: ReviewInput) {
    const res = await createReview(values);
    if (res.ok) {
      setDone(true);
      reset();
    } else {
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(field as keyof FormIn, { message });
      }
      toast.error(res.message);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-brand-600" />
        <p className="mt-3 font-serif text-xl font-bold text-brand-900">{labels.successTitle}</p>
        <p className="mt-1 text-sm text-muted">{labels.successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl border border-border bg-cream-50 p-5 sm:p-7">
      <p className="font-serif text-xl font-bold text-brand-900">{labels.formTitle}</p>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register("website")}
      />

      <Field label={labels.titleLabel} error={errors.title?.message}>
        <Input placeholder={labels.titlePlaceholder} {...register("title")} />
      </Field>

      <Field label={labels.ratingLabel} required error={errors.rating?.message}>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <StarInput value={Number(field.value) || 0} onChange={(v) => field.onChange(String(v))} />}
        />
      </Field>

      <Field label={labels.commentLabel} required error={errors.comment?.message}>
        <Textarea rows={4} placeholder={labels.commentPlaceholder} {...register("comment")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.nameLabel} required error={errors.fullName?.message}>
          <Input placeholder={labels.namePlaceholder} autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label={labels.emailLabel} required error={errors.email?.message}>
          <Input placeholder="ornek@eposta.com" inputMode="email" autoComplete="email" {...register("email")} />
          {labels.emailHelp && <p className="mt-1 text-xs text-muted">{labels.emailHelp}</p>}
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {labels.submit}
        </Button>
        {labels.kvkkNote && (
          <Link href="/kvkk" target="_blank" className="text-xs text-muted underline underline-offset-2 hover:text-brand-700">
            {labels.kvkkNote}
          </Link>
        )}
      </div>
    </form>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`5 üzerinden ${n}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star className={cn("size-8 transition", n <= shown ? "fill-gold-400 text-gold-400" : "fill-slate-200 text-slate-200")} />
        </button>
      ))}
    </div>
  );
}
