// İlk kurulumdaki çizim (SVG) görsellerin yerine gerçek fotoğraflar: kategori kartları,
// tur kapakları / galerileri ve hikâyeler. Bir kez çalışır; bkz. scripts/data-updates.mjs.
// Yalnızca hâlâ varsayılan SVG'yi kullanan kayıtlar değişir; panelden yüklenen görsellere dokunulmaz.
// Otel görselleri değişmez (cami fotoğrafı belirli bir oteli temsil etmez).
//
// Fotoğraflar Wikimedia Commons'tan, CC0 / kamu malı (atıf gerekmez, ticari kullanım serbest):
//   umre-kabe            File:Masjid al-Haram 2022.jpg (CC0)
//   harem-gece           File:Masjidul-HaramAerialView (cropped).jpg (CC0)
//   kabe-saat-kulesi     File:The Holy Mosque in Mecca.jpg (Public domain)
//   medine-yesil-kubbe   File:Masjid Al Nabawi (17948287651).jpg (CC0)
//   hac-arafat           File:Mount Arafat(Jabal ar-Raḥmah).jpg (CC0)
//   kudus-mescid-i-aksa  File:Jerusalem Temple Mount Al-Aqsa Mosque (43195416601).jpg (CC0)
//   mostar               File:Sunset at Stari Most, Mostar.jpg (CC0)
//   kabe-kapisi          File:Kiswah, Kaaba - 7 May 2016.jpg (CC0)
//   medine-kusbakisi     File:Al-Masjid An-Nabawi (Bird's Eye View).jpg (CC0)
//   medine-genis         File:Wide shot of the Green Dome at The Prophet's Mosque (Al Masjid-e-Nabawi).jpg (CC0)

const F = (name) => `/images/foto/${name}.webp`;

const MAP = {
  // Kategori kartları
  "/images/kategori-umre.svg": F("umre-kabe"),
  "/images/kategori-hac.svg": F("hac-arafat"),
  "/images/kategori-luks.svg": F("kabe-saat-kulesi"),
  "/images/kategori-ramazan.svg": F("harem-gece"),
  "/images/kategori-kultur.svg": F("mostar"),
  // Tur kapakları
  "/images/tur-20-gun-umre.svg": F("umre-kabe"),
  "/images/tur-ekonomik-umre.svg": F("medine-yesil-kubbe"),
  "/images/tur-ramazan-umresi.svg": F("harem-gece"),
  "/images/tur-luks-umre.svg": F("kabe-saat-kulesi"),
  "/images/tur-hac-2026.svg": F("hac-arafat"),
  "/images/tur-kudus.svg": F("kudus-mescid-i-aksa"),
  "/images/tur-balkan.svg": F("mostar"),
};

/** Umre seferleri ana sayfada yan yana çıkar; hepsi aynı fotoğrafı göstermesin diye ayrı kapaklar */
const SLUG_COVERS = {
  "umre-20-gun-15-aralik-2026": F("kabe-saat-kulesi"),
  "umre-14-gun-20-aralik-2026": F("medine-yesil-kubbe"),
  "umre-20-gun-30-aralik-2026-mirac-kandili": F("kabe-kapisi"),
  "umre-19-gun-18-ocak-2027-somestr": F("medine-kusbakisi"),
  "umre-14-gun-22-ocak-2027-somestr": F("medine-genis"),
  "ramazan-umresi-2027": F("harem-gece"),
  "sevval-umresi-14-gun-2027": F("medine-yesil-kubbe"),
  "sevval-umresi-20-gun-2027": F("umre-kabe"),
};

const isDefaultSvg = (url) => typeof url === "string" && /^\/images\/[a-z0-9-]+\.svg$/.test(url);

export const gercekFotograflar = {
  id: "gercek-fotograflar-2026-11",
  /** @param {import("@prisma/client").Prisma.TransactionClient} tx */
  async run(tx) {
    const counts = { kategori: 0, turKapak: 0, turGaleri: 0, hikaye: 0 };
    for (const [slug, to] of Object.entries(SLUG_COVERS)) {
      const tour = await tx.tour.findUnique({ where: { slug }, select: { id: true, coverImage: true } });
      if (!tour || !isDefaultSvg(tour.coverImage)) continue;
      await tx.tour.update({ where: { id: tour.id }, data: { coverImage: to } });
      counts.turKapak++;
      counts.turGaleri += (await tx.tourImage.updateMany({ where: { tourId: tour.id, url: tour.coverImage }, data: { url: to } })).count;
    }
    for (const [from, to] of Object.entries(MAP)) {
      counts.kategori += (await tx.tourCategory.updateMany({ where: { image: from }, data: { image: to } })).count;
      counts.turKapak += (await tx.tour.updateMany({ where: { coverImage: from }, data: { coverImage: to } })).count;
      // Galerilerde yalnızca turun kendi kapak çizimi değişir; genel kategori çizimleri (ör. Kudüs
      // galerisindeki "kültür" görseli) başka bir yerin fotoğrafına dönüşmesin diye olduğu gibi kalır
      if (from.startsWith("/images/tur-"))
        counts.turGaleri += (await tx.tourImage.updateMany({ where: { url: from }, data: { url: to } })).count;
      counts.hikaye += (await tx.story.updateMany({ where: { cover: from }, data: { cover: to } })).count;
      counts.hikaye += (await tx.storyItem.updateMany({ where: { url: from }, data: { url: to } })).count;
    }
    // Aynı turun galerisinde aynı fotoğraf iki kez kalmasın (kapak ve kategori görseli eşleşebilir)
    const images = await tx.tourImage.findMany({ where: { url: { startsWith: "/images/foto/" } }, orderBy: [{ tourId: "asc" }, { order: "asc" }] });
    const seen = new Set();
    let dup = 0;
    for (const img of images) {
      const k = `${img.tourId} ${img.url}`;
      if (seen.has(k)) {
        await tx.tourImage.delete({ where: { id: img.id } });
        dup++;
      } else seen.add(k);
    }
    return [
      `kategori görseli: ${counts.kategori}`,
      `tur kapağı: ${counts.turKapak}`,
      `tur galerisi: ${counts.turGaleri} (yinelenen ${dup} silindi)`,
      `hikâye: ${counts.hikaye}`,
    ];
  },
};
