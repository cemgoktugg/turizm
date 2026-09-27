import Link from "next/link";
import {
  Plane,
  Building2,
  Newspaper,
  Inbox,
  Award,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { LEAD_STATUS_STYLES } from "@/lib/lead-status";

export const metadata = { title: "Kontrol Paneli" };

export default async function AdminDashboard() {
  const [tours, publishedTours, hotels, posts, leadsTotal, newLeads, recentLeads] =
    await Promise.all([
      prisma.tour.count(),
      prisma.tour.count({ where: { isPublished: true } }),
      prisma.hotel.count(),
      prisma.blogPost.count(),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "Yeni" } }),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { tour: { select: { title: true } } },
      }),
    ]);

  const stats = [
    { label: "Toplam Tur", value: tours, sub: `${publishedTours} yayında`, icon: Plane, href: "/admin/tours", color: "bg-brand-50 text-brand-700" },
    { label: "Oteller", value: hotels, icon: Building2, href: "/admin/hotels", color: "bg-gold-100 text-gold-700" },
    { label: "Blog Yazıları", value: posts, icon: Newspaper, href: "/admin/blog", color: "bg-navy-100 text-navy-700" },
    { label: "Başvurular", value: leadsTotal, sub: `${newLeads} yeni`, icon: Inbox, href: "/admin/leads", color: "bg-green-100 text-green-700" },
  ];

  const quickLinks = [
    { label: "Yeni Tur Ekle", href: "/admin/tours/new", icon: Plane },
    { label: "Yeni Otel Ekle", href: "/admin/hotels/new", icon: Building2 },
    { label: "Yeni Blog Yazısı", href: "/admin/blog/new", icon: Newspaper },
    { label: "Belge Ekle", href: "/admin/certificates", icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-900">Hoş geldiniz 👋</h2>
        <p className="mt-1 text-sm text-muted">
          Sitenizin genel durumuna buradan göz atabilirsiniz.
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <AdminCard className="group p-5 transition hover:shadow-card">
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
                <div key={lead.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
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
                    <span className="hidden text-xs text-muted sm:block">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
  );
}
