-- Satış personeli rolü (SALES): yalnızca Satış Programı'na (/satis) girer.
-- Kurulumdaki ortak "Personel" hesabı bu role geçirilir; Alperen ve Ömer
-- (STAFF: site + satış) aynı kalır. Rol, yöneticinin Kullanıcılar sayfasından değiştirilebilir.
UPDATE "User" SET "role" = 'SALES' WHERE "email" = 'personel@nemiraturizm.com' AND "role" = 'STAFF';
