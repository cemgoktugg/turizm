-- Marka güncellemesi: "Rotamız Huzura" → "Nemira Turizm", slogan "En Güzele, En İyiyle".
-- Şema değişikliği yok; yalnızca kayıtlı metinler güncellenir (her veritabanında bir kez çalışır).

-- Site ayarları
UPDATE "SiteSetting" SET "value" = 'Nemira Turizm' WHERE "key" = 'siteName' AND "value" = 'Rotamız Huzura';
UPDATE "SiteSetting" SET "value" = 'En Güzele, En İyiyle' WHERE "key" = 'tagline' AND "value" = 'Hac & Umre Turizm';
UPDATE "SiteSetting" SET "value" = 'info@nemiraturizm.com' WHERE "key" = 'email' AND "value" = 'info@rotamizhuzura.com';
UPDATE "SiteSetting" SET "value" = 'En Güzele, En İyiyle | Nemira Turizm' WHERE "key" = 'seoTitle' AND "value" = 'Rotamız Huzura | Hac & Umre Turizm';
UPDATE "SiteSetting" SET "value" = REPLACE("value", 'Rotamız Huzura', 'Nemira Turizm') WHERE "value" LIKE '%Rotamız Huzura%';

-- Tur ve blog SEO başlıklarındaki eski marka eki (site adı sekme başlığına zaten otomatik eklenir)
UPDATE "Tour" SET "seoTitle" = NULL WHERE "seoTitle" = "title" || ' | Rotamız Huzura';
UPDATE "BlogPost" SET "seoTitle" = NULL WHERE "seoTitle" = "title" || ' | Rotamız Huzura Blog';
UPDATE "Tour" SET "seoTitle" = REPLACE("seoTitle", 'Rotamız Huzura', 'Nemira Turizm') WHERE "seoTitle" LIKE '%Rotamız Huzura%';
UPDATE "BlogPost" SET "seoTitle" = REPLACE("seoTitle", 'Rotamız Huzura', 'Nemira Turizm') WHERE "seoTitle" LIKE '%Rotamız Huzura%';

-- Tur ve blog metinleri
UPDATE "Tour" SET "description" = REPLACE("description", 'Rotamız Huzura', 'Nemira Turizm') WHERE "description" LIKE '%Rotamız Huzura%';
UPDATE "Tour" SET "shortDescription" = REPLACE("shortDescription", 'Rotamız Huzura', 'Nemira Turizm') WHERE "shortDescription" LIKE '%Rotamız Huzura%';
UPDATE "BlogPost" SET "content" = REPLACE("content", 'Rotamız Huzura', 'Nemira Turizm') WHERE "content" LIKE '%Rotamız Huzura%';
UPDATE "BlogPost" SET "excerpt" = REPLACE("excerpt", 'Rotamız Huzura', 'Nemira Turizm') WHERE "excerpt" LIKE '%Rotamız Huzura%';

-- Panelden kaydedilmiş sayfa içerikleri: slider başlığı slogan olur, diğer yerlerde marka adı
UPDATE "ContentBlock" SET "data" = REPLACE("data", '"title":"Rotamız Huzura"', '"title":"En Güzele, En İyiyle"') WHERE "key" = 'home.hero';
UPDATE "ContentBlock" SET "data" = REPLACE("data", 'Rotamız Huzura', 'Nemira Turizm') WHERE "data" LIKE '%Rotamız Huzura%';
