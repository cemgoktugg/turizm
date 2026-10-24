-- İletişim bilgileri: örnek değerler gerçek bilgilerle değiştirilir.
-- Panelden farklı bir değer girilmişse ona dokunulmaz. (Şema değişikliği yok.)

UPDATE "SiteSetting" SET "value" = '0501 565 58 44' WHERE "key" = 'phone' AND "value" = '+90 850 000 00 00';
UPDATE "SiteSetting" SET "value" = '905015655844' WHERE "key" = 'whatsapp' AND "value" = '905000000000';
UPDATE "SiteSetting" SET "value" = 'Camii Kebir Mah. Ulu Cami Sok. Ulu Çarşı No:4/A Merkez / Sivas'
  WHERE "key" = 'address' AND "value" = 'Merkez Mah. Huzur Cad. No:1 Fatih / İstanbul';
UPDATE "SiteSetting"
  SET "value" = 'https://maps.google.com/maps?q=Nemira%20Turizm%2C%20Cami-i%20Kebir%2C%20Ulu%20Camii%20Sk.%20No%3A4%2C%20Sivas%20Merkez%2C%20Sivas&z=17&hl=tr&output=embed'
  WHERE "key" = 'mapEmbed' AND ("value" = '' OR "value" LIKE '%2d28.955!3d41.019%');
