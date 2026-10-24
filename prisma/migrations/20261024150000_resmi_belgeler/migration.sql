-- Resmî belgeler: temsili görseller gerçek belgelerle değiştirilir. (Şema değişikliği yok.)
-- Yalnızca ilk kurulumdaki temsili kayıtlar güncellenir; panelden değiştirilmiş kayıtlara dokunulmaz.

UPDATE "DocumentCertificate"
  SET "title" = '2026-2027 Umre Organizasyonu Yetki Belgesi',
      "image" = '/images/belge-umre-2026-2027.webp',
      "description" = 'Diyanet İşleri Başkanlığı Hac ve Umre Hizmetleri Genel Müdürlüğü · No: 330 · 17.07.2026',
      "order" = 1,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "image" = '/images/belge-diyanet.svg';

INSERT INTO "DocumentCertificate" ("id", "title", "image", "description", "order", "isPublished", "createdAt", "updatedAt")
  SELECT lower(hex(randomblob(12))), '2027 Yılı Hac Kayıt Yetki Belgesi', '/images/belge-hac-2027.webp',
         'Diyanet İşleri Başkanlığı · Belge No: 242 · 29.07.2026', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  WHERE NOT EXISTS (SELECT 1 FROM "DocumentCertificate" WHERE "image" = '/images/belge-hac-2027.webp');

UPDATE "DocumentCertificate"
  SET "title" = 'IATA Akreditasyon Sertifikası',
      "image" = '/images/belge-iata-2026.webp',
      "description" = 'Uluslararası Hava Taşımacılığı Birliği · IATA Kodu: 88227742 · Geçerlilik: 2026',
      "order" = 3,
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "image" = '/images/belge-iata.svg';

-- TÜRSAB belgesinin taranmış hali eklenene kadar temsili görsel yayından kaldırılır
UPDATE "DocumentCertificate" SET "isPublished" = 0, "order" = 4, "updatedAt" = CURRENT_TIMESTAMP
  WHERE "image" = '/images/belge-tursab.svg';

-- Tam ticaret unvanı (IATA sertifikasındaki haliyle)
UPDATE "SiteSetting" SET "value" = 'Hayrabat Turizm ve Seyahat Acentesi Tic. San. Ltd. Şti.'
  WHERE "key" = 'companyTitle' AND "value" = 'Hayrabat Turizm';
