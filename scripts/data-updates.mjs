// Canlı içerik güncellemeleri (ör. yeni tur seferleri). Konteyner açılışında çalışır;
// her güncelleme yalnızca BİR KEZ uygulanır ve SiteSetting'e "_veri:<id>" anahtarıyla
// işaretlenir. Böylece sonradan panelden yapılan düzeltmeler bir daha ezilmez.
// Hata olursa güncelleme geri alınır, site yine de açılır (bir sonraki açılışta yeniden denenir).
import { PrismaClient } from "@prisma/client";
import { umreSeferleri202627 } from "./data/umre-seferleri-2026-27.mjs";
import { gercekFotograflar } from "./data/gercek-fotograflar.mjs";
import { medineOteliGrandAlshahba } from "./data/medine-oteli-grand-alshahba.mjs";
import { otelFotograflari } from "./data/otel-fotograflari.mjs";
import { sliderFotograflari } from "./data/slider-fotograflari.mjs";

// Sırayla uygulanır (yeni seferler önce eklenir, fotoğraflar sonra onların kapaklarını da günceller)
const UPDATES = [umreSeferleri202627, gercekFotograflar, medineOteliGrandAlshahba, otelFotograflari, sliderFotograflari];

const prisma = new PrismaClient();
try {
  for (const u of UPDATES) {
    const key = `_veri:${u.id}`;
    if (await prisma.siteSetting.findUnique({ where: { key } })) continue;
    try {
      const log = await prisma.$transaction(
        async (tx) => {
          const lines = await u.run(tx);
          await tx.siteSetting.create({ data: { key, value: new Date().toISOString() } });
          return lines;
        },
        { timeout: 60_000 },
      );
      console.log(`[veri] ${u.id} uygulandı:\n  - ${log.join("\n  - ")}`);
    } catch (e) {
      console.error(`[veri] ${u.id} uygulanamadı (geri alındı):`, e);
    }
  }
} finally {
  await prisma.$disconnect();
}
