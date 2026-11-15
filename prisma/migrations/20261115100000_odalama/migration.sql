-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "gender" TEXT;

-- CreateTable
CREATE TABLE "TourRoom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tourId" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourRoom_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "ServiceTour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "passenger" TEXT,
    "listPrice" INTEGER,
    "price" INTEGER NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdByName" TEXT,
    "groupId" INTEGER,
    "roomId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "ServiceTour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SaleGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TourRoom" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "createdByName", "customerId", "date", "groupId", "id", "isCancelled", "listPrice", "note", "passenger", "price", "reference", "roomSize", "tourId", "updatedAt") SELECT "createdAt", "createdByName", "customerId", "date", "groupId", "id", "isCancelled", "listPrice", "note", "passenger", "price", "reference", "roomSize", "tourId", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_tourId_idx" ON "Sale"("tourId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_groupId_idx" ON "Sale"("groupId");
CREATE INDEX "Sale_roomId_idx" ON "Sale"("roomId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TourRoom_tourId_idx" ON "TourRoom"("tourId");

