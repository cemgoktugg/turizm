// Ana sayfa slider'ı: ilk kurulumdaki çizimlerin (hero-1/2/3.svg) yerine fotoğraflar.
// Bir kez çalışır; bkz. scripts/data-updates.mjs. Yalnızca hâlâ varsayılan çizimi kullanan
// slaytlar değişir; panelden seçilen / yüklenen görsellere ve slayt metinlerine dokunulmaz.
//
// Fotoğraflar Wikimedia Commons'tan, CC0 (atıf gerekmez, ticari kullanım serbest).
// Yazı solda durduğu ve telefonda orta şerit göründüğü için konu ortaya gelecek şekilde kırpıldı:
//   slider-kabe         File:Masjid al-Haram 2022.jpg
//   slider-medine       File:Al-Masjid An-Nabawi (Bird's Eye View).jpg
//   slider-harem-gece   File:Masjidul-HaramAerialView (cropped).jpg

const F = (name) => `/images/foto/${name}.webp`;

const MAP = {
  "/images/hero-1.svg": F("slider-kabe"),
  "/images/hero-2.svg": F("slider-medine"),
  "/images/hero-3.svg": F("slider-harem-gece"),
};

export const sliderFotograflari = {
  id: "slider-fotograflari-2026-11",
  /** @param {import("@prisma/client").Prisma.TransactionClient} tx */
  async run(tx) {
    const block = await tx.contentBlock.findUnique({ where: { key: "home.hero" } });
    // Kayıt yoksa sitede varsayılan içerik görünür; varsayılanlar zaten bu fotoğrafları kullanıyor
    if (!block) return ["slider panelden kaydedilmemiş; varsayılan fotoğraflar kullanılıyor"];
    const data = JSON.parse(block.data);
    let changed = 0;
    for (const slide of Array.isArray(data.slides) ? data.slides : []) {
      const to = MAP[slide?.image];
      if (to) {
        slide.image = to;
        changed++;
      }
    }
    if (changed) await tx.contentBlock.update({ where: { key: "home.hero" }, data: { data: JSON.stringify(data) } });
    return [`slider görseli: ${changed}`];
  },
};
