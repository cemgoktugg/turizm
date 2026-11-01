"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, Save, UserPlus } from "lucide-react";
import { changePassword, createUser, updateProfile } from "@/app/actions/account";
import {
  passwordChangeSchema,
  profileSchema,
  userCreateSchema,
  type PasswordChangeInput,
  type ProfileInput,
  type UserCreateInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { FormSection } from "./form-parts";

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} autoComplete="new-password" className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-brand-800"
        aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues });

  async function onSubmit(values: ProfileInput) {
    const res = await updateProfile(values);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      if (res.fieldErrors?.email) setError("email", { message: res.fieldErrors.email });
      toast.error(res.message);
    }
  }

  return (
    <FormSection title="Profil Bilgileri" description="Panelde görünen adınız ve giriş e-postanız.">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Ad Soyad" required error={errors.name?.message}>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field label="E-posta (giriş için)" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Profili Kaydet
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

export function PasswordForm({ mustChange }: { mustChange: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordChangeInput) {
    const res = await changePassword(values);
    if (res.ok) {
      toast.success(res.message);
      reset();
      router.refresh();
    } else {
      if (res.fieldErrors?.currentPassword) setError("currentPassword", { message: res.fieldErrors.currentPassword });
      toast.error(res.message);
    }
  }

  return (
    <FormSection
      title="Şifre Değiştir"
      description={
        mustChange
          ? "Hesabınız hâlâ ilk (varsayılan) şifreyle kullanılıyor. Güvenliğiniz için hemen yeni bir şifre belirleyin."
          : "En az 8 karakter; en az bir harf ve bir rakam içermeli. Değişiklikten sonra diğer cihazlardaki oturumlar kapanır."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3" noValidate>
        <Field label="Mevcut Şifre" required error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...register("currentPassword")} />
        </Field>
        <Field label="Yeni Şifre" required error={errors.newPassword?.message}>
          <PasswordInput {...register("newPassword")} />
        </Field>
        <Field label="Yeni Şifre (Tekrar)" required error={errors.confirmPassword?.message}>
          <PasswordInput {...register("confirmPassword")} />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" variant={mustChange ? "gold" : "primary"} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Şifreyi Değiştir
          </Button>
        </div>
      </form>
    </FormSection>
  );
}

export function NewUserForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: UserCreateInput) {
    const res = await createUser(values);
    if (res.ok) {
      toast.success(res.message);
      reset();
      router.refresh();
    } else {
      if (res.fieldErrors?.email) setError("email", { message: res.fieldErrors.email });
      toast.error(res.message);
    }
  }

  return (
    <FormSection title="Yeni Personel Ekle" description="Eklenen kişi ilk girişte şifresini değiştirmesi için uyarılır.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Ad Soyad" required error={errors.name?.message}>
          <Input {...register("name")} />
        </Field>
        <Field label="E-posta" required error={errors.email?.message}>
          <Input type="email" autoComplete="off" {...register("email")} />
        </Field>
        <Field label="Geçici Şifre" required error={errors.password?.message}>
          <PasswordInput {...register("password")} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Personel Ekle
        </Button>
      </form>
    </FormSection>
  );
}
