-- Aile / grup satışları: SaleGroup, Sale.groupId, Payment.batchId (grup tahsilatı parçaları).
-- Mevcut satış ve tahsilatlar aynen korunur (Sale tablosu SQLite gereği yeniden kurulur).

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "batchId" TEXT;

-- CreateTable
CREATE TABLE "SaleGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "tourId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "note" TEXT,
    "reference" TEXT,
    "roomSize" INTEGER,
    "price" INTEGER NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdByName" TEXT,
    "groupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "ServiceTour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SaleGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "createdByName", "customerId", "date", "id", "isCancelled", "note", "price", "reference", "roomSize", "tourId", "updatedAt") SELECT "createdAt", "createdByName", "customerId", "date", "id", "isCancelled", "note", "price", "reference", "roomSize", "tourId", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_tourId_idx" ON "Sale"("tourId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_groupId_idx" ON "Sale"("groupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Payment_batchId_idx" ON "Payment"("batchId");

