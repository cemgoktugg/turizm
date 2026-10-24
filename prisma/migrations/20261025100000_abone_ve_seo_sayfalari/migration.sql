-- Kampanya aboneleri ve arama motoru açılış sayfaları

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contact" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fullName" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "content" TEXT NOT NULL,
    "tourCategories" TEXT,
    "tourSearch" TEXT,
    "toursTitle" TEXT,
    "toursSort" TEXT,
    "faqs" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_contact_key" ON "Subscriber"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");

-- Başlangıç açılış sayfaları (panelden düzenlenebilir / silinebilir)
INSERT INTO "LandingPage" ("id", "slug", "title", "description", "image", "content", "tourCategories", "tourSearch", "toursTitle", "toursSort", "faqs", "seoTitle", "seoDescription", "isPublished", "createdAt", "updatedAt")
VALUES ('lp_umre_fiyatlari', 'umre-fiyatlari', 'Umre Fiyatları 2026–2027', 'Kayıt alınan tüm umre programlarımızı güncel fiyatlarıyla karşılaştırın; fiyatı belirleyen etkenleri ve fiyata dahil hizmetleri öğrenin.', '/images/hero-1.svg', 'Umre fiyatları; programın süresine, otellerin Harem''e uzaklığına, oda tipine, uçuş planına ve sezona göre değişir. Aşağıda kayıt alınan tüm umre programlarımızı güncel başlangıç fiyatlarıyla görebilirsiniz. Döviz fiyatların yanında bugünkü kurla yaklaşık TL karşılığı da yer alır.

## Umre fiyatını neler belirler?

- **Otel konumu:** Mescid-i Haram ve Mescid-i Nebevi''ye yürüme mesafesindeki oteller, servisle ulaşılan otellere göre daha yüksek fiyatlıdır.
- **Program süresi:** Kalınan gece sayısı arttıkça konaklama gideri de artar.
- **Oda tipi:** Fiyatlar kişi başı verilir; kalabalık odalar daha ekonomik, iki kişilik ve tek kişilik odalar daha yüksek fiyatlıdır.
- **Sezon:** Ramazan ayı, sömestr ve bayram dönemleri en yoğun dönemlerdir; bu tarihlerde fiyatlar yükselir.
- **Uçuş:** Direkt ya da aktarmalı uçuş, havayolu ve kalkış şehri fiyatı etkiler.

## Fiyata neler dahil?

Her programın kapsamı tur sayfasındaki **Hizmetler** bölümünde ayrıntılı olarak yazar: uçak bileti, vize, konaklama, transferler, ziyaretler ve rehberlik hizmetlerinden hangilerinin fiyata dahil olduğunu oradan kontrol edebilirsiniz.

## Fiyatlar neden dolar olarak veriliyor?

Konaklama, uçuş ve vize giderlerinin büyük bölümü döviz üzerinden ödendiği için umre fiyatları sektörde genellikle dolar olarak ilan edilir. Ödeme seçenekleri ve kur uygulaması kayıt sırasında danışmanlarımız tarafından açıklanır.

Size en uygun programı birlikte belirlemek için [rezervasyon formunu](/rezervasyon) doldurabilir ya da bizi arayabilirsiniz.', 'umre,luks-umre,ramazan-umresi', NULL, 'Güncel Umre Programları ve Fiyatları', 'fiyat-artan', '[{"question":"Umre fiyatlarına uçak bileti ve vize dahil mi?","answer":"Fiyata dahil olan hizmetler her programda ayrı ayrı belirtilir. Uçak bileti, vize, konaklama ve transferlerin kapsamını tur sayfasındaki Hizmetler bölümünden kontrol edebilirsiniz."},{"question":"Fiyatlar kişi başı mı?","answer":"Evet, ilan edilen fiyatlar kişi başıdır ve genellikle en ekonomik oda tipine göre verilir. Diğer oda tiplerinin fiyatlarını tur sayfasındaki oda ücretleri tablosunda görebilirsiniz."},{"question":"Çocuklar için ayrı fiyat uygulanıyor mu?","answer":"Programa göre bebek ve çocuk fiyatları oda ücretleri tablosunda ayrıca gösterilir. Tabloda yer almıyorsa danışmanlarımızdan bilgi alabilirsiniz."},{"question":"TL karşılığı neye göre hesaplanıyor?","answer":"Sitede gösterilen TL karşılığı, günün TCMB döviz satış kuruyla yaklaşık olarak hesaplanır ve bilgilendirme amaçlıdır. Ödemede geçerli olacak tutar kayıt sırasında netleştirilir."}]', 'Umre Fiyatları 2026–2027 | Güncel Umre Turu Fiyatları', '2026–2027 umre turu fiyatları: ekonomik, lüks ve Ramazan umresi programlarını karşılaştırın. Fiyatı belirleyen etkenler ve fiyata dahil hizmetler.', 1, (CAST(strftime('%s', 'now') AS INTEGER) * 1000), (CAST(strftime('%s', 'now') AS INTEGER) * 1000));

INSERT INTO "LandingPage" ("id", "slug", "title", "description", "image", "content", "tourCategories", "tourSearch", "toursTitle", "toursSort", "faqs", "seoTitle", "seoDescription", "isPublished", "createdAt", "updatedAt")
VALUES ('lp_sivas_umre', 'sivas-umre', 'Sivas''tan Umre Turları', 'Sivas merkezdeki ofisimizde yüz yüze görüşerek umre programınızı birlikte planlayalım.', '/images/hero-3.svg', '{marka} olarak Sivas''ta, Ulu Çarşı''daki ofisimizde hac ve umre misafirlerimizi ağırlıyoruz. Sivas ve çevre illerden umreye gitmek isteyen misafirlerimiz programları ofisimizde yüz yüze inceleyebilir, evrak işlemlerini tek adımda tamamlayabilir.

## Neden yerel bir acenta?

- **Yüz yüze görüşme:** Program, otel ve oda seçeneklerini ofisimizde birlikte değerlendiririz.
- **Kolay evrak teslimi:** Pasaport, fotoğraf ve diğer belgeleri ofisimize bırakmanız yeterlidir.
- **Yolculuk öncesi bilgilendirme:** Umre menasiki ve hazırlık konusundaki sorularınızı yanıtlarız.
- **Ulaşılabilir destek:** Yolculuğun öncesinde, sırasında ve sonrasında bize kolayca ulaşabilirsiniz.

## Kalkış ve uçuş

Uçuş ve kalkış noktaları programa göre değişir. Her turun uçuş planı, tur sayfasındaki **Uçuş ve Transfer** bölümünde yer alır. Size en uygun kalkış seçeneği için danışmanlarımızla görüşebilirsiniz.

## Yetki belgelerimiz

Umre ve hac organizasyonlarımızı Diyanet İşleri Başkanlığı yetki belgeleri ve TÜRSAB üyeliğimizle yürütüyoruz. Belgelerimizi [Yetki Belgeleri](/umre/yetki-belgeleri) sayfasında inceleyebilirsiniz.

**Adresimiz:** {adres}
**Telefon ve WhatsApp:** {telefon}', 'umre,luks-umre,ramazan-umresi', NULL, 'Kayıt Alınan Umre Programlarımız', 'tarih', '[{"question":"Sivas''ta ofisiniz nerede?","answer":"Ofisimiz {adres} adresindedir. Çalışma saatlerimiz içinde ziyaret edebilir, {telefon} numarasından bize ulaşabilirsiniz."},{"question":"Umre kaydını ofise gelmeden yapabilir miyim?","answer":"Evet. Sitemizdeki rezervasyon formunu doldurabilir veya WhatsApp hattımızdan yazabilirsiniz; danışmanlarımız sizi arayarak kayıt sürecini telefonla yürütür."},{"question":"Umre turları hangi şehirden kalkıyor?","answer":"Kalkış şehri ve uçuş planı programa göre değişir. Her turun uçuş bilgileri tur sayfasında yer alır; size uygun seçeneği birlikte belirleyebiliriz."}]', 'Sivas Umre Turları | Sivas''tan Umre Programları', 'Sivas''tan umre turları: Sivas merkezdeki ofisimizde yüz yüze görüşme, kolay evrak teslimi ve Diyanet yetkili umre programları.', 1, (CAST(strftime('%s', 'now') AS INTEGER) * 1000), (CAST(strftime('%s', 'now') AS INTEGER) * 1000));

-- Footer menüsü panelden kaydedilmişse "Sık Sorulan Sorular" bağlantısını ilk sütuna ekle
UPDATE "ContentBlock"
  SET "data" = json_insert("data", '$.columns[0].links[#]', json('{"label":"Sık Sorulan Sorular","href":"/sss"}')),
      "updatedAt" = (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
  WHERE "key" = 'nav.footer'
    AND json_valid("data")
    AND instr("data", '"/sss"') = 0
    AND json_type("data", '$.columns[0].links') = 'array'
    AND json_array_length("data", '$.columns[0].links') < 10;

-- Metin olarak saklanmış tarihleri düzelt
UPDATE "DocumentCertificate" SET "createdAt" = CAST(strftime('%s', "createdAt") AS INTEGER) * 1000 WHERE typeof("createdAt") = 'text' AND strftime('%s', "createdAt") IS NOT NULL;
UPDATE "DocumentCertificate" SET "updatedAt" = CAST(strftime('%s', "updatedAt") AS INTEGER) * 1000 WHERE typeof("updatedAt") = 'text' AND strftime('%s', "updatedAt") IS NOT NULL;
UPDATE "SiteSetting" SET "updatedAt" = CAST(strftime('%s', "updatedAt") AS INTEGER) * 1000 WHERE typeof("updatedAt") = 'text' AND strftime('%s', "updatedAt") IS NOT NULL;
UPDATE "ContentBlock" SET "updatedAt" = CAST(strftime('%s', "updatedAt") AS INTEGER) * 1000 WHERE typeof("updatedAt") = 'text' AND strftime('%s', "updatedAt") IS NOT NULL;
