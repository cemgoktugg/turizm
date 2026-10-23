import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * "YYYY-MM-DD" → Date (UTC gece yarısı; admin formundaki tarih alanıyla aynı biçim).
 * Ramazan ve Hac tarihleri hicri takvime göre yaklaşıktır; Diyanet ilanına göre güncelleyin.
 */
function day(iso: string, addDays = 0): Date {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d;
}

/**
 * SEED_PROFILE=production: canlı sunucunun ilk açılışı. Sahte müşteri yorumu ve
 * örnek başvuru eklenmez; veritabanında kullanıcı varsa hiçbir şeye dokunulmaz.
 */
const PRODUCTION = process.env.SEED_PROFILE === "production";

async function main() {
  if (PRODUCTION && (await prisma.user.count()) > 0) {
    console.log("ℹ Veritabanı dolu; canlı ortamda seed atlandı (mevcut veriler korunuyor).");
    return;
  }
  console.log(`🌱 Seed başlıyor${PRODUCTION ? " (canlı ortam ilk kurulum)" : ""}...`);

  // Temizlik (bağımlılık sırasına göre)
  await prisma.lead.deleteMany();
  await prisma.review.deleteMany();
  await prisma.storyItem.deleteMany();
  await prisma.story.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.tourDayProgram.deleteMany();
  await prisma.tourPrice.deleteMany();
  await prisma.tourImage.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.tourCategory.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.documentCertificate.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.contentBlock.deleteMany();
  // Not: Medya kayıtları (yüklenen görseller) seed ile silinmez

  // ---- Admin kullanıcı ----
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Site Yöneticisi",
      email: "admin@turizm.com",
      password,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin: admin@turizm.com / admin123");

  // ---- Kategoriler ----
  const categories = await Promise.all(
    [
      {
        name: "Hac",
        slug: "hac",
        icon: "Landmark",
        description:
          "Ömürde bir kez farz olan hac ibadetini, tecrübeli kadromuz ve merkezi otellerimizle huzur içinde eda edin.",
        image: "/images/kategori-hac.svg",
        order: 1,
      },
      {
        name: "Umre",
        slug: "umre",
        icon: "Moon",
        description:
          "Yıl boyunca farklı tarih ve bütçelerde, kesin kayıtlı umre programları.",
        image: "/images/kategori-umre.svg",
        order: 2,
      },
      {
        name: "Lüks Umre",
        slug: "luks-umre",
        icon: "Crown",
        description:
          "Harem'e sıfır 5 yıldızlı oteller, özel rehberlik ve VIP hizmet ile ayrıcalıklı umre.",
        image: "/images/kategori-luks.svg",
        order: 3,
      },
      {
        name: "Ramazan Umresi",
        slug: "ramazan-umresi",
        icon: "Star",
        description:
          "Ramazan'ın manevi ikliminde, mukabele ve iftar programları eşliğinde umre.",
        image: "/images/kategori-ramazan.svg",
        order: 4,
      },
      {
        name: "Kültür Turları",
        slug: "kultur-turlari",
        icon: "Globe2",
        description:
          "Kudüs, Balkanlar ve daha fazlası; tarih ve maneviyatı birleştiren kültür turları.",
        image: "/images/kategori-kultur.svg",
        order: 5,
      },
    ].map((c) => prisma.tourCategory.create({ data: c })),
  );

  const cat = (slug: string) => categories.find((c) => c.slug === slug)!.id;

  // ---- Ortak metinler ----
  const umreIncluded = [
    "Gidiş-dönüş uçak bileti ve havalimanı vergileri",
    "Mekke ve Medine'de belirtilen otellerde konaklama",
    "Açık büfe kahvaltı, öğle ve akşam yemekleri",
    "Havalimanı - otel - havalimanı transferleri (klimalı otobüs)",
    "Ziyaret turları ve şehir içi ulaşım",
    "Tecrübeli din görevlisi ve rehberlik hizmeti",
    "Umre vizesi işlemleri",
    "İhram, seccade, boyun askısı ve tanıtım çantası",
    "Zemzem suyu ikramı",
  ].join("\n");

  const umreExcluded = [
    "Pasaport çıkarma ücretleri",
    "Kişisel harcamalar ve alışveriş",
    "Sağlık ve seyahat sigortası (opsiyonel)",
    "Belirtilmeyen öğünler ve ekstra ikramlar",
    "Rehber ve görevli bahşişleri",
  ].join("\n");

  const requiredDocs = [
    "En az 6 ay geçerli pasaport",
    "Meningokok (ACWY) aşı kartı",
    "4 adet biyometrik fotoğraf",
    "Nüfus cüzdanı fotokopisi",
  ].join("\n");

  const umreFaqs = [
    {
      question: "Umre için vize işlemlerini siz mi yapıyorsunuz?",
      answer:
        "Evet, umre vizesi başvuru ve takip işlemlerinin tamamı acentamız tarafından yürütülür. Sizden yalnızca gerekli evrakları teslim etmeniz beklenir.",
    },
    {
      question: "Oteller Harem'e ne kadar mesafede?",
      answer:
        "Program detayında Mekke ve Medine otellerinin Harem-i Şerif'e olan yürüme mesafeleri belirtilmiştir. Lüks programlarımızda oteller Harem'e sıfır konumdadır.",
    },
    {
      question: "Grupta din görevlisi bulunuyor mu?",
      answer:
        "Tüm kafilelerimizde deneyimli bir din görevlisi ve rehber bulunur. İbadetlerinizi usulüne uygun eda etmeniz için rehberlik edilir.",
    },
    {
      question: "Ödeme koşulları nelerdir?",
      answer:
        "Kayıt sırasında ön ödeme alınır, kalan bakiye hareket tarihinden önce tamamlanır. Kredi kartına taksit imkânı mevcuttur.",
    },
  ];

  // ---- Tur oluşturucu yardımcı ----
  type RoomPrice = [string, number];
  type Day = [number, string, string];
  type HotelCard = {
    city: string;
    name: string;
    nights?: number;
    stars?: number;
    distance?: string;
    image?: string;
    link?: string;
  };
  type Leg = {
    type: "flight" | "bus";
    title: string;
    carrier?: string;
    fromCode: string;
    fromCity: string;
    toCode: string;
    toCity: string;
    /** Gidiş tarihine eklenecek gün */
    dayOffset: number;
    time?: string;
  };

  /** Umre çocuk / bebek fiyat satırları (yetişkin 2'li oda fiyatına göre) */
  const kidPrices = (base: number): RoomPrice[] => [
    ["0-2 yaş bebek", 500],
    ["2-6 yaş çocuk", Math.round((base * 0.6) / 50) * 50],
    ["6-11 yaş çocuk", Math.round((base * 0.75) / 50) * 50],
  ];

  /** Standart umre ulaşımı: İstanbul → Cidde, Mekke → Medine otobüs, Medine → İstanbul */
  const umreLegs = (makkahNights: number, totalNights: number, depTime = "13:20", retTime?: string): Leg[] => [
    { type: "flight", title: "Gidiş", fromCode: "IST", fromCity: "İstanbul", toCode: "JED", toCity: "Cidde", dayOffset: 0, time: depTime },
    { type: "bus", title: "Otobüs Transfer", carrier: "Lüks otobüs", fromCode: "MEK", fromCity: "Mekke", toCode: "MED", toCity: "Medine", dayOffset: makkahNights, time: "14:00" },
    { type: "flight", title: "Dönüş", fromCode: "MED", fromCity: "Medine", toCode: "IST", toCity: "İstanbul", dayOffset: totalNights, time: retTime },
  ];

  async function createTour(data: {
    code: string;
    badge?: string;
    title: string;
    slug: string;
    categorySlug: string;
    short: string;
    description: string;
    departure: string;
    days: number;
    nights: number;
    depCity: string;
    airline: string;
    hotels?: HotelCard[];
    legs?: Leg[];
    seatsLeft?: number;
    startingPrice: number;
    currency?: string;
    cover: string;
    included?: string;
    excluded?: string;
    docs?: string;
    featured?: boolean;
    prices: RoomPrice[];
    program: Day[];
    faqs?: { question: string; answer: string }[];
    images: string[];
  }) {
    return prisma.tour.create({
      data: {
        code: data.code,
        badge: data.badge ?? null,
        title: data.title,
        slug: data.slug,
        categoryId: cat(data.categorySlug),
        shortDescription: data.short,
        description: data.description,
        departureDate: day(data.departure),
        returnDate: day(data.departure, data.nights),
        durationDays: data.days,
        durationNights: data.nights,
        departureCity: data.depCity,
        airline: data.airline,
        seatsLeft: data.seatsLeft ?? null,
        startingPrice: data.startingPrice,
        currency: data.currency ?? "USD",
        coverImage: data.cover,
        includedServices: data.included ?? umreIncluded,
        excludedServices: data.excluded ?? umreExcluded,
        requiredDocuments: data.docs ?? requiredDocs,
        isFeatured: data.featured ?? false,
        isPublished: true,
        seoDescription: data.short,
        images: {
          create: data.images.map((url, i) => ({
            url,
            alt: `${data.title} görsel ${i + 1}`,
            order: i,
          })),
        },
        prices: {
          create: data.prices.map(([roomType, price], i) => ({
            roomType,
            price,
            currency: data.currency ?? "USD",
            order: i,
          })),
        },
        hotels: {
          create: (data.hotels ?? []).map((h, i) => ({ ...h, order: i })),
        },
        legs: {
          create: (data.legs ?? []).map(({ dayOffset, ...l }, i) => ({
            ...l,
            date: day(data.departure, dayOffset),
            order: i,
          })),
        },
        dayPrograms: {
          create: data.program.map(([dayNumber, title, description]) => ({
            dayNumber,
            title,
            description,
          })),
        },
        faqs: {
          create: (data.faqs ?? umreFaqs).map((f, i) => ({ ...f, order: i })),
        },
      },
    });
  }

  const umreProgram: Day[] = [
    [1, "Hareket ve Cidde'ye Varış", "İstanbul'dan hareket, Cidde Havalimanı'na varış ve Mekke'ye geçiş, otele yerleşme."],
    [2, "İlk Umre", "İhrama girilerek ilk umrenin eda edilmesi, tavaf ve sa'y."],
    [3, "Mekke Ziyaretleri", "Cebel-i Nur (Hira Mağarası), Sevr Dağı, Arafat ve Mina bölgelerinin ziyareti."],
    [4, "Serbest İbadet", "Mescid-i Haram'da serbest ibadet ve nafile umre imkânı."],
    [5, "Medine'ye Geçiş", "Mekke'den ayrılış, Medine-i Münevvere'ye intikal ve otele yerleşme."],
    [6, "Ravza-i Mutahhara", "Mescid-i Nebevi ziyareti, Ravza-i Mutahhara'da ibadet."],
    [7, "Medine Ziyaretleri", "Uhud Şehitliği, Kuba Mescidi, Kıbleteyn Mescidi ziyaretleri."],
    [8, "Veda ve Dönüş", "Veda ziyareti sonrası havalimanına transfer ve İstanbul'a dönüş."],
  ];

  const ekonomikDescription = [
    "## Uygun bütçeyle huzurlu bir umre",
    "Ekonomik umre programımız; uygun fiyat avantajını konforlu konaklama ve tecrübeli rehberlik ile birleştirir. Mekke ve Medine'de Harem'e yürüme mesafesindeki otellerde konaklarsınız. Tüm transfer, yemek ve ziyaretler fiyata dâhildir.",
    "## Konaklama",
    "- **Mekke:** Al Massa Hotel veya muadili, Harem-i Şerif'e yaklaşık 10 dakikalık yürüme mesafesinde.",
    "- **Medine:** Dar Al Eiman Al Manar veya muadili, Mescid-i Nebevi'ye 400 m.",
    "- Odalarda klima, özel banyo, ücretsiz banyo malzemeleri ve Wi-Fi bulunur.",
    "## Umre nedir, ne zaman yapılır?",
    "Sözlükte \"ziyaret\" anlamına gelen umre; ihrama girerek Kâbe'yi tavaf etmek, Safa ile Merve arasında sa'y yapmak ve tıraş olarak ihramdan çıkmaktan ibarettir. Hacdan farklı olarak belirli bir zamana bağlı değildir; arefe ve bayram günleri dışında yılın her döneminde yapılabilir.",
    "Programımız boyunca din görevlilerimiz tavaf, sa'y ve ziyaretlerde sizlere eşlik eder; ibadetlerinizi usulüne uygun ve huzur içinde eda etmeniz için rehberlik eder.",
    "## Neden bu program?",
    "- Harem'e yürüme mesafesinde merkezi oteller",
    "- Tabldot kahvaltı ve akşam yemeği",
    "- Mekke ve Medine çevre ziyaretleri dâhil",
    "- Küçük gruplar ve deneyimli rehber kadro",
  ].join("\n");

  const ekonomikHotels = (makkahNights: number, madinahNights: number): HotelCard[] => [
    { city: "Mekke", name: "Al Massa Hotel", nights: makkahNights, stars: 3, distance: "Mescid-i Haram'a 700 m", image: "/images/otel-mekke-1.svg" },
    { city: "Medine", name: "Dar Al Eiman Al Manar", nights: madinahNights, stars: 3, distance: "Mescid-i Nebevi'ye 400 m", image: "/images/otel-medine-1.svg" },
  ];

  const ekonomikPrices = (p2: number): RoomPrice[] => [
    ["2 kişilik odada", p2],
    ["3 kişilik odada", p2 - 150],
    ["4 kişilik odada", p2 - 250],
    ["Tek kişilik oda", p2 + 700],
    ...kidPrices(p2),
  ];

  // 1) 13 Günlük Ekonomik Umre
  const t1 = await createTour({
    code: "11541",
    title: "13 Günlük Ekonomik Umre Programı",
    slug: "13-gunluk-ekonomik-umre",
    categorySlug: "umre",
    short: "Uygun bütçeyle, merkezi otellerde konforlu 13 günlük umre programı.",
    description: ekonomikDescription,
    departure: "2026-10-15",
    days: 13,
    nights: 12,
    depCity: "İstanbul",
    airline: "Türk Hava Yolları",
    hotels: ekonomikHotels(8, 4),
    legs: umreLegs(8, 12),
    seatsLeft: 4,
    startingPrice: 1500,
    cover: "/images/tur-ekonomik-umre.svg",
    featured: true,
    prices: ekonomikPrices(1500),
    program: umreProgram,
    images: [
      "/images/tur-ekonomik-umre.svg",
      "/images/otel-mekke-1.svg",
      "/images/otel-medine-1.svg",
      "/images/kategori-umre.svg",
      "/images/otel-mekke-2.svg",
      "/images/otel-medine-2.svg",
      "/images/hero-2.svg",
      "/images/otel-mekke-3.svg",
    ],
  });

  // Aynı programın diğer tarihleri ("Tarihler ve Fiyatlar" tablosunda listelenir)
  const t1b = await createTour({
    code: "11542",
    badge: "Kampanya",
    title: "13 Günlük Ekonomik Umre Programı — Kasım",
    slug: "13-gunluk-ekonomik-umre-kasim",
    categorySlug: "umre",
    short: "Kasım dönemi, merkezi otellerde konforlu 13 günlük ekonomik umre programı.",
    description: ekonomikDescription,
    departure: "2026-11-12",
    days: 13,
    nights: 12,
    depCity: "İstanbul",
    airline: "Saudia",
    hotels: ekonomikHotels(8, 4),
    legs: umreLegs(8, 12, "09:40", "17:00"),
    startingPrice: 1450,
    cover: "/images/tur-ekonomik-umre.svg",
    prices: ekonomikPrices(1450),
    program: umreProgram,
    images: ["/images/tur-ekonomik-umre.svg", "/images/otel-mekke-1.svg", "/images/otel-medine-1.svg", "/images/kategori-umre.svg"],
  });

  const t1c = await createTour({
    code: "11543",
    title: "10 Günlük Ekonomik Umre Programı",
    slug: "10-gunluk-ekonomik-umre",
    categorySlug: "umre",
    short: "Kısa sürede umre ibadetini eda etmek isteyenler için 10 günlük ekonomik program.",
    description: ekonomikDescription,
    departure: "2026-12-03",
    days: 10,
    nights: 9,
    depCity: "İstanbul",
    airline: "Türk Hava Yolları",
    hotels: ekonomikHotels(6, 3),
    legs: umreLegs(6, 9),
    seatsLeft: 9,
    startingPrice: 1300,
    cover: "/images/tur-ekonomik-umre.svg",
    prices: ekonomikPrices(1300),
    program: umreProgram,
    images: ["/images/tur-ekonomik-umre.svg", "/images/otel-mekke-1.svg", "/images/otel-medine-1.svg"],
  });

  // 2) 20 Günlük Umre Programı
  const t2 = await createTour({
    code: "11560",
    title: "20 Günlük Umre Programı",
    slug: "20-gunluk-umre-programi",
    categorySlug: "umre",
    short: "Daha uzun süre kalarak ibadetlerinizi acele etmeden eda edeceğiniz kapsamlı program.",
    description:
      "20 günlük programımız, kutsal topraklarda daha uzun vakit geçirmek isteyenler için ideal. Hem Mekke hem Medine'de uzun konaklama ile ibadetlerinizi telaşsız tamamlar, çevre ziyaretlerini rahatça gerçekleştirirsiniz.",
    departure: "2026-11-10",
    days: 20,
    nights: 19,
    depCity: "İstanbul",
    airline: "Saudia",
    hotels: [
      { city: "Mekke", name: "Rua Al Hijra Hotel", nights: 12, stars: 4, distance: "Mescid-i Haram'a 500 m", image: "/images/otel-mekke-2.svg" },
      { city: "Medine", name: "Golden Al Massa", nights: 7, stars: 4, distance: "Mescid-i Nebevi'ye 300 m", image: "/images/otel-medine-2.svg" },
    ],
    legs: umreLegs(12, 19, "09:40", "17:00"),
    startingPrice: 1650,
    cover: "/images/tur-20-gun-umre.svg",
    featured: true,
    prices: [
      ["2 kişilik odada", 2200],
      ["3 kişilik odada", 1850],
      ["4 kişilik odada", 1650],
      ["Tek kişilik oda", 3100],
      ...kidPrices(2200),
    ],
    program: umreProgram,
    images: ["/images/tur-20-gun-umre.svg", "/images/otel-mekke-2.svg", "/images/otel-medine-2.svg", "/images/kategori-umre.svg"],
  });

  // 3) Lüks Umre Programı
  const t3 = await createTour({
    code: "11580",
    badge: "Harem'e Sıfır",
    title: "Lüks Umre Programı — Harem'e Sıfır",
    slug: "luks-umre-programi",
    categorySlug: "luks-umre",
    short: "Harem'e sıfır 5 yıldızlı oteller, VIP transfer ve özel rehberlik ile ayrıcalıklı umre.",
    description:
      "Lüks umre programımızda konfor en üst seviyede. Mekke'de Harem manzaralı 5 yıldızlı otel, Medine'de Mescid-i Nebevi'ye sıfır konaklama, VIP karşılama ve sınırlı kişi sayısıyla özel kafile. Ayrıcalıklı bir manevi yolculuk sizi bekliyor.",
    departure: "2026-10-22",
    days: 12,
    nights: 11,
    depCity: "İstanbul",
    airline: "Türk Hava Yolları (Business opsiyonlu)",
    hotels: [
      { city: "Mekke", name: "Swissôtel Al Maqam Makkah", nights: 7, stars: 5, distance: "Mescid-i Haram'a sıfır (0 m)", image: "/images/otel-mekke-3.svg" },
      { city: "Medine", name: "The Oberoi Madina", nights: 4, stars: 5, distance: "Mescid-i Nebevi'ye sıfır (0 m)", image: "/images/otel-medine-3.svg" },
    ],
    legs: umreLegs(7, 11, "13:20", "12:10"),
    seatsLeft: 2,
    startingPrice: 3200,
    cover: "/images/tur-luks-umre.svg",
    featured: true,
    prices: [
      ["2 kişilik odada", 3200],
      ["Harem manzaralı oda (2 kişilik)", 3900],
      ["Tek kişilik oda", 5400],
      ["Suit oda (2 kişilik)", 6200],
      ...kidPrices(3200),
    ],
    program: umreProgram,
    images: ["/images/tur-luks-umre.svg", "/images/otel-mekke-3.svg", "/images/otel-medine-3.svg", "/images/kategori-luks.svg"],
  });

  // 4) Ramazan Umresi
  const t4 = await createTour({
    code: "11600",
    badge: "Ramazan Özel",
    title: "Ramazan Umresi Programı",
    slug: "ramazan-umresi-2027",
    categorySlug: "ramazan-umresi",
    short: "Ramazan'ın bereketinde, mukabele ve iftar programları ile unutulmaz umre.",
    description:
      "Ramazan umresi, umrenin sevabının kat kat arttığı mübarek bir fırsattır. Programımızda teravih, mukabele ve iftar organizasyonları ile Ramazan'ı kutsal topraklarda en güzel şekilde idrak edersiniz.",
    departure: "2027-02-22",
    days: 15,
    nights: 14,
    depCity: "İstanbul",
    airline: "Saudia",
    hotels: [
      { city: "Mekke", name: "Elaf Al Mashaer", nights: 9, stars: 4, distance: "Mescid-i Haram'a 350 m", image: "/images/otel-mekke-1.svg" },
      { city: "Medine", name: "Dallah Taibah Hotel", nights: 5, stars: 4, distance: "Mescid-i Nebevi'ye 250 m", image: "/images/otel-medine-2.svg" },
    ],
    legs: umreLegs(9, 14, "09:40", "17:00"),
    startingPrice: 2100,
    cover: "/images/tur-ramazan-umresi.svg",
    featured: true,
    prices: [
      ["2 kişilik odada", 2750],
      ["3 kişilik odada", 2350],
      ["4 kişilik odada", 2100],
      ["Tek kişilik oda", 3800],
      ...kidPrices(2750),
    ],
    program: umreProgram,
    images: ["/images/tur-ramazan-umresi.svg", "/images/otel-mekke-1.svg", "/images/otel-medine-2.svg", "/images/kategori-ramazan.svg"],
  });

  // 5) 2027 Hac Ön Kayıt
  const hacProgram: Day[] = [
    [1, "Hareket", "İstanbul'dan Cidde'ye hareket ve Mekke'ye intikal."],
    [2, "Umre ve Yerleşim", "Kudüm umresinin eda edilmesi ve otele yerleşim."],
    [3, "Mekke'de İbadet", "Mescid-i Haram'da serbest ibadet ve hazırlık."],
    [4, "Terviye Günü", "Mina'ya intikal ve çadır kentte konaklama."],
    [5, "Arafat Vakfesi", "Arefe günü Arafat'ta vakfe, akşam Müzdelife'ye geçiş."],
    [6, "Bayram ve Şeytan Taşlama", "Müzdelife vakfesi, şeytan taşlama, kurban ve tıraş; ziyaret tavafı."],
    [7, "Teşrik Günleri", "Mina'da şeytan taşlama ibadetlerinin tamamlanması."],
    [8, "Medine'ye Geçiş", "Mekke'den ayrılış ve Medine-i Münevvere'ye intikal."],
    [9, "Ravza ve Ziyaretler", "Mescid-i Nebevi ziyareti ve Medine çevre ziyaretleri."],
    [10, "Veda ve Dönüş", "Veda tavafı sonrası yurda dönüş."],
  ];

  const t5 = await createTour({
    code: "11700",
    badge: "Ön Kayıt",
    title: "2027 Hac Ön Kayıt Programı",
    slug: "2027-hac-on-kayit-programi",
    categorySlug: "hac",
    short: "2027 hac sezonu için ön kayıtlar başladı. Diyanet uyumlu, tecrübeli kadro ile hac.",
    description:
      "Ömürde bir kez farz olan hac ibadeti için 2027 ön kayıtlarımız açıldı. Müstakil çadır, merkezi oteller ve deneyimli kafile başkanları ile hac vazifenizi huzur içinde eda edin. Kontenjan sınırlıdır.",
    departure: "2027-04-28",
    days: 30,
    nights: 29,
    depCity: "İstanbul",
    airline: "Türk Hava Yolları",
    hotels: [
      { city: "Mekke", name: "Merkezi 4-5★ otel (Aziziye / Mahbes)", nights: 20, stars: 5, distance: "Harem'e servisli / yürüme mesafesi", image: "/images/otel-mekke-2.svg" },
      { city: "Medine", name: "Merkezi otel (Merkeziye bölgesi)", nights: 9, stars: 4, distance: "Mescid-i Nebevi'ye 400 m", image: "/images/otel-medine-1.svg" },
    ],
    legs: [
      { type: "flight", title: "Gidiş", fromCode: "IST", fromCity: "İstanbul", toCode: "JED", toCity: "Cidde", dayOffset: 0 },
      { type: "bus", title: "Otobüs Transfer", carrier: "Lüks otobüs", fromCode: "MEK", fromCity: "Mekke", toCode: "MED", toCity: "Medine", dayOffset: 20 },
      { type: "flight", title: "Dönüş", fromCode: "MED", fromCity: "Medine", toCode: "IST", toCity: "İstanbul", dayOffset: 29 },
    ],
    startingPrice: 7500,
    currency: "USD",
    cover: "/images/tur-hac-2026.svg",
    featured: true,
    docs: [
      "En az 6 ay geçerli pasaport",
      "Diyanet hac kura hakkı / acenta kontenjan belgesi",
      "Meningokok (ACWY) aşı kartı",
      "6 adet biyometrik fotoğraf",
      "Sağlık raporu",
    ].join("\n"),
    prices: [
      ["Müstakil Çadır - 4 Kişilik Oda", 7500],
      ["Müstakil Çadır - 3 Kişilik Oda", 7900],
      ["Müstakil Çadır - 2 Kişilik Oda", 8600],
      ["VIP Paket (Tek Kişilik)", 11500],
    ],
    program: hacProgram,
    faqs: [
      {
        question: "Hac için Diyanet kurası şart mı?",
        answer:
          "Acentalar Diyanet İşleri Başkanlığı kontenjanı çerçevesinde hac düzenler. Kura hakkınız veya acenta kontenjanı ile kayıt yapabilirsiniz; süreç konusunda sizi bilgilendiririz.",
      },
      {
        question: "Ön kayıt ücreti iade edilir mi?",
        answer:
          "Kontenjan kesinleşmeden yapılan iptal taleplerinde ön kayıt bedeli iade edilir. Detaylar sözleşmede belirtilir.",
      },
      ...umreFaqs.slice(2),
    ],
    images: ["/images/tur-hac-2026.svg", "/images/kategori-hac.svg", "/images/otel-mekke-2.svg", "/images/otel-medine-1.svg"],
  });

  // 6) Kudüs Turu
  const t6 = await createTour({
    code: "11800",
    title: "Kudüs (Mescid-i Aksa) Turu",
    slug: "kudus-turu",
    categorySlug: "kultur-turlari",
    short: "Üç semavi dinin buluştuğu kutsal şehir Kudüs ve Mescid-i Aksa ziyareti.",
    description:
      "İlk kıblemiz Mescid-i Aksa'yı ziyaret edeceğiniz bu manevi ve kültürel turda; Kubbetü's-Sahra, Ağlama Duvarı, Beytüllahim ve Halilürrahman gibi tarihi mekânları rehber eşliğinde gezeceksiniz.",
    departure: "2026-11-05",
    days: 5,
    nights: 4,
    depCity: "İstanbul",
    airline: "Türk Hava Yolları",
    hotels: [{ city: "Kudüs", name: "Eski Şehir'e yakın 4★ otel", nights: 4, stars: 4, distance: "Mescid-i Aksa'ya 900 m", image: "/images/tur-kudus.svg" }],
    legs: [
      { type: "flight", title: "Gidiş", fromCode: "IST", fromCity: "İstanbul", toCode: "TLV", toCity: "Tel Aviv", dayOffset: 0, time: "08:15" },
      { type: "flight", title: "Dönüş", fromCode: "TLV", fromCity: "Tel Aviv", toCode: "IST", toCity: "İstanbul", dayOffset: 4, time: "18:40" },
    ],
    startingPrice: 850,
    currency: "USD",
    cover: "/images/tur-kudus.svg",
    included: [
      "Gidiş-dönüş uçak bileti ve vergiler",
      "4 gece otel konaklaması (kahvaltı dâhil)",
      "Tüm çevre gezileri ve müze girişleri",
      "Profesyonel rehberlik",
      "Havalimanı transferleri",
    ].join("\n"),
    excluded: [
      "Öğle ve akşam yemekleri",
      "Kişisel harcamalar",
      "Seyahat sigortası",
      "Bahşişler",
    ].join("\n"),
    docs: ["En az 6 ay geçerli pasaport", "2 adet biyometrik fotoğraf"].join("\n"),
    prices: [
      ["2 kişilik odada", 850],
      ["3 kişilik odada", 790],
      ["Tek kişilik oda", 1150],
    ],
    program: [
      [1, "İstanbul - Tel Aviv - Kudüs", "Hareket, Tel Aviv'e varış ve Kudüs'e transfer, otele yerleşme."],
      [2, "Mescid-i Aksa", "Mescid-i Aksa ve Kubbetü's-Sahra ziyareti, Eski Şehir turu."],
      [3, "Beytüllahim - Halilürrahman", "Hz. İsa'nın doğduğu Beytüllahim ve Hz. İbrahim'in kabri ziyareti."],
      [4, "Kudüs Panorama", "Zeytin Dağı, Ağlama Duvarı ve tarihi çarşı gezisi."],
      [5, "Dönüş", "Serbest zaman sonrası havalimanına transfer ve İstanbul'a dönüş."],
    ],
    faqs: [
      {
        question: "Kudüs turu için vize gerekiyor mu?",
        answer: "Vize işlemleri tur kapsamında değerlendirilir; gerekli yönlendirme acentamızca yapılır.",
      },
      {
        question: "Mescid-i Aksa'da namaz kılabilecek miyiz?",
        answer: "Program, ibadet vakitlerine uygun düzenlenir; Mescid-i Aksa'da namaz için yeterli süre ayrılır.",
      },
    ],
    images: ["/images/tur-kudus.svg", "/images/kategori-kultur.svg"],
  });

  // 7) Balkan Turu
  const t7 = await createTour({
    code: "11810",
    title: "Balkanlar Kültür Turu (5 Ülke)",
    slug: "balkan-turu",
    categorySlug: "kultur-turlari",
    short: "Osmanlı'nın izlerini taşıyan Balkan şehirlerinde 7 günlük kültür ve tarih turu.",
    description:
      "Saraybosna'dan Üsküp'e, Ohrid'den Belgrad'a Balkanların incisi şehirleri keşfedin. Osmanlı mirası camiler, tarihi köprüler ve eşsiz doğa manzaraları ile dolu bir tur sizi bekliyor.",
    departure: "2026-11-19",
    days: 7,
    nights: 6,
    depCity: "İstanbul",
    airline: "Türk Hava Yolları",
    legs: [
      { type: "flight", title: "Gidiş", fromCode: "IST", fromCity: "İstanbul", toCode: "SJJ", toCity: "Saraybosna", dayOffset: 0, time: "10:25" },
      { type: "bus", title: "Otobüs Turu", carrier: "Lüks otobüs", fromCode: "SJJ", fromCity: "Saraybosna", toCode: "BEG", toCity: "Belgrad", dayOffset: 1 },
      { type: "flight", title: "Dönüş", fromCode: "BEG", fromCity: "Belgrad", toCode: "IST", toCity: "İstanbul", dayOffset: 6, time: "20:05" },
    ],
    startingPrice: 699,
    currency: "EUR",
    cover: "/images/tur-balkan.svg",
    included: [
      "Gidiş-dönüş uçak bileti ve vergiler",
      "6 gece 4★ otel konaklaması (kahvaltı dâhil)",
      "Lüks otobüs ile tüm çevre gezileri",
      "Profesyonel Türkçe rehber",
      "Şehir turları ve girişler (program dâhilinde)",
    ].join("\n"),
    excluded: [
      "Öğle ve akşam yemekleri",
      "Ekstra turlar",
      "Kişisel harcamalar",
      "Bahşişler",
    ].join("\n"),
    docs: ["En az 6 ay geçerli pasaport"].join("\n"),
    prices: [
      ["2 kişilik odada", 699],
      ["3 kişilik odada", 649],
      ["Tek kişilik oda", 949],
    ],
    program: [
      [1, "İstanbul - Saraybosna", "Hareket ve Saraybosna'ya varış, şehir turu."],
      [2, "Saraybosna - Mostar", "Mostar Köprüsü ve tarihi çarşı gezisi."],
      [3, "Mostar - Ohrid", "Karadağ üzerinden Ohrid Gölü'ne yolculuk."],
      [4, "Ohrid - Üsküp", "Ohrid turu ve Makedonya'nın başkenti Üsküp'e geçiş."],
      [5, "Üsküp - Priştine", "Üsküp turu, Kosova Priştine'ye intikal."],
      [6, "Priştine - Belgrad", "Sırbistan Belgrad şehir turu."],
      [7, "Belgrad - İstanbul", "Serbest zaman ve İstanbul'a dönüş."],
    ],
    faqs: [
      {
        question: "Balkan turunda hangi ülkeler geziliyor?",
        answer: "Bosna-Hersek, Karadağ, Kuzey Makedonya, Kosova ve Sırbistan bu turda ziyaret edilir.",
      },
    ],
    images: ["/images/tur-balkan.svg", "/images/kategori-kultur.svg"],
  });

  console.log(`✓ ${[t1, t1b, t1c, t2, t3, t4, t5, t6, t7].length} tur oluşturuldu`);

  // ---- Örnek değerlendirmeler (yalnızca geliştirme ortamında) ----
  if (!PRODUCTION) await prisma.review.createMany({
    data: [
      {
        tourId: t1.id,
        fullName: "Fatma K.",
        email: "fatma@example.com",
        title: "Harem'e yakın, huzurlu bir program",
        rating: 5,
        comment: "Otelimiz Harem'e gerçekten yürüme mesafesindeydi. Hocamız tavaf ve sa'y boyunca hep yanımızdaydı, organizasyon çok düzenliydi.",
        isApproved: true,
      },
      {
        tourId: t1.id,
        fullName: "Mehmet A.",
        email: "mehmet@example.com",
        title: "Fiyatına göre çok iyi",
        rating: 4,
        comment: "Ekonomik program olmasına rağmen yemekler ve transferler beklentimizin üzerindeydi. Medine oteli biraz daha yakın olabilirdi.",
        isApproved: true,
      },
      {
        tourId: t1.id,
        fullName: "Ayşe D.",
        email: "ayse@example.com",
        rating: 5,
        comment: "Annemle birlikte katıldık, her konuda ilgilendiler. Allah razı olsun.",
        isApproved: false,
      },
    ],
  });
  if (!PRODUCTION) console.log("✓ 3 örnek değerlendirme oluşturuldu");

  // ---- Hikayeler (ana sayfa, slider altı) — videolar panelden eklenir ----
  const stories: {
    title: string;
    buttonLabel?: string;
    buttonUrl?: string;
    items: [string, string][];
  }[] = [
    {
      title: "Kampanya",
      buttonLabel: "Turu İncele",
      buttonUrl: "/turlar/13-gunluk-ekonomik-umre",
      items: [
        ["/images/tur-ekonomik-umre.svg", "13 günlük ekonomik umre, 1.500 $'dan başlayan fiyatlarla"],
        ["/images/otel-mekke-1.svg", "Harem'e yürüme mesafesinde merkezi oteller"],
      ],
    },
    {
      title: "Mekke",
      buttonLabel: "Mekke Otelleri",
      buttonUrl: "/oteller/mekke",
      items: [
        ["/images/otel-mekke-1.svg", "Mescid-i Haram'a yürüme mesafesindeki otellerimiz"],
        ["/images/otel-mekke-2.svg", "Konforlu odalar ve zengin açık büfe"],
        ["/images/otel-mekke-3.svg", "Lüks programlarda Harem manzaralı odalar"],
      ],
    },
    {
      title: "Medine",
      buttonLabel: "Medine Otelleri",
      buttonUrl: "/oteller/medine",
      items: [
        ["/images/otel-medine-1.svg", "Mescid-i Nebevi'ye birkaç dakika"],
        ["/images/otel-medine-2.svg", "Ravza-i Mutahhara ziyareti"],
      ],
    },
    {
      title: "Lüks Umre",
      buttonLabel: "Programı Gör",
      buttonUrl: "/turlar/luks-umre-programi",
      items: [
        ["/images/tur-luks-umre.svg", "Harem'e sıfır 5 yıldızlı oteller"],
        ["/images/otel-medine-3.svg", "VIP transfer ve özel rehberlik"],
      ],
    },
    {
      title: "Ramazan",
      buttonLabel: "Ön Kayıt",
      buttonUrl: "/turlar/ramazan-umresi-2027",
      items: [["/images/tur-ramazan-umresi.svg", "Ramazan'ı kutsal topraklarda geçirin"]],
    },
    {
      title: "Hac 2027",
      buttonLabel: "Bilgi Al",
      buttonUrl: "/turlar/2027-hac-on-kayit-programi",
      items: [["/images/tur-hac-2026.svg", "2027 hac ön kayıtları başladı"]],
    },
  ];
  for (const [order, s] of stories.entries()) {
    await prisma.story.create({
      data: {
        title: s.title,
        buttonLabel: s.buttonLabel ?? null,
        buttonUrl: s.buttonUrl ?? null,
        order,
        items: { create: s.items.map(([url, caption], i) => ({ url, caption, order: i })) },
      },
    });
  }
  console.log(`✓ ${stories.length} hikaye oluşturuldu`);

  // ---- Oteller ----
  await Promise.all(
    [
      {
        name: "Swissôtel Al Maqam Makkah",
        slug: "swissotel-al-maqam",
        city: "Mekke",
        region: "Abraj Al Bait",
        distance: "Harem'e sıfır (0 m)",
        stars: 5,
        description:
          "Mescid-i Haram'a doğrudan bağlantılı, Harem manzaralı odaları ile Mekke'nin en gözde 5 yıldızlı otellerinden.",
        images: "/images/otel-mekke-3.svg\n/images/otel-mekke-1.svg",
      },
      {
        name: "Rua Al Hijra Hotel",
        slug: "rua-al-hijra",
        city: "Mekke",
        region: "Jabal Omar",
        distance: "Harem'e 500 m",
        stars: 4,
        description:
          "Harem'e yürüme mesafesinde, konforlu odaları ve zengin açık büfesiyle ideal konaklama.",
        images: "/images/otel-mekke-2.svg",
      },
      {
        name: "Al Massa Hotel",
        slug: "al-massa-makkah",
        city: "Mekke",
        region: "Ajyad",
        distance: "Harem'e 700 m",
        stars: 3,
        description:
          "Ekonomik programlar için ideal, temiz ve merkezi konumlu otel.",
        images: "/images/otel-mekke-1.svg",
      },
      {
        name: "The Oberoi Madina",
        slug: "the-oberoi-madina",
        city: "Medine",
        region: "Merkeziye",
        distance: "Mescid-i Nebevi'ye sıfır (0 m)",
        stars: 5,
        description:
          "Mescid-i Nebevi'ye sıfır konumda, lüks umre programlarımızın gözde oteli.",
        images: "/images/otel-medine-3.svg\n/images/otel-medine-1.svg",
      },
      {
        name: "Dallah Taibah Hotel",
        slug: "dallah-taibah",
        city: "Medine",
        region: "Merkeziye",
        distance: "Mescid-i Nebevi'ye 250 m",
        stars: 4,
        description:
          "Ravza-i Mutahhara'ya çok yakın, geniş odalı konforlu otel.",
        images: "/images/otel-medine-2.svg",
      },
      {
        name: "Dar Al Eiman Al Manar",
        slug: "dar-al-eiman-al-manar",
        city: "Medine",
        region: "Merkeziye",
        distance: "Mescid-i Nebevi'ye 400 m",
        stars: 3,
        description:
          "Ekonomik programlar için temiz, güvenli ve merkezi otel seçeneği.",
        images: "/images/otel-medine-1.svg",
      },
    ].map((h) => prisma.hotel.create({ data: h })),
  );
  console.log("✓ 6 otel oluşturuldu");

  // ---- Blog ----
  const blogPosts = [
    {
      title: "Umreye Giderken Yanınıza Almanız Gerekenler",
      slug: "umreye-giderken-yaniniza-almaniz-gerekenler",
      category: "Rehber",
      readTime: 6,
      excerpt:
        "Umre yolculuğunuzda valizinizde bulunması gereken temel eşyalar ve pratik öneriler.",
      cover: "/images/blog-valiz.svg",
      content: `Umre yolculuğu, hem manevi hem de pratik açıdan iyi bir hazırlık gerektirir. Valizinizi hazırlarken aşağıdaki listeyi göz önünde bulundurmanız, kutsal topraklarda ibadetinize odaklanmanızı kolaylaştırır.

## Belgeler
- Pasaport ve fotokopisi
- Uçak bileti ve otel bilgileri
- Aşı kartı (Meningokok ACWY)
- Birkaç adet vesikalık fotoğraf

## Giyim
- İhram (erkekler için 2 adet önerilir)
- Rahat ve bol kıyafetler
- Terlik ve rahat ayakkabı
- Namaz için seccade ve tesbih

## Sağlık ve Bakım
- Kullandığınız ilaçlar (reçetesiyle)
- Güneş kremi ve dudak koruyucu
- Islak mendil ve kişisel hijyen malzemeleri
- Küçük ilk yardım seti

## Pratik Öneriler
Zemzem suyu için katlanabilir bir matara, telefonunuz için powerbank ve kalabalıkta kaybolmamak için grup kartınızı yanınızda bulundurun. Hafif seyahat edin; ihtiyaç fazlası eşya taşımak yerine oradaki alışveriş imkânlarından yararlanabilirsiniz.

Hazırlıklı bir yolculuk, huzurlu bir umre demektir. Rabbim tüm yolcularımızın umresini kabul etsin.`,
    },
    {
      title: "İlk Defa Umreye Gidecekler İçin Kapsamlı Rehber",
      slug: "ilk-defa-umreye-gidecekler-icin-rehber",
      category: "Rehber",
      readTime: 8,
      excerpt:
        "Umrenin nasıl yapıldığını, adım adım menasik bilgisini ve pratik tavsiyeleri bir arada bulun.",
      cover: "/images/blog-ilk-umre.svg",
      content: `İlk umre, insanın hayatında unutamayacağı manevi bir deneyimdir. Bu rehberde umrenin nasıl eda edildiğini adım adım özetliyoruz.

## Umre Nedir?
Umre, belirli bir zamana bağlı olmaksızın ihrama girerek Kâbe'yi tavaf etmek, Safa ile Merve arasında sa'y yapmak ve tıraş olarak (halk/taksir) ihramdan çıkmaktır.

## Umrenin Adımları
1. **İhrama Girmek:** Mikat sınırında niyet edilerek ihrama girilir ve telbiye getirilir.
2. **Tavaf:** Kâbe'nin etrafında Hacerü'l-Esved'den başlanarak yedi şavt dönülür.
3. **Sa'y:** Safa ve Merve tepeleri arasında yedi gidiş-geliş yapılır.
4. **Tıraş (Halk/Taksir):** Saçların kesilmesiyle ihramdan çıkılır ve umre tamamlanır.

## Manevi Hazırlık
Umreye çıkmadan önce kul haklarınızı helalleşin, tövbe edin ve niyetinizi halis tutun. Sabır ve tevazu, umre yolculuğunun anahtarıdır.

Rehberimiz ve din görevlimiz, tüm bu adımlarda size yol gösterecektir. Endişelenmeyin; siz sadece kalbinizi hazırlayın.`,
    },
    {
      title: "Hac ve Umre Arasındaki Farklar Nelerdir?",
      slug: "hac-ve-umre-arasindaki-farklar",
      category: "Bilgi",
      readTime: 5,
      excerpt:
        "Hac ve umre ibadetlerinin hükmü, zamanı ve menasik açısından temel farkları.",
      cover: "/images/blog-hac-umre-fark.svg",
      content: `Hac ve umre, çoğu zaman birbirine karıştırılan iki ibadettir. Aralarındaki temel farkları şöyle özetleyebiliriz.

## Hüküm
- **Hac:** Şartları taşıyan her Müslümana ömründe bir kez farzdır.
- **Umre:** Hanefî mezhebine göre sünnet-i müekkede kabul edilir.

## Zaman
- **Hac:** Yılda bir kez, belirli günlerde (Zilhicce ayı) eda edilir.
- **Umre:** Yılın her zamanı yapılabilir (hac günleri hariç mekruh vakitler dışında).

## Menasik (İbadetler)
- **Hac:** İhram, Arafat vakfesi, Müzdelife vakfesi, şeytan taşlama, tavaf ve sa'y gibi kapsamlı menasik içerir.
- **Umre:** İhram, tavaf, sa'y ve tıraştan ibarettir; Arafat ve Müzdelife vakfesi yoktur.

## Süre
Hac ibadeti belirli günlere yayılırken, umre birkaç saat içinde tamamlanabilir.

Her iki ibadet de kişiyi manen arındırır ve Allah'a yakınlaştırır. Niyet ve ihlas, her ikisinin de özüdür.`,
    },
    {
      title: "İhram Nedir? İhram Yasakları ve Kuralları",
      slug: "ihram-nedir",
      category: "Bilgi",
      readTime: 5,
      excerpt: "İhramın anlamı, nasıl girildiği ve ihram süresince dikkat edilmesi gereken yasaklar.",
      cover: "/images/blog-ihram.svg",
      content: `İhram, hac veya umre yapmak isteyen kişinin belirli fiilleri kendisine yasaklayarak ibadete niyetlenmesi hâlidir.

## İhrama Nasıl Girilir?
Mikat sınırında gusledilir veya abdest alınır, erkekler dikişsiz iki parça beyaz örtüye bürünür, kadınlar normal kıyafetlerini giyer. Niyet edilir ve telbiye getirilir.

## İhram Yasakları
- Dikişli elbise giymek (erkekler için)
- Saç ve tırnak kesmek
- Koku sürünmek
- Avlanmak ve canlıya zarar vermek
- Cinsel ilişki ve buna yönelik davranışlar
- Tartışmak, kavga etmek ve kötü söz söylemek

## İhramın Manevi Boyutu
İhram, dünyevî ayrımların ortadan kalktığı, herkesin aynı beyaz örtüyle Rabbinin huzuruna çıktığı bir eşitlik ve tevazu hâlidir. Bu hâli iç dünyanıza da yansıtmaya çalışın.

Yasaklardan birine bilmeden uyulmaması hâlinde gereken ceza (dem/fidye) konusunda rehberinize danışabilirsiniz.`,
    },
    {
      title: "Mikat Nedir? Mikat Sınırları ve Önemi",
      slug: "mikat-nedir",
      category: "Bilgi",
      readTime: 4,
      excerpt: "Mikat kavramı, mikat yerleri ve ihrama girme noktalarının önemi hakkında bilgiler.",
      cover: "/images/blog-mikat.svg",
      content: `Mikat, hac veya umreye niyet edenlerin ihrama girmeden geçemeyecekleri belirli sınır noktalarıdır.

## Mikat Yerleri
Hz. Peygamber (s.a.v.) tarafından belirlenen başlıca mikat yerleri şunlardır:
- **Zülhuleyfe (Âbâr Ali):** Medine yönünden gelenler için.
- **Cuhfe:** Şam, Mısır ve Kuzey Afrika yönünden gelenler için.
- **Karnü'l-Menâzil:** Necid ve Taif yönünden gelenler için.
- **Yelemlem:** Yemen yönünden gelenler için.
- **Zât-ı Irk:** Irak yönünden gelenler için.

## Uçakla Gelenler İçin
Uçakla gidenler, güzergâhlarına denk gelen mikat hizasında veya kaptanın anonsu ile ihrama girer. Bu yüzden yolculuk öncesi ihram hazırlığı önemlidir.

## Neden Önemli?
Mikatı ihramsız geçmek, ceza (dem) gerektiren bir durumdur. Bu nedenle rehberinizin yönlendirmesine dikkat etmek gerekir.

Mikat, kutsal topraklara manevi bir hazırlıkla girmenin ilk adımıdır.`,
    },
  ];

  await Promise.all(
    blogPosts.map((p) =>
      prisma.blogPost.create({
        data: {
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          coverImage: p.cover,
          category: p.category,
          readTime: p.readTime,
          seoDescription: p.excerpt,
          isPublished: true,
        },
      }),
    ),
  );
  console.log(`✓ ${blogPosts.length} blog yazısı oluşturuldu`);

  // ---- Sertifikalar ----
  await Promise.all(
    [
      {
        title: "TÜRSAB A Grubu Seyahat Acentası Belgesi",
        image: "/images/belge-tursab.svg",
        description: "Türkiye Seyahat Acentaları Birliği onaylı A grubu işletme belgesi.",
        order: 1,
      },
      {
        title: "Diyanet İşleri Başkanlığı Yetki Belgesi",
        image: "/images/belge-diyanet.svg",
        description: "Hac ve umre organizasyonu için yetkilendirme belgesi.",
        order: 2,
      },
      {
        title: "IATA Üyelik Sertifikası",
        image: "/images/belge-iata.svg",
        description: "Uluslararası Hava Taşımacılığı Birliği akreditasyonu.",
        order: 3,
      },
    ].map((d) => prisma.documentCertificate.create({ data: d })),
  );
  console.log("✓ 3 belge oluşturuldu");

  // ---- Site Ayarları ----
  const settings: Record<string, string> = {
    siteName: "Nemira Turizm",
    tagline: "En Güzele, En İyiyle",
    phone: "+90 850 000 00 00",
    whatsapp: "905000000000",
    email: "info@nemiraturizm.com",
    address: "Merkez Mah. Huzur Cad. No:1 Fatih / İstanbul",
    workingHours: "Hafta içi 09:00 - 18:00, Cumartesi 10:00 - 16:00",
    // Sosyal medya hesapları panelden eklenir; boş olanlar sitede gösterilmez
    facebook: "",
    instagram: "",
    youtube: "",
    twitter: "",
    logo: "/images/nemira-logo.png",
    logoLight: "/images/nemira-logo-light.png",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.9!2d28.955!3d41.019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zRmF0aWg!5e0!3m2!1str!2str!4v1700000000000",
    footerNote:
      "Nemira Turizm, TÜRSAB ve Diyanet İşleri Başkanlığı yetki belgeli bir seyahat acentasıdır.",
  };

  await Promise.all(
    Object.entries(settings).map(([key, value]) =>
      prisma.siteSetting.create({ data: { key, value } }),
    ),
  );
  console.log(`✓ ${Object.keys(settings).length} site ayarı oluşturuldu`);

  // ---- Örnek başvuru (yalnızca geliştirme ortamında) ----
  if (!PRODUCTION) {
    await prisma.lead.create({
      data: {
        fullName: "Ahmet Yılmaz",
        phone: "0555 123 45 67",
        email: "ahmet@example.com",
        personCount: 2,
        tourTitle: t1.title,
        tourId: t1.id,
        message: "13 günlük umre programı hakkında bilgi almak istiyorum.",
        source: "tur-detay",
        status: "Yeni",
      },
    });
    console.log("✓ Örnek başvuru oluşturuldu");
  }

  console.log("\n✅ Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
