import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "@/components/admin/login-form";
import { SmartImage } from "@/components/ui/smart-image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yönetim Paneli Girişi",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Oturum tamamen geçerliyse (imza + kullanıcı + şifre sürümü) doğrudan panele
  if (await getCurrentUser()) redirect("/admin");
  const settings = await getSettings();

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-950 p-4">
      <SmartImage src="/images/cta-bg.svg" alt="" className="absolute inset-0 size-full opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 to-brand-900/60" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="sr-only">{settings.siteName}</h1>
          <SmartImage
            src={settings.logoLight || settings.logo}
            alt={settings.siteName}
            loading="eager"
            className="mx-auto h-16 w-auto object-contain"
          />
          <p className="mt-3 text-sm text-cream-200/70">Yönetim Paneli Girişi</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-card">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-cream-100" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-cream-200/50">
          <Link href="/" className="hover:text-gold-300">
            ← Siteye dön
          </Link>
        </p>
      </div>
    </div>
  );
}
