// Umre seferlerinin otelleri: Kudi Tower (Mekke) ve Grand Alshahba Hotel (Medine).
// Bir kez çalışır; bkz. scripts/data-updates.mjs.
// - Tur sayfalarındaki otel kartlarına otelin dış cephe fotoğrafı (kartta hâlâ çizim varsa)
// - Bu otellerin kullanıldığı turların galerisinde otel çizimleri yerine otel fotoğrafları
// - "Oteller" bölümüne iki otel (ana sayfadaki "Mekke & Medine Otellerimiz" dahil)
// - İlk kurulumdaki örnek oteller yayından kaldırılır (panelde durur, istenirse yeniden açılır)
// Fotoğraflar otellerin rezervasyon sitelerindeki tanıtım fotoğraflarıdır (public/images/oteller).

const kudi = (n) => `/images/oteller/kudi-tower-${n}.webp`;
const shahba = (n) => `/images/oteller/grand-alshahba-${n}.webp`;

const HOTELS = [
  {
    tourHotelName: "Kudi Tower",
    galleryPlaceholder: /^\/images\/otel-mekke-\d\.svg$/,
    gallery: [kudi(1), kudi(4)], // dış cephe, oda
    hotel: {
      name: "Kudi Tower",
      slug: "kudi-tower",
      city: "Mekke",
      distance: "Mescid-i Haram'a 1400 m",
      description: "Umre programlarımızda Mekke'de konakladığımız otel. Geniş lobi, klimalı odalar, özel banyo ve ücretsiz Wi-Fi.",
      images: [1, 2, 3, 4, 5, 6].map(kudi),
    },
  },
  {
    tourHotelName: "Grand Alshahba Hotel",
    galleryPlaceholder: /^\/images\/otel-medine-\d\.svg$/,
    gallery: [shahba(1), shahba(2)], // dış cephe, oda
    hotel: {
      name: "Grand Alshahba Hotel",
      slug: "grand-alshahba-hotel",
      city: "Medine",
      distance: "Mescid-i Nebevi'ye 300 m",
      description: "Umre programlarımızda Medine'de konakladığımız otel. Açık büfe kahvaltı, restoran, klimalı odalar ve ücretsiz Wi-Fi.",
      images: [1, 2, 3, 4, 5, 6].map(shahba),
    },
  },
];

/** İlk kurulumdaki örnek oteller (seed) */
const SAMPLE_HOTEL_SLUGS = ["swissotel-al-maqam", "rua-al-hijra", "al-massa-makkah", "the-oberoi-madina", "dallah-taibah", "dar-al-eiman-al-manar"];

const isPlaceholder = (url) => !url || /^\/images\/[a-z0-9-]+\.svg$/.test(url);

export const otelFotograflari = {
  id: "otel-fotograflari-kudi-alshahba",
  /** @param {import("@prisma/client").Prisma.TransactionClient} tx */
  async run(tx) {
    const log = [];
    for (const h of HOTELS) {
      // Otel kartları
      const cards = await tx.tourHotel.findMany({ where: { name: h.tourHotelName }, select: { id: true, tourId: true, image: true } });
      let cardCount = 0;
      for (const c of cards.filter((c) => isPlaceholder(c.image))) {
        await tx.tourHotel.update({ where: { id: c.id }, data: { image: h.hotel.images[0] } });
        cardCount++;
      }
      // Bu oteli kullanan turların galerisi: otel çizimi yerine otel fotoğrafları
      let galleryCount = 0;
      for (const tourId of new Set(cards.map((c) => c.tourId))) {
        const imgs = await tx.tourImage.findMany({ where: { tourId }, orderBy: { order: "asc" } });
        const placeholders = imgs.filter((i) => h.galleryPlaceholder.test(i.url));
        if (placeholders.length === 0) continue;
        await tx.tourImage.update({ where: { id: placeholders[0].id }, data: { url: h.gallery[0], alt: h.hotel.name } });
        for (const extra of placeholders.slice(1)) await tx.tourImage.delete({ where: { id: extra.id } });
        const maxOrder = Math.max(...imgs.map((i) => i.order));
        if (!imgs.some((i) => i.url === h.gallery[1]))
          await tx.tourImage.create({ data: { tourId, url: h.gallery[1], alt: `${h.hotel.name} oda`, order: maxOrder + 1 } });
        galleryCount++;
      }
      // Oteller bölümü
      const existing = await tx.hotel.findUnique({ where: { slug: h.hotel.slug } });
      if (!existing) {
        await tx.hotel.create({ data: { ...h.hotel, images: h.hotel.images.join("\n"), isPublished: true } });
        log.push(`otel eklendi: ${h.hotel.name}`);
      }
      log.push(`${h.hotel.name}: ${cardCount} otel kartı, ${galleryCount} tur galerisi`);
    }
    const hidden = await tx.hotel.updateMany({ where: { slug: { in: SAMPLE_HOTEL_SLUGS }, isPublished: true }, data: { isPublished: false } });
    log.push(`örnek oteller yayından kaldırıldı: ${hidden.count}`);
    return log;
  },
};
