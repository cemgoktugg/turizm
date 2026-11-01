-- Tek kişilik oda kaldırıldı: yalnızca tek kişilik fiyatı olan turlarda bu fiyat 2 kişilik odaya taşınır
UPDATE "ServiceTour" SET "price2" = "price" WHERE "price2" IS NULL AND "price3" IS NULL AND "price4" IS NULL;
ALTER TABLE "ServiceTour" DROP COLUMN "price";

-- Kaydı yapan kullanıcı (eski kayıtlarda boş kalır)
ALTER TABLE "Sale" ADD COLUMN "createdByName" TEXT;
ALTER TABLE "Payment" ADD COLUMN "createdByName" TEXT;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "detail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_entityId_idx" ON "ActivityLog"("entity", "entityId");
