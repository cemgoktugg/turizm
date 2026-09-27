export type NavChild = { label: string; href: string; desc?: string };
export type NavItem = { label: string; href: string; children?: NavChild[] };

export const NAV: NavItem[] = [
  { label: "Ana Sayfa", href: "/" },
  {
    label: "Hac",
    href: "/hac",
    children: [
      { label: "Hac Programları", href: "/hac/programlari", desc: "2026 hac paketleri ve ön kayıt" },
      { label: "Yetki Belgeleri", href: "/hac/yetki-belgeleri", desc: "Diyanet & TÜRSAB belgeleri" },
      { label: "Dua ve Vazifeler", href: "/hac/dua-ve-vazifeler", desc: "Hac menasiki ve dualar" },
    ],
  },
  {
    label: "Umre",
    href: "/umre",
    children: [
      { label: "Tüm Umre Turları", href: "/umre", desc: "Bütün umre programları" },
      { label: "Kesin Tarihli Turlar", href: "/umre/kesin-tarihli-turlar", desc: "Tarihi belli, kayıt açık turlar" },
      { label: "Lüks Umre", href: "/umre/luks-umre", desc: "Harem'e sıfır 5★ konaklama" },
      { label: "Ramazan Umresi", href: "/umre/ramazan-umresi", desc: "Ramazan'da bereketli umre" },
      { label: "Yetki Belgeleri", href: "/umre/yetki-belgeleri", desc: "Umre yetki belgelerimiz" },
      { label: "Dua ve Vazifeler", href: "/umre/dua-ve-vazifeler", desc: "Umre menasiki ve dualar" },
    ],
  },
  { label: "Turlar", href: "/turlar" },
  {
    label: "Oteller",
    href: "/oteller",
    children: [
      { label: "Mekke Otelleri", href: "/oteller/mekke", desc: "Harem'e yakın oteller" },
      { label: "Medine Otelleri", href: "/oteller/medine", desc: "Mescid-i Nebevi'ye yakın oteller" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Gerekli Bilgiler", href: "/gerekli-bilgiler" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

export const WHY_US = [
  {
    icon: "ShieldCheck",
    title: "Yetkili Acenta",
    text: "TÜRSAB ve Diyanet İşleri Başkanlığı yetki belgeli, güvenilir seyahat acentası.",
  },
  {
    icon: "Users",
    title: "Tecrübeli Ekip",
    text: "Alanında uzman din görevlileri ve rehberlerle usulüne uygun ibadet.",
  },
  {
    icon: "Building2",
    title: "Merkezi Oteller",
    text: "Harem-i Şerif ve Mescid-i Nebevi'ye yürüme mesafesinde konforlu konaklama.",
  },
  {
    icon: "Headphones",
    title: "7/24 Destek",
    text: "Yolculuğunuzun her anında yanınızda olan kesintisiz iletişim hattı.",
  },
  {
    icon: "BadgeDollarSign",
    title: "Şeffaf Fiyat",
    text: "Gizli ücret yok. Her şey dâhil, net ve anlaşılır fiyatlandırma.",
  },
  {
    icon: "Compass",
    title: "Profesyonel Rehberlik",
    text: "Menasik eğitimi, grup organizasyonu ve manevi rehberlik hizmeti.",
  },
] as const;

export const PREP_INFO = [
  {
    icon: "Luggage",
    title: "Valiz Listesi",
    text: "Umre ve hac yolculuğunuzda yanınıza almanız gerekenlerin eksiksiz listesi.",
    href: "/gerekli-bilgiler#valiz",
  },
  {
    icon: "BookOpen",
    title: "Umreye Hazırlık",
    text: "Manevi ve fiziki hazırlık; niyet, tövbe ve menasik bilgisi.",
    href: "/umre/dua-ve-vazifeler",
  },
  {
    icon: "Scroll",
    title: "Hac Vazifeleri",
    text: "Haccın farzları, vacipleri ve sünnetleri hakkında rehber.",
    href: "/hac/dua-ve-vazifeler",
  },
  {
    icon: "Shirt",
    title: "İhram Bilgileri",
    text: "İhrama nasıl girilir, ihram yasakları nelerdir?",
    href: "/blog/ihram-nedir",
  },
  {
    icon: "MapPin",
    title: "Mikat Bilgileri",
    text: "Mikat sınırları ve ihrama girme noktaları hakkında bilgiler.",
    href: "/blog/mikat-nedir",
  },
] as const;

/** Kategori kartları (ikon eşlemeleri) */
export const CATEGORY_ICONS: Record<string, string> = {
  hac: "Landmark",
  umre: "Moon",
  "luks-umre": "Crown",
  "ramazan-umresi": "Star",
  "kultur-turlari": "Globe2",
};

/** "Gerekli Bilgiler" sayfası bölümleri */
export const GEREKLI_BILGILER = [
  {
    id: "pasaport",
    title: "Pasaport ve Vize",
    items: [
      "Pasaportunuzun dönüş tarihinden itibaren en az 6 ay geçerli olması gerekir.",
      "Umre vizesi işlemleri acentamız tarafından yürütülür.",
      "Vize için biyometrik fotoğraf ve gerekli evraklar önceden teslim edilmelidir.",
    ],
  },
  {
    id: "asi",
    title: "Sağlık ve Aşı",
    items: [
      "Meningokok (ACWY) aşısı zorunludur; aşı kartınızı yanınızda bulundurun.",
      "Kronik rahatsızlığı olanlar ilaçlarını reçetesiyle taşımalıdır.",
      "Seyahat sağlık sigortası tavsiye edilir.",
    ],
  },
  {
    id: "valiz",
    title: "Valiz Listesi",
    items: [
      "İhram (erkekler için 2 takım), rahat kıyafet ve terlik.",
      "Seccade, tesbih, Kur'an-ı Kerim ve dua kitapçığı.",
      "Kişisel bakım ürünleri, güneş kremi ve ilk yardım malzemeleri.",
      "Katlanabilir zemzem matarası ve powerbank.",
      "Kullandığınız ilaçlar ve reçeteleri.",
    ],
  },
  {
    id: "para",
    title: "Döviz ve Harcama",
    items: [
      "Suudi Arabistan para birimi Riyal (SAR)'dir.",
      "Yanınızda bir miktar nakit bulundurmanız pratik olur.",
      "Kredi kartları büyük mağaza ve otellerde geçerlidir.",
    ],
  },
  {
    id: "iletisim",
    title: "İletişim ve Ulaşım",
    items: [
      "Yurt dışı görüşme için hat açtırmayı veya yerel SIM/eSIM almayı unutmayın.",
      "Grup kartınızı ve rehber telefonunu her zaman yanınızda taşıyın.",
      "Otel ve toplanma noktalarını önceden not edin.",
    ],
  },
] as const;

export const UMRE_MENASIK = [
  { step: "1", title: "İhrama Girmek", text: "Mikatta niyet edip telbiye getirerek ihrama girilir. Erkekler dikişsiz iki parça beyaz örtüye bürünür." },
  { step: "2", title: "Tavaf", text: "Hacerü'l-Esved hizasından başlanarak Kâbe'nin etrafında yedi şavt dönülür." },
  { step: "3", title: "Sa'y", text: "Safa ve Merve tepeleri arasında yedi gidiş-geliş yapılır." },
  { step: "4", title: "Tıraş (Halk/Taksir)", text: "Saçların kesilmesiyle ihramdan çıkılır ve umre tamamlanır." },
] as const;

export const HAC_MENASIK = [
  { step: "1", title: "İhram", text: "Mikatta ihrama girilerek hacca niyet edilir." },
  { step: "2", title: "Arafat Vakfesi", text: "Arefe günü Arafat'ta vakfeye durulur — haccın rüknüdür." },
  { step: "3", title: "Müzdelife Vakfesi", text: "Arafat sonrası Müzdelife'de vakfe yapılır, taş toplanır." },
  { step: "4", title: "Şeytan Taşlama", text: "Mina'da cemrelere taş atılır." },
  { step: "5", title: "Kurban ve Tıraş", text: "Kurban kesilir, tıraş olunur ve ihramdan çıkılır." },
  { step: "6", title: "Ziyaret Tavafı", text: "Kâbe tavaf edilir ve sa'y yapılır — haccın farzıdır." },
] as const;

/** Kısa dua örnekleri */
export const DUALAR = [
  {
    title: "Telbiye",
    arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ",
    text: "Lebbeyk Allâhümme lebbeyk. Lebbeyke lâ şerîke leke lebbeyk. İnne'l-hamde ve'n-ni'mete leke ve'l-mülk, lâ şerîke lek.",
    meaning: "Buyur Allah'ım buyur! Emrindeyim. Senin hiçbir ortağın yoktur. Hamd sana, nimet senindir; mülk de senin. Senin ortağın yoktur.",
  },
  {
    title: "Tavaf Duası (Genel)",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",
    text: "Rabbenâ âtinâ fi'd-dünyâ haseneten ve fi'l-âhireti haseneten ve kınâ azâbe'n-nâr.",
    meaning: "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.",
  },
  {
    title: "Safa ve Merve'de",
    arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ",
    text: "İnne's-safâ ve'l-mervete min şeâirillâh.",
    meaning: "Şüphesiz Safa ile Merve, Allah'ın (dininin) işaretlerindendir.",
  },
] as const;
