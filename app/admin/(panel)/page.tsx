import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Inbox,
  LayoutTemplate,
  Newspaper,
  Plane,
  Plus,
  Images,
  Receipt,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { activeTourWhere, startOfToday } from "@/lib/queries";
import { AdminCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateRange } from "@/lib/utils";
import { LEAD_STATUS_STYLES } from "@/lib/lead-status";
import { moneyList, totalReceivable } from "@/lib/sales";

export const metadata = { title: "Kontrol Paneli" };

export default async function AdminDashboard() {
  const today = startOfToday();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    user,
    settings,
    totalTours,
    activeTours,
    draftTours,
    pastPublished,
    pastFeatured,
    noCover,
    hotels,
    posts,
    newLeads,
    monthLeads,
    recentLeads,
    upcoming,
    emptyCategories,
    receivable,
  ] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    prisma.tour.count(),
    prisma.tour.count({ where: activeTourWhere() }),
    prisma.tour.count({ where: { isPublished: false } }),
    prisma.tour.count({ where: { isPublished: true, departureDate: { lt: today } } }),
    prisma.tour.findMany({
      where: { isPublished: true, isFeatured: true, departureDate: { lt: today } },
      select: { id: true, title: true },
    }),
    prisma.tour.findMany({ where: { isPublished: true, coverImage: null }, select: { id: true, title: true } }),
    prisma.hotel.count({ where: { isPublished: true } }),
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.lead.count({ where: { status: "Yeni" } }),
    prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { tour: { select: { title: true } } } }),
    prisma.tour.findMany({
      where: activeTourWhere({ departureDate: { gte: today } }),
      orderBy: { departureDate: "asc" },
      take: 5,
      select: { id: true, title: true, departureDate: true, returnDate: true, _count: { select: { leads: true } } },
    }),
    prisma.tourCategory.findMany({
      where: { tours: { none: activeTourWhere() } },
      select: { name: true },
    }),
    totalReceivable(),
  ]);

  const stats = [
    { label: "Sitede listelenen tur", value: activeTours, sub: `${totalTours} toplam · ${draftTours} taslak`, icon: Plane, href: "/admin/tours", color: "bg-brand-50 text-brand-700" },
    { label: "Yeni başvuru", value: newLeads, sub: `Bu ay ${monthLeads} başvuru`, icon: Inbox, href: "/admin/leads?durum=Yeni", color: "bg-red-50 text-red-600" },
    { label: "Yayındaki otel", value: hotels, icon: Building2, href: "/admin/hotels", color: "bg-gold-100 text-gold-700" },
    { label: "Yayındaki yazı", value: posts, icon: Newspaper, href: "/admin/blog", color: "bg-navy-100 text-navy-700" },
    { label: "Kalan alacak", value: moneyList(receivable), icon: Receipt, href: "/admin/satis/raporlar?rapor=borclu", color: "bg-green-50 text-green-700" },
  ];

  type Warning = { text: string; href: string; action: string };
  const warnings: Warning[] = [];
  if (user?.mustChangePassword)
    warnings.push({ text: "Hesabınız ilk verilen şifreyle kullanılıyor.", href: "/admin/profile", action: "Şifreyi değiştir" });
  for (const t of pastFeatured)
    warnings.push({ text: `"${t.title}" turunun tarihi geçti ama 'Öne Çıkan' işaretli (ana sayfada görünmez).`, href: `/admin/tours/${t.id}/edit`, action: "Düzenle" });
  if (pastPublished > 0)
    warnings.push({
      text: `${pastPublished} turun tarihi geçti; sitedeki listelerden otomatik kaldırıldı. Yeni tarihlerle kopyalayabilirsiniz.`,
      href: "/admin/tours?filtre=gecmis",
      action: "Görüntüle",
    });
  for (const t of noCover)
    warnings.push({ text: `"${t.title}" turunun kapak görseli yok.`, href: `/admin/tours/${t.id}/edit`, action: "Görsel ekle" });
  if (emptyCategories.length)
    warnings.push({
      text: `Şu kategorilerde sitede listelenen tur yok: ${emptyCategories.map((c) => c.name).join(", ")}.`,
      href: "/admin/tours/new",
      action: "Tur ekle",
    });
  if (!settings.mapEmbed)
    warnings.push({ text: "İletişim sayfasında harita gösterilmiyor.", href: "/admin/settings", action: "Harita ekle" });
  if (settings.whatsapp === "905000000000")
    warnings.push({ text: "WhatsApp numarası örnek değerde duruyor.", href: "/admin/settings", action: "Güncelle" });

  const quickLinks = [
    { label: "Yeni Tur Ekle", href: "/admin/tours/new", icon: Plane },
    { label: "Görsel Yükle", href: "/admin/media", icon: Images },
    { label: "Sayfa İçeriklerini Düzenle", href: "/admin/content", icon: LayoutTemplate },
    { label: "Yeni Blog Yazısı", href: "/admin/blog/new", icon: Newspaper },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-900">Hoş geldiniz, {user?.name}</h2>
        <p className="mt-1 text-sm text-muted">Sitenizin genel durumu ve dikkat etmeniz gerekenler.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <AdminCard className="group h-full p-5 transition hover:shadow-card">
              <div className="flex items-start justify-between">
                <span className={`grid size-11 place-items-center rounded-xl ${s.color}`}>
                  <s.icon className="size-6" />
                </span>
                <ArrowUpRight className="size-4 text-muted transition group-hover:text-brand-700" />
              </div>
              <p className="mt-4 font-serif text-3xl font-bold text-brand-900">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
              {s.sub && <p className="mt-1 text-xs font-semibold text-brand-600">{s.sub}</p>}
            </AdminCard>
          </Link>
        ))}
      </div>

      {/* Uyarılar */}
      <AdminCard>
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          {warnings.length ? <AlertTriangle className="size-5 text-amber-500" /> : <CheckCircle2 className="size-5 text-green-600" />}
          <h3 className="font-serif text-lg font-bold text-brand-900">
            {warnings.length ? `Dikkat gerektirenler (${warnings.length})` : "Her şey yolunda"}
          </h3>
        </div>
        {warnings.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">Site ile panel arasında bekleyen bir sorun yok.</p>
        ) : (
          <ul className="divide-y divide-border">
            {warnings.map((w, i) => (
              <li key={i} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-brand-800">{w.text}</span>
                <Link href={w.href} className="shrink-0 text-sm font-semibold text-brand-700 hover:text-gold-600">
                  {w.action} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Son başvurular */}
        <AdminCard className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-serif text-lg font-bold text-brand-900">Son Başvurular</h3>
            <Link href="/admin/leads" className="text-sm font-semibold text-brand-700 hover:text-gold-600">
              Tümünü Gör
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">Henüz başvuru yok.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentLeads.map((lead) => (
                <Link key={lead.id} href={`/admin/leads?q=${encodeURIComponent(lead.phone)}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-cream-50">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-900">{lead.fullName}</p>
                    <p className="truncate text-xs text-muted">
                      {lead.phone}
                      {lead.tour?.title ? ` · ${lead.tour.title}` : lead.tourTitle ? ` · ${lead.tourTitle}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={LEAD_STATUS_STYLES[lead.status] ?? "slate"} size="sm">
                      {lead.status}
                    </Badge>
                    <span className="hidden text-xs text-muted sm:block">{formatDate(lead.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>

        <div className="space-y-6">
          {/* Yaklaşan kalkışlar */}
          <AdminCard>
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <CalendarDays className="size-5 text-gold-500" />
              <h3 className="font-serif text-lg font-bold text-brand-900">Yaklaşan Kalkışlar</h3>
            </div>
            {upcoming.length === 0 ? (
              <p className="p-5 text-sm text-muted">Tarihi belli yaklaşan tur yok.</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((t) => (
                  <li key={t.id}>
                    <Link href={`/admin/tours/${t.id}/edit`} className="block px-5 py-3 hover:bg-cream-50">
                      <p className="truncate text-sm font-semibold text-brand-900">{t.title}</p>
                      <p className="text-xs text-muted">
                        {formatDateRange(t.departureDate, t.returnDate)} · {t._count.leads} başvuru
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          {/* Hızlı işlemler */}
          <AdminCard className="p-5">
            <h3 className="font-serif text-lg font-bold text-brand-900">Hızlı İşlemler</h3>
            <div className="mt-4 space-y-2">
              {quickLinks.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <q.icon className="size-4" />
                  </span>
                  {q.label}
                  <Plus className="ml-auto size-4 text-muted" />
                </Link>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
