-- AlterTable
ALTER TABLE "ServiceTour" ADD COLUMN "guideToken" TEXT;

-- AlterTable
ALTER TABLE "TourRoom" ADD COLUMN "meccaNo" TEXT;
ALTER TABLE "TourRoom" ADD COLUMN "medinaNo" TEXT;

-- CreateTable
CREATE TABLE "RoomingUndo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tourId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomingUndo_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "ServiceTour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RoomingUndo_tourId_idx" ON "RoomingUndo"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTour_guideToken_key" ON "ServiceTour"("guideToken");

