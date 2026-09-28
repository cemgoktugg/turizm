-- CreateTable
CREATE TABLE "TourHotel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nights" INTEGER,
    "stars" INTEGER,
    "distance" TEXT,
    "image" TEXT,
    "videoUrl" TEXT,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourHotel_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TourLeg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'flight',
    "title" TEXT NOT NULL,
    "carrier" TEXT,
    "flightNo" TEXT,
    "fromCode" TEXT,
    "fromCity" TEXT,
    "toCode" TEXT,
    "toCity" TEXT,
    "date" DATETIME,
    "time" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourLeg_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "tourId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Veri taşıma: mevcut Mekke/Medine otel bilgileri otel kartlarına aktarılır
INSERT INTO "TourHotel" ("id", "city", "name", "distance", "order", "tourId")
SELECT lower(hex(randomblob(12))), 'Mekke', trim("makkahHotel"), NULLIF(trim("makkahDistance"), ''), 0, "id"
FROM "Tour"
WHERE "makkahHotel" IS NOT NULL AND trim("makkahHotel") NOT IN ('', '-', '—');

INSERT INTO "TourHotel" ("id", "city", "name", "distance", "order", "tourId")
SELECT lower(hex(randomblob(12))), 'Medine', trim("madinahHotel"), NULLIF(trim("madinahDistance"), ''), 1, "id"
FROM "Tour"
WHERE "madinahHotel" IS NOT NULL AND trim("madinahHotel") NOT IN ('', '-', '—');

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "badge" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "departureDate" DATETIME,
    "returnDate" DATETIME,
    "durationDays" INTEGER,
    "durationNights" INTEGER,
    "departureCity" TEXT,
    "airline" TEXT,
    "startingPrice" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priceNote" TEXT,
    "coverImage" TEXT,
    "includedServices" TEXT,
    "excludedServices" TEXT,
    "requiredDocuments" TEXT,
    "seatsLeft" INTEGER,
    "videoUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tour_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TourCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tour" ("airline", "categoryId", "coverImage", "createdAt", "currency", "departureCity", "departureDate", "description", "durationDays", "durationNights", "excludedServices", "id", "includedServices", "isFeatured", "isPublished", "priceNote", "requiredDocuments", "returnDate", "seoDescription", "seoTitle", "shortDescription", "slug", "startingPrice", "title", "updatedAt") SELECT "airline", "categoryId", "coverImage", "createdAt", "currency", "departureCity", "departureDate", "description", "durationDays", "durationNights", "excludedServices", "id", "includedServices", "isFeatured", "isPublished", "priceNote", "requiredDocuments", "returnDate", "seoDescription", "seoTitle", "shortDescription", "slug", "startingPrice", "title", "updatedAt" FROM "Tour";
DROP TABLE "Tour";
ALTER TABLE "new_Tour" RENAME TO "Tour";
CREATE UNIQUE INDEX "Tour_code_key" ON "Tour"("code");
CREATE UNIQUE INDEX "Tour_slug_key" ON "Tour"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Review_tourId_isApproved_idx" ON "Review"("tourId", "isApproved");

-- Mevcut turlara oluşturulma sırasına göre tur numarası ver (1001, 1002, …)
UPDATE "Tour" SET "code" = CAST(1000 + (
  SELECT COUNT(*) FROM "Tour" AS t2
  WHERE t2."createdAt" < "Tour"."createdAt" OR (t2."createdAt" = "Tour"."createdAt" AND t2."id" <= "Tour"."id")
) AS TEXT)
WHERE "code" IS NULL;
