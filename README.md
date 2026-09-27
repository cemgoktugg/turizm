# Rotamız Huzura — Hac & Umre Turizm Sitesi

Premium, görsel ağırlıklı, SEO uyumlu ve tam yönetilebilir bir hac/umre turizm
platformu. **Next.js App Router + TypeScript + Tailwind CSS v4 + Prisma + SQLite**
ile geliştirilmiştir.

## Özellikler

- 🕌 **Genel Site**: Ana sayfa (hero slider, öne çıkan turlar, kategoriler,
  neden biz, oteller, bilgilendirme, belgeler), Hac & Umre landing sayfaları,
  tur listeleme + filtreleme, tur detay (galeri, gün gün program, oda fiyatları,
  SSS, rezervasyon formu), oteller, blog, gerekli bilgiler, hakkımızda, iletişim,
  rezervasyon.
- 🔐 **Admin Panel** (`/admin`): JWT oturumlu giriş, dashboard, turlar/oteller/blog
  için tam CRUD, başvuru (lead) yönetimi + durum takibi, belge yönetimi ve site
  ayarları.
- 🗄️ **SQLite + Prisma**: Migration ve seed sistemi, form başvurularının
  veritabanına kaydı.
- 🎨 **Premium Tasarım**: Koyu yeşil / altın / krem / lacivert paleti, serif +
  sans tipografi, Framer Motion animasyonları, mobil-first, sticky navbar, yüzen
  WhatsApp butonu, mobil alt iletişim çubuğu.
- 🔎 **SEO**: Dinamik metadata, OpenGraph, JSON-LD (TravelAgency, TouristTrip,
  FAQPage, Breadcrumb, Article), `sitemap.xml`, `robots.txt`, Türkçe slug.
- 🛡️ **Güvenlik**: bcrypt şifre hash, JWT oturum çerezi, proxy (middleware) ile
  korunan admin rotaları, Zod form doğrulama, honeypot ile spam koruması.

## Kurulum

```bash
npm install
npx prisma migrate dev      # veritabanını oluşturur
npx prisma db seed          # örnek verileri yükler
npm run dev                 # http://localhost:3000
```

`.env` dosyası:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-secret-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Admin Girişi

| Alan  | Değer               |
| ----- | ------------------- |
| URL   | `/admin/login`      |
| Email | `admin@turizm.com`  |
| Şifre | `admin123`          |

> Üretimde `JWT_SECRET` değerini mutlaka değiştirin ve admin şifresini güncelleyin.

## Faydalı Komutlar

| Komut                         | Açıklama                                    |
| ----------------------------- | ------------------------------------------- |
| `npm run dev`                 | Geliştirme sunucusu                         |
| `npm run build`               | Production build                            |
| `npm run start`               | Production sunucusu                         |
| `npm run db:studio`           | Prisma Studio (görsel veritabanı yönetimi)  |
| `npm run db:seed`             | Seed verilerini yeniden yükler              |
| `npm run db:reset`            | Veritabanını sıfırlar ve yeniden seed eder  |
| `node scripts/gen-images.mjs` | Placeholder görselleri yeniden üretir       |

## Proje Yapısı

```
app/
  (site)/         → genel site (navbar + footer chrome)
  admin/          → yönetim paneli (login + (panel) auth-korumalı)
  actions/        → server actions (leads, auth, tours, hotels, blog, settings, certificates)
  sitemap.ts, robots.ts
components/
  site/           → Navbar, Footer, HeroSlider, TourCard, BookingForm, ...
  admin/          → AdminShell, TourForm, HotelForm, BlogForm, ...
  ui/             → Button, Badge, Input, Icon, Reveal, SmartImage, ...
  seo/            → JSON-LD bileşenleri
lib/              → prisma, auth, settings, validations, queries, constants, utils
prisma/           → schema.prisma, seed.ts, migrations
public/images/    → marka renkli SVG placeholder görselleri
```

## Notlar

- Görseller marka renkli SVG placeholder'lardır; admin panelinden gerçek fotoğraf
  yollarıyla değiştirilebilir.
- Prisma 6 (SQLite) kullanılmıştır; `provider = "sqlite"`.
- Bir demo/başlangıç projesidir.
