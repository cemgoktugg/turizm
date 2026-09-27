import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { SmartImage } from "@/components/ui/smart-image";

export const metadata: Metadata = {
  title: "Admin Giriş",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-950 p-4">
      <SmartImage
        src="/images/cta-bg.svg"
        alt=""
        className="absolute inset-0 size-full opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 to-brand-900/60" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-16 place-items-center overflow-hidden rounded-2xl bg-white/10 backdrop-blur">
            <SmartImage src="/images/logo-mark.svg" alt="Logo" className="size-full" />
          </span>
          <h1 className="mt-4 font-serif text-2xl font-bold text-white">
            Rotamız Huzura
          </h1>
          <p className="mt-1 text-sm text-cream-200/70">Yönetim Paneli Girişi</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-card">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-cream-100" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-cream-200/50">
          Demo giriş: admin@turizm.com / admin123
        </p>
      </div>
    </div>
  );
}
