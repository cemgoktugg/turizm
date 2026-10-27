-- Günlük programa saat ve buluşma yeri
ALTER TABLE "TourDayProgram" ADD COLUMN "time" TEXT;
ALTER TABLE "TourDayProgram" ADD COLUMN "place" TEXT;

-- Deneme: 20 günlük örnek tura (Tur No 11560) gerçek 20 günlük program.
-- Yalnızca tur hâlâ kurulumdaki 8 günlük örnek programla duruyorsa uygulanır;
-- panelden düzenlenmiş programlara dokunulmaz.
CREATE TEMP TABLE "_ornek_tur" AS
  SELECT t."id" AS "tourId" FROM "Tour" t
  WHERE t."code" = '11560'
    AND (SELECT count(*) FROM "TourDayProgram" d WHERE d."tourId" = t."id") = 8
    AND EXISTS (
      SELECT 1 FROM "TourDayProgram" d
      WHERE d."tourId" = t."id" AND d."dayNumber" = 1 AND d."title" = 'Hareket ve Cidde''ye Varış'
    );

DELETE FROM "TourDayProgram" WHERE "tourId" IN (SELECT "tourId" FROM "_ornek_tur");

INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d01', 1, 'Otele yerleşim ve Ravza selamlaması', 'Otele yerleşimin ardından Ravza selamlamamıza gidiyoruz.', '17:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d02', 2, 'Medine ziyaretleri', '', '07:30', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d03', 3, 'Medine kuyu ziyaretleri', '', '14:30', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d04', 4, 'Mekke''ye geçiş', 'Mekke''ye geçiş için hazır olunuz.', '12:30', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d05', 5, 'Mekke ziyaretleri', '', '13:30', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d06', 6, 'Cuma namazı', 'Yoğunluktan dolayı Cuma namazı için saat 09:00''da Harem''de olunuz.', '09:00', 'Harem-i Şerif', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d07', 7, 'Mekke yakın ziyaretler', 'Yürüme zorluğu çeken misafirlerimizin bu ziyarete katılmaması önerilir.', '04:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d08', 8, 'Ci''râne umresi', 'Umre yapmak isteyenler ihram giyebilir.', '21:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d09', 9, 'Serbest gün', '', NULL, NULL, "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d10', 10, 'Nur Dağı çıkışı', 'Rahat ayakkabı giyiniz.', '08:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d11', 11, 'Hudeybiye umresi', 'İhramlı ve abdestli olarak hazır olunuz.', '17:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d12', 12, 'Serbest gün', '', NULL, NULL, "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d13', 13, 'Cuma namazı', 'Yoğunluktan dolayı Cuma namazı için saat 09:00''da Harem''de olunuz.', '09:00', 'Harem-i Şerif', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d14', 14, 'Serbest gün', '', NULL, NULL, "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d15', 15, 'Taif ziyaretleri', '', '07:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d16', 16, 'Serbest gün', '', NULL, NULL, "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d17', 17, 'Cidde gezisi', '', '13:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d18', 18, 'Ten''im umresi', '', '21:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d19', 19, 'Serbest gün', '', '22:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";
INSERT INTO "TourDayProgram" ("id", "dayNumber", "title", "description", "time", "place", "tourId", "createdAt")
  SELECT 'dp11560d20', 20, 'Dönüş', 'Çantalar hazır olacak şekilde otel lobisinde buluşuyoruz.', '07:00', 'Otel lobisi', "tourId", (CAST(strftime('%s', 'now') AS INTEGER) * 1000) FROM "_ornek_tur";

-- Program Pazar günü başlıyor (6. ve 13. gün Cuma): örnek tarih 10 Kasım ise 8–27 Kasım 2026'ya al
UPDATE "Tour"
  SET "departureDate" = 1794096000000, "returnDate" = 1795737600000, "updatedAt" = (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
  WHERE "id" IN (SELECT "tourId" FROM "_ornek_tur") AND "departureDate" = 1794268800000;

DROP TABLE "_ornek_tur";
