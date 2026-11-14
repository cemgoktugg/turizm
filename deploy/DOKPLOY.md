# Nemira — Dokploy ile Yayınlama Rehberi

Site, testerestore ile **aynı Hostinger VPS'te**, Dokploy'un **Compose** servisiyle
yayınlanır. Dokploy'un Traefik'i alan adı + SSL'i (Let's Encrypt) otomatik yönetir.

```
İnternet ── https://<alan adı> ──► Traefik (Dokploy) ──► web:3000 (Next.js)
                                                         │
                         nemira_data (SQLite) ◄──────────┤  kalıcı volume'lar:
                         nemira_uploads (görsel/video) ◄─┘  yeni sürümde silinmez
                         nemira_backups ◄── db-backup (günlük yedek)
```

---

## 0. Ön koşul — DNS

Alan adının DNS panelinde, testerestore'un çalıştığı VPS'in IP adresine:

| Tip | Ad    | Değer  |
|-----|-------|--------|
| A   | `@`   | VPS_IP |
| A   | `www` | VPS_IP |

> DNS yayılması birkaç dakika–birkaç saat sürebilir. Kayıt doğru IP'yi göstermeden
> SSL sertifikası alınamaz.

## 1. Dokploy'da Compose servisi

1. Dokploy paneli → **Projects → Create Project** (ör. `nemira`).
2. Proje içinde **Create Service → Compose**.
3. **Provider: GitHub** → repo: `cemgoktugg/turizm` → **Branch:** `main`.
4. **Compose Path:** `docker-compose.yml` (Compose Type: Docker Compose).

## 2. Environment

`deploy/.env.example` dosyasındaki değişkenleri **Environment** sekmesine yapıştırıp doldurun:

```
DOMAIN=alanadiniz.com
JWT_SECRET=<en az 32 karakter rastgele>
ADMIN_EMAIL=<panel e-postanız>
ADMIN_PASSWORD=<en az 10 karakter, harf + rakam>
```

**Panel kullanıcıları (isteğe bağlı):** `OMER_PASSWORD`, `ALPEREN_PASSWORD`, `OFIS_PASSWORD`, `DEMET_PASSWORD`
(ve eski `PERSONEL_PASSWORD`) girilirse `omer@` (Ömer Ali Gültekin), `alperen@` (Alperen Gültekin),
`ofis@` (Ofis), `demet@` (Demet Ünlükaya) ve `personel@nemiraturizm.com` hesapları bu **geçici** şifrelerle açılır
(en az 10 karakter, harf **ve** rakam; uymayan şifrede hesap açılmaz, logda uyarı çıkar). Giriş ekranına e-posta
yerine **kullanıcı adı** da yazılabilir: `omer`, `alperen`, `ofis`, `demet`, `personel` (büyük/küçük harf ve Türkçe
harf farkı gözetilmez: "Ömer" de olur). Panelden eklenen yeni
kullanıcılara da kullanıcı adı verilir. Kullanıcı ilk girişte kendi şifresini belirlemeden panele giremez; belirledikten
sonra hesaba dokunulmaz ve değişken silinebilir. Kullanıcı henüz kendi şifresini belirlemediyse değişkeni
değiştirip Redeploy yapmak geçici şifreyi yeniler. Yapılan işlemler **Sistem › İşlem Geçmişi** sayfasında görünür.
Ömer ve Alperen personel yetkisindedir (site + satış); `ofis@`, `demet@` ve `personel@` hesapları **satış personelidir** ve
yalnızca Satış Programı'nı (`https://<alan adı>/satis`) görür. Yetkiler yönetici hesabıyla
**Sistem › Kullanıcılar** sayfasından değiştirilebilir. Tahsilat silme ve kullanıcı
işlemlerini yalnızca `ADMIN_EMAIL` hesabı yapar.

**Kasa:** Alınan her ödeme (nakit, havale, kredi kartı) kaydedildiği an kasaya girer; iadeler düşülür.
Kasa sayfası toplamı, bugün ve bu ay gireni, ödeme şekline göre dökümü ve son hareketleri gösterir.
Parayı kimin aldığı makbuzda ve Raporlar › Personel'de görünür.

**Satış Programı:** Satış ekranları `/satis` adresinde, yönetim panelinden ayrı bir çerçevede açılır.
Aynı ekranlar geçiş dönemi için yönetim panelinde (`/admin/satis`) de durur.

**Yeni başvuru bildirimleri (isteğe bağlı):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_FROM`, `NOTIFY_EMAIL` girilirse her başvuruda size e-posta, e-posta
yazan müşteriye de otomatik yanıt gider. `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` ile
Telegram bildirimi de açılabilir. Müşteriye giden metin panelden düzenlenir
(Sayfa İçerikleri › Başvuru Formu).

**WhatsApp bildirimi:** İşletme numarasının WhatsApp'ından `+34 623 78 95 80`
numarasına `I allow callmebot to send me messages` yazın; gelen anahtarı
`CALLMEBOT_APIKEY` olarak girip Redeploy yapın. Her başvuru, müşteriye tek tıkla
yazma bağlantısıyla birlikte WhatsApp'ınıza gelir.

## 3. Deploy

**Deploy**'a basın. İlk derleme 3–6 dk sürer. **Logs** sekmesinde `web` servisinde sırasıyla:

```
[başlangıç] Veritabanı geçişleri uygulanıyor...
[başlangıç] İlk kurulum: başlangıç içeriği yükleniyor...
[yönetici] Varsayılan hesap <ADMIN_EMAIL> olarak güncellendi.
✓ Ready
```

satırları görünmelidir. Traefik ~10 sn içinde SSL sertifikasını alır.

> **Alan adı label'ları çalışmazsa (yedek yol):** Compose servisinin **Domains** sekmesinden
> elle ekleyin — servis `web`, port `3000`, alan adı, HTTPS açık, Certificate: Let's Encrypt.

## 4. Doğrulama

```
https://<alan adı>                → site açılıyor
https://<alan adı>/admin          → panel girişi (ADMIN_EMAIL / ADMIN_PASSWORD)
https://<alan adı>/sitemap.xml    → adresler https://<alan adı>/... (localhost DEĞİL)
http://<alan adı>, www.<alan adı> → https://<alan adı>'na yönleniyor
```

## 5. İlk girişten sonra (panelde)

- **Site Ayarları:** telefon, WhatsApp, e-posta, adres, sosyal medya, harita, SEO.
- Turlar, oteller, hikayeler ve sayfa içeriklerindeki örnek bilgileri güncelleyin.

---

## Güncelleme akışı

Kod değişince: `git push` → Dokploy'da **Redeploy** (veya Dokploy'da otomatik deploy açılabilir).
Veritabanı ve yüklenen dosyalar volume'larda olduğu için güncellemede **silinmez**;
yeni veritabanı geçişleri açılışta otomatik uygulanır.

## Yerel veritabanını taşımak (isteğe bağlı)

İlk kurulum, yerel bilgisayardaki örnek içerikle aynı başlangıç içeriğini kurar. Yereldeki
`prisma/dev.db`'yi olduğu gibi taşımak isterseniz (VPS'e SSH ile):

```sh
docker ps --filter "name=web" --format "{{.Names}}"     # web konteynerinin adını bulun
docker cp dev.db <konteyner>:/app/data/turizm.db
docker restart <konteyner>
```

Yüklenen görseller yerelde `storage/uploads/` altındadır; aynı yolla
`/app/storage/uploads/` içine kopyalanır.

## Yedekler

`db-backup` servisi her gün `nemira_backups` volume'una yedek alır:
`db_YYYY-MM-DD_HHMM.db.gz` (veritabanı, 14 gün) ve `uploads_….tar.gz` (dosyalar, 3 gün).

**Sunucu dışına kopya önerilir:** Dokploy → Compose → **Volume Backups** →
`nemira_backups` → S3 uyumlu bir hedef (Cloudflare R2, Backblaze B2…).

**Geri yükleme** (VPS'te):
```sh
# DİKKAT: mevcut veritabanının üzerine yazar
docker exec <db-backup konteyneri> sh -c "gunzip -c /backups/db_2026-10-23_0300.db.gz > /data/turizm.db"
docker restart <web konteyneri>
```

## Kesinti takibi (önerilir)

Site çökerse veya veritabanına ulaşılamazsa haberiniz olsun diye ücretsiz bir izleme
servisi bağlayın (ör. [UptimeRobot](https://uptimerobot.com) veya Better Stack):

1. Hesap açın → **New Monitor** → tür: **HTTP(s)**.
2. Adres: `https://<alan adı>/api/health` — kontrol aralığı: 5 dakika.
3. Uyarı kanalı olarak e-posta, Telegram veya mobil uygulama bildirimini seçin.

`/api/health` site ve veritabanı çalışıyorsa `200`, veritabanına ulaşılamıyorsa `503` döner.

## Görseller

Panelden yüklenen görseller webp'ye çevrilir. Telefon ve tabletler için 480 / 800 /
1200 / 1600 px kopyalar ilk istendiğinde otomatik üretilir
(`nemira_uploads` içinde `.variants/`); yedeğe alınmaz, silinirse yeniden üretilir.

## Güvenlik

- `JWT_SECRET` boş ya da 32 karakterden kısaysa site **açılmaz** (bilerek).
- Panel girişi hem uygulamada hem Traefik'te (IP başına dakikada 10 deneme) sınırlıdır.
- Varsayılan hesap (`admin@turizm.com / admin123`) yalnızca `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` girilmezse kalır; o durumda loglarda uyarı çıkar. Mutlaka girin.
