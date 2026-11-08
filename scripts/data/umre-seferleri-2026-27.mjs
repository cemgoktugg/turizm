// 2026-27 umre seferleri (web sitesi). Bir kez çalışır; bkz. scripts/data-updates.mjs.
// - 8 sefer eklenir (Aralık 2026 – Mart 2027)
// - Örnek umre turları silinir: 10 Günlük Ekonomik, 13 Günlük Ekonomik – Kasım, Ramazan Umresi 2027.
//   "20 Günlük Umre Programı" (8 Kasım) kalır. Yeni Ramazan seferi eski Ramazan adresini
//   (/turlar/ramazan-umresi-2027) devralır; ana sayfadaki bağlantılar kırılmaz.
// - Dahil / hariç hizmetler, gerekli belgeler ve SSS kalan 20 günlük turdan kopyalanır.
// Kontenjanlar (135, 45, …) sitede gösterilmediği için kaydedilmez.

const KIDS = [
  ["0-2 yaş bebek", 550],
  ["2-6 yaş çocuk", 850],
  ["6-11 yaş çocuk", 1000],
];
const P20 = [1690, 1640, 1590];
const P14 = [1590, 1540, 1490];
const PRAMAZAN = [2220, 2050, 1900];

const kudi = (nights) => ({ city: "Mekke", name: "Kudi Tower", nights, distance: "Mescid-i Haram'a 1400 m", image: "/images/otel-mekke-2.svg" });
const konak = (nights) => ({ city: "Medine", name: "Konak grup otelleri", nights, distance: "Mescid-i Nebevi'ye 300 m", image: "/images/otel-medine-2.svg" });
const servisli = (nights) => ({
  city: "Mekke",
  name: "Mekke oteli (Harem'e servisli)",
  nights,
  distance: "Mescid-i Haram'a 3–4 km, servisli",
  image: "/images/otel-mekke-1.svg",
});

const SIVAS = { departureCity: "Sivas", airline: "Sivas direkt uçuş" };
const ISTANBUL = { departureCity: "İstanbul", airline: "İstanbul uçuşlu" };
const NO_FLIGHT = { departureCity: null, airline: null };

const SEFERLER = [
  {
    slug: "umre-20-gun-15-aralik-2026",
    title: "20 Günlük Umre — 15 Aralık",
    badge: "Sivas Direkt Uçuş",
    date: "2026-12-15",
    days: 20,
    flight: SIVAS,
    prices: P20,
    hotels: [kudi(16), konak(3)],
    cover: "/images/tur-20-gun-umre.svg",
    featured: true,
  },
  {
    slug: "umre-14-gun-20-aralik-2026",
    title: "14 Günlük Umre — 20 Aralık",
    badge: "İstanbul Uçuşlu",
    date: "2026-12-20",
    days: 14,
    flight: ISTANBUL,
    prices: P14,
    hotels: [kudi(12), konak(2)],
    cover: "/images/tur-ekonomik-umre.svg",
  },
  {
    slug: "umre-20-gun-30-aralik-2026-mirac-kandili",
    title: "20 Günlük Miraç Kandili Umresi — 30 Aralık",
    badge: "Miraç Kandili",
    date: "2026-12-30",
    days: 20,
    flight: SIVAS,
    prices: P20,
    hotels: [kudi(16), konak(3)],
    cover: "/images/tur-20-gun-umre.svg",
    featured: true,
    intro: "Miraç Kandili'ni kutsal topraklarda idrak etme fırsatı sunan programımız.",
  },
  {
    slug: "umre-19-gun-18-ocak-2027-somestr",
    title: "19 Günlük Sömestr Umresi — 18 Ocak",
    badge: "Sömestr Tatili",
    date: "2027-01-18",
    days: 19,
    flight: SIVAS,
    prices: P20,
    hotels: [kudi(null), konak(null)],
    cover: "/images/tur-20-gun-umre.svg",
    intro: "Okulların yarıyıl tatiline denk gelen, aileler için uygun programımız.",
  },
  {
    slug: "umre-14-gun-22-ocak-2027-somestr",
    title: "14 Günlük Sömestr Umresi — 22 Ocak",
    badge: "Sömestr Tatili",
    date: "2027-01-22",
    days: 14,
    flight: SIVAS,
    prices: P14,
    hotels: [kudi(12), konak(2)],
    cover: "/images/tur-ekonomik-umre.svg",
    intro: "Okulların yarıyıl tatiline denk gelen, aileler için uygun programımız.",
  },
  {
    slug: "ramazan-umresi-2027",
    category: "ramazan-umresi",
    title: "Tam Ramazan Umresi — 35 Gün (5 Şubat)",
    badge: "Tam Ramazan",
    date: "2027-02-05",
    days: 35,
    flight: NO_FLIGHT,
    prices: PRAMAZAN,
    hotels: [servisli(32), konak(3)],
    cover: "/images/tur-ramazan-umresi.svg",
    featured: true,
    intro: "Ramazan ayının tamamını kutsal topraklarda geçirme imkânı. Mekke'deki otelimiz Harem'e 3–4 km mesafededir ve Harem'e servis vardır.",
  },
  {
    slug: "sevval-umresi-14-gun-2027",
    title: "14 Günlük Şevval Umresi — 12 Mart",
    badge: "Şevval Umresi",
    date: "2027-03-12",
    days: 14,
    flight: NO_FLIGHT,
    prices: P14,
    hotels: [kudi(12), konak(2)],
    cover: "/images/tur-ekonomik-umre.svg",
    intro: "Ramazan Bayramı'nın ardından, Şevval ayında umre.",
  },
  {
    slug: "sevval-umresi-20-gun-2027",
    title: "20 Günlük Şevval Umresi — 12 Mart",
    badge: "Şevval Umresi",
    date: "2027-03-12",
    days: 20,
    flight: NO_FLIGHT,
    prices: P20,
    hotels: [kudi(16), konak(3)],
    cover: "/images/tur-20-gun-umre.svg",
    intro: "Ramazan Bayramı'nın ardından, Şevval ayında umre.",
  },
];

/** Silinecek örnek turlar (adres veya tur numarasıyla) */
const DELETE = { slugs: ["10-gunluk-ekonomik-umre", "13-gunluk-ekonomik-umre-kasim", "ramazan-umresi-2027"], codes: ["11543", "11542", "11600"] };
const KEEP_SLUG = "20-gunluk-umre-programi";

const day = (iso, add = 0) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + add);
  return d;
};

const nightsText = (n) => (n ? `, ${n} gece` : "");

function texts(s) {
  const [mekke, medine] = s.hotels;
  const flight =
    s.flight === SIVAS ? "Sivas'tan direkt uçuşla" : s.flight === ISTANBUL ? "İstanbul üzerinden uçuşla" : "";
  const stay = mekke.nights && medine.nights ? ` ${mekke.nights} gece Mekke, ${medine.nights} gece Medine.` : "";
  const short = `${[flight, `${s.days} günlük umre programı`].filter(Boolean).join(" ")}.${stay}`.replace(/^./, (c) => c.toLocaleUpperCase("tr"));
  const description = [
    s.intro ?? "",
    `${short}`,
    "## Konaklama",
    `- **Mekke:** ${mekke.name}, ${mekke.distance}${nightsText(mekke.nights)}`,
    `- **Medine:** ${medine.name}, ${medine.distance}${nightsText(medine.nights)}`,
    // Fiyatlar burada yazılmaz: sayfadaki fiyat tablosundan gösterilir (panelden değişince metin eskimesin)
  ]
    .filter(Boolean)
    .join("\n");
  return { short, description };
}

export const umreSeferleri202627 = {
  id: "umre-seferleri-2026-27",
  /** @param {import("@prisma/client").Prisma.TransactionClient} tx */
  async run(tx) {
    const log = [];
    const template = await tx.tour.findUnique({ where: { slug: KEEP_SLUG }, include: { faqs: { orderBy: { order: "asc" } } } });

    // 1) Örnek turları sil (bağlı fiyat, otel, SSS… birlikte silinir; talepler tur adıyla kalır)
    const toDelete = await tx.tour.findMany({
      where: { OR: [{ slug: { in: DELETE.slugs } }, { code: { in: DELETE.codes } }], NOT: { slug: KEEP_SLUG } },
      select: { id: true, slug: true, title: true },
    });
    for (const t of toDelete) {
      await tx.tour.delete({ where: { id: t.id } });
      log.push(`silindi: ${t.title}`);
    }

    // 2) Seferleri ekle
    const categories = await tx.tourCategory.findMany({ select: { id: true, slug: true } });
    const umre = categories.find((c) => c.slug === "umre") ?? categories[0];
    if (!umre) throw new Error("Tur kategorisi yok");
    const codes = await tx.tour.findMany({ where: { code: { not: null } }, select: { code: true } });
    let nextCode = codes.reduce((m, r) => (Number.isInteger(Number(r.code)) && Number(r.code) > m ? Number(r.code) : m), 1000);

    for (const s of SEFERLER) {
      if (await tx.tour.findUnique({ where: { slug: s.slug }, select: { id: true } })) {
        log.push(`atlandı (adres kullanımda): ${s.slug}`);
        continue;
      }
      const categoryId = (s.category && categories.find((c) => c.slug === s.category)?.id) || umre.id;
      const { short, description } = texts(s);
      const hotelNights = s.hotels.reduce((t, h) => t + (h.nights ?? 0), 0);
      const rooms = [
        ["2 kişilik odada", s.prices[0]],
        ["3 kişilik odada", s.prices[1]],
        ["4 kişilik odada", s.prices[2]],
        ...KIDS,
      ];
      await tx.tour.create({
        data: {
          code: String(++nextCode),
          badge: s.badge,
          title: s.title,
          slug: s.slug,
          categoryId,
          shortDescription: short,
          description,
          departureDate: day(s.date),
          returnDate: day(s.date, s.days - 1),
          durationDays: s.days,
          // Gece sayısı yalnızca otel geceleri günle tutarlıysa yazılır
          durationNights: hotelNights === s.days - 1 ? hotelNights : null,
          departureCity: s.flight.departureCity,
          airline: s.flight.airline,
          startingPrice: Math.min(...s.prices),
          currency: "USD",
          coverImage: s.cover,
          includedServices: template?.includedServices ?? null,
          excludedServices: template?.excludedServices ?? null,
          requiredDocuments: template?.requiredDocuments ?? null,
          isFeatured: Boolean(s.featured),
          isPublished: true,
          seoDescription: short,
          images: {
            create: [s.cover, s.hotels[0].image, s.hotels[1].image].map((url, i) => ({ url, alt: `${s.title} görsel ${i + 1}`, order: i })),
          },
          prices: { create: rooms.map(([roomType, price], i) => ({ roomType, price, currency: "USD", order: i })) },
          hotels: { create: s.hotels.map((h, i) => ({ ...h, order: i })) },
          faqs: { create: (template?.faqs ?? []).map((f, i) => ({ question: f.question, answer: f.answer, order: i })) },
        },
      });
      log.push(`eklendi: ${s.title}`);
    }

    // 3) Silinen turlara giden hikâye düğmeleri umre sayfasına (Ramazan adresi yeni sefere geçti)
    const reused = new Set(SEFERLER.map((s) => s.slug));
    for (const t of toDelete.filter((t) => !reused.has(t.slug))) {
      const { count } = await tx.story.updateMany({ where: { buttonUrl: `/turlar/${t.slug}` }, data: { buttonUrl: "/umre" } });
      if (count) log.push(`hikâye bağlantısı /umre yapıldı: ${t.slug}`);
    }
    return log;
  },
};
