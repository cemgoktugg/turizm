"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, LogIn, Lock, Mail } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/form-controls";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@turizm.com", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const res = await loginAction(values);
    if (res.ok) {
      toast.success(res.message);
      const next = params.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } else {
      toast.error(res.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="E-posta" required error={errors.email?.message}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="pl-10" type="email" placeholder="admin@turizm.com" {...register("email")} />
        </div>
      </Field>

      <Field label="Şifre" required error={errors.password?.message}>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="pl-10" type="password" placeholder="••••••••" {...register("password")} />
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
