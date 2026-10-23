# Rotamız Huzura — Hac & Umre Turizm Sitesi

Hac ve umre turizmi için hazırlanmış, SEO uyumlu, **tüm içeriği yönetim panelinden düzenlenebilen**
bir site. Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ve SQLite ile geliştirildi.

## Kurulum

```bash
npm install
cp .env.example .env        # ardından JWT_SECRET üretin (aşağıya bakın)
npx prisma migrate dev      # veritabanını oluşturur
npx prisma db seed          # örnek verileri yükler
npm run dev                 # http://localhost:3000
```

`.env` dosyası:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="<en az 32 karakter, rastgele>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

JWT anahtarı üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> Production'da `JWT_SECRET` tanımsız, 32 karakterden kısa ya da örnek değerde bırakılmışsa
> uygulama bilerek hata verir.

## Yönetim Paneli (`/admin`)

İlk giriş bilgileri `admin@turizm.com` / `admin123`. Varsayılan şifre değiştirilene kadar panelde
uyarı gösterilir.

| Bölüm | Neyi yönetir |
| --- | --- |
| **Kontrol Paneli** | Özet, yaklaşan kalkışlar, son başvurular ve dikkat gerektirenler (tarihi geçen öne çıkan tur, kapaksız tur, örnek WhatsApp numarası vb.) |
| **Başvurular** | Tüm formlardan gelen talepler. Arama, durum filtresi, kaynak sayfa, WhatsApp'tan yazma, iç not, Excel (CSV) dışa aktarma |
| **Değerlendirmeler** | Ziyaretçilerin tur sayfasından gönderdiği yorumlar. Onaylanan yorum turun "Değerlendirmeler" bölümünde yayınlanır; onay bekleyenler menüde sayı olarak görünür |
| **Turlar** | Tam CRUD. Form, tur detay sayfasıyla aynı sıradadır: başlık ve üst etiket, tur no (boşsa otomatik), tarih ve kalan koltuk, galeri ve video, otel kartları (gece, yıldız, mesafe, görsel, video), uçuş ve transfer bacakları, başlangıç fiyatı ve oda ücretleri (2'li / 3'lü / 4'lü / tek / çocuk), genel bakış, dahil / hariç hizmetler, günlük program, SSS, SEO. Filtreler (sitede / tarihi geçen / taslak), **kopyala** (yeni sezon için) |
| **Kategoriler** | Ana sayfa kategori kartları ve `/turlar` filtreleri: ad, açıklama, ikon, görsel, sıralama. Sayfalara bağlı sistem kategorileri kilitlidir |
| **Oteller** | Mekke ve Medine otelleri. Tur formundaki otel kartında "Kayıtlı otellerden seç" ile ad, yıldız, mesafe ve görseli otomatik doldurur |
| **Hikayeler** | Ana sayfada slider'ın altında Instagram hikayesi gibi görünen yuvarlak videolar ve fotoğraflar: kapak, kısa başlık, sırayla oynayan içerikler, açıklama, alt buton, sıralama, yayın durumu ve tam ekran önizleme |
| **Sayfa İçerikleri** | Sitede görünen her metin ve görsel: üst menü ve alt menüler, footer bağlantı sütunları, hero slaytları, istatistikler, "Neden Biz", hakkımızda, gerekli bilgiler, menasik adımları, dualar, sayfa başlıkları, sayfa yolu adları ve SEO, buton/etiket/form metinleri, boş durum mesajları, WhatsApp hazır mesajları, 404 sayfası |
| **Blog** | Markdown yazılar, canlı önizleme, otomatik okuma süresi |
| **Belgeler** | TÜRSAB, Diyanet ve IATA gibi belgeler |
| **Medya** | Görsel ve video yükleme (sürükle-bırak), kullanıldığı yerleri gösterme, kullanımdaki dosyanın silinmesini engelleme |
| **Site Ayarları** | Logo, favicon, iletişim, sosyal medya (Facebook, Instagram, YouTube, X, TikTok, LinkedIn, Telegram), Google Harita (iframe kodu doğrudan yapıştırılabilir), genel SEO ve paylaşım görseli |
| **Kullanıcılar / Hesabım** | Yönetici ekleme ve silme, profil, şifre değiştirme |

### Panel ile site nasıl senkron kalıyor?

- Paneldeki her kayıt `revalidateSite()` ile tüm genel sayfaları ve `sitemap.xml`'i anında yeniler.
  Genel sayfalar statik üretilir, saatte bir de kendiliğinden yenilenir.
- Gidiş tarihi geçen turlar listelerden, ana sayfadan, rezervasyon formundan ve sitemap'ten otomatik
  kalkar. Detay sayfası "tarihi geçti" uyarısı ve benzer yaklaşan turlarla açık kalır.
- Sitede koda gömülü görünür metin yoktur (sosyal medya ikonlarının marka adları hariç). Renk paleti ve yazı tipleri
  tasarım kararı olarak koddadır (`app/globals.css`, `app/layout.tsx`).
- Sayfa içerikleri `lib/content/registry.ts` içinde tanımlıdır. Her bloğun admin formu ve sunucu
  doğrulaması aynı alan tanımından üretilir. Veritabanında kayıt yoksa sitede varsayılan içerik görünür.

## Güvenlik

- Şifreler bcrypt ile saklanır. Oturum imzalı JWT ile httpOnly çerezde tutulur. Şifre değişince veya
  kullanıcı silinince diğer cihazlardaki oturumlar düşer (`tokenVersion`).
- Giriş denemeleri IP ve hesap başına hız sınırlıdır. Başvuru ve değerlendirme formlarında honeypot ve
  IP başına sınır var. Değerlendirmeler panelden onaylanmadan yayınlanmaz.
- Yüklemelerde dosya türü içeriğinden (magic bytes) doğrulanır. SVG kabul edilmez. Görseller WEBP'ye
  çevrilip küçültülür (en fazla 10 MB). Videolar (MP4, MOV, WEBM; en fazla 50 MB) yalnızca hikaye ve medya
  alanlarında kabul edilir, dönüştürülmeden saklanır ve parçalı (Range) olarak sunulur.
- Tüm admin işlemleri sunucu tarafında oturum ve Zod doğrulamasından geçer.

## Canlıya Çıkış Notları

- **Yayın:** Hostinger VPS'teki Dokploy ile Docker Compose olarak yayınlanır. Adım adım rehber:
  [`deploy/DOKPLOY.md`](deploy/DOKPLOY.md). Gerekli ortam değişkenleri: [`deploy/.env.example`](deploy/.env.example).
- **Veritabanı:** SQLite, kalıcı Docker volume'unda (`/app/data`) durur. İlk açılışta tablolar ve
  başlangıç içeriği otomatik kurulur, sonraki sürümlerde yalnızca yeni geçişler uygulanır.
  Vercel gibi sunucusuz platformlarda dosya sistemi kalıcı olmadığından PostgreSQL gerekir.
- **Sayfalar** her istekte canlı veritabanından üretilir; panel değişiklikleri anında yansır.
- **Yüklenen görseller ve videolar** `storage/uploads/` klasöründe tutulur ve `/uploads/...` adresinden sunulur.
  Bu klasörün kalıcı bir diskte olması ve yedeklenmesi gerekir.
- Hız sınırlayıcı bellek içidir, tek sunucu için yeterlidir.
- Ramazan ve Hac tarihleri hicri takvime göre yaklaşıktır. Diyanet ilanına göre panelden güncelleyin.

## Faydalı Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm run start` | Production build / sunucu |
| `npm run db:studio` | Prisma Studio (görsel veritabanı yönetimi) |
| `npm run db:seed` | Örnek verileri yeniden yükler (**mevcut veriyi siler**) |
| `node scripts/gen-images.mjs` | Placeholder görselleri yeniden üretir |

## Proje Yapısı

```
app/
  (site)/            → genel site
  admin/             → yönetim paneli (login + (panel) oturum korumalı)
  actions/           → server actions (tours, reviews, stories, categories, hotels, blog, content, media, leads, account, settings)
  api/admin/         → görsel yükleme ve CSV dışa aktarma
  uploads/[...path]/ → yüklenen görsellerin sunumu
components/
  site/  admin/  ui/  seo/
  site/stories/      → ana sayfa hikaye şeridi ve tam ekran hikaye oynatıcı
  site/tour-detail/  → tur detay sayfası (galeri, otel ve uçuş kartları, fiyat kutusu, tarih tablosu, program, yorumlar)
lib/
  content/           → içerik blokları (registry), alan tanımları, okuma katmanı
  auth, session, rate-limit, media, queries, validations, settings, revalidate
prisma/              → schema, migrations, seed
```
