-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "passenger" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceTour" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "departureDate" DATETIME NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "price2" INTEGER,
    "price3" INTEGER,
    "price4" INTEGER,
    "priceAge0to2" INTEGER,
    "priceAge2to6" INTEGER,
    "priceAge6to11" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "accommodation" TEXT,
    "guide1Id" INTEGER,
    "guide2Id" INTEGER,
    "days" INTEGER NOT NULL,
    "capacity" INTEGER,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceTour_guide1Id_fkey" FOREIGN KEY ("guide1Id") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceTour_guide2Id_fkey" FOREIGN KEY ("guide2Id") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceTour" ("accommodation", "capacity", "createdAt", "currency", "days", "departureDate", "guide1Id", "guide2Id", "id", "isActive", "name", "note", "period", "price2", "price3", "price4", "returnDate", "updatedAt") SELECT "accommodation", "capacity", "createdAt", "currency", "days", "departureDate", "guide1Id", "guide2Id", "id", "isActive", "name", "note", "period", "price2", "price3", "price4", "returnDate", "updatedAt" FROM "ServiceTour";
DROP TABLE "ServiceTour";
ALTER TABLE "new_ServiceTour" RENAME TO "ServiceTour";
CREATE INDEX "ServiceTour_period_idx" ON "ServiceTour"("period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
