"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn, Lock, Mail } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/form-controls";

/** Yalnızca panel içi yollara yönlendir (açık yönlendirme saldırısını önler) */
function safeNext(value: string | null): string {
  if (value && value.startsWith("/admin") && !value.startsWith("//") && !value.startsWith("/admin/login")) return value;
  return "/admin";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const expired = params.has("expired");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const res = await loginAction(values);
    if (res.ok) {
      toast.success(res.message);
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } else {
      toast.error(res.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {expired && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Oturumunuz sona erdi veya şifreniz değiştirildi. Lütfen tekrar giriş yapın.
        </p>
      )}
      <Field label="E-posta" required error={errors.email?.message}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="pl-10" type="email" autoComplete="username" autoFocus placeholder="ornek@firma.com" {...register("email")} />
        </div>
      </Field>

      <Field label="Şifre" required error={errors.password?.message}>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-10 pr-11"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-brand-800"
            aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Giriş yapılıyor...
          </>
        ) : (
          <>
            <LogIn className="size-5" /> Giriş Yap
          </>
        )}
      </Button>
    </form>
  );
}
