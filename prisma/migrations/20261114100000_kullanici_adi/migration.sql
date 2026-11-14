-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Mevcut panel hesaplarına kullanıcı adı (girişte e-posta yerine yazılabilir)
UPDATE "User" SET "username" = 'omer' WHERE "email" = 'omer@nemiraturizm.com';
UPDATE "User" SET "username" = 'alperen' WHERE "email" = 'alperen@nemiraturizm.com';
UPDATE "User" SET "username" = 'ofis' WHERE "email" = 'ofis@nemiraturizm.com';
UPDATE "User" SET "username" = 'personel' WHERE "email" = 'personel@nemiraturizm.com';
