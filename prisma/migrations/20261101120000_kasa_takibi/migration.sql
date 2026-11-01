-- Parayı alan kişi; eski tahsilatlarda kaydı giren kişi varsayılır (o da boşsa boş kalır)
ALTER TABLE "Payment" ADD COLUMN "receivedByName" TEXT;
UPDATE "Payment" SET "receivedByName" = "createdByName";

-- CreateTable
CREATE TABLE "CashHandover" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "fromName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CashHandover_fromName_idx" ON "CashHandover"("fromName");

-- Personel hesapları yönetici yetkisinden çıkarılır
UPDATE "User" SET "role" = 'STAFF' WHERE "email" IN ('alperen@nemiraturizm.com', 'omer@nemiraturizm.com', 'personel@nemiraturizm.com');
