import {
  headingFields,
  heroFields,
  seoFields,
  type FieldSpec,
} from "./fields";

/**
 * Sitedeki tüm düzenlenebilir içerik blokları.
 * - `fields`: admin formu ve doğrulama şeması bu tanımdan üretilir
 * - `defaults`: veritabanında kayıt yoksa sitede gösterilen içerik (ve tip kaynağı)
 * - `path`: panelde "Sitede Gör" bağlantısı
 */

export const CONTENT_GROUPS = {
  home: "Ana Sayfa",
  hac: "Hac Sayfaları",
  umre: "Umre Sayfaları",
  catalog: "Tur, Otel ve Blog Sayfaları",
  corporate: "Kurumsal Sayfalar",
  shared: "Ortak Bölümler",
} as const;

export type ContentGroup = keyof typeof CONTENT_GROUPS;

type BlockDef<T extends Record<string, unknown>> = {
  group: ContentGroup;
  title: string;
  description: string;
  path?: string;
  fields: FieldSpec[];
  defaults: T;
};

function block<T extends Record<string, unknown>>(def: BlockDef<T>): BlockDef<T> {
  return def;
}

const listingFields: FieldSpec[] = [
  ...heroFields,
  { type: "text", name: "sectionTitle", label: "Liste başlığı" },
  { type: "textarea", name: "sectionDescription", label: "Liste açıklaması", rows: 2 },
  ...seoFields,
];

const stepsField: FieldSpec = {
  type: "list",
  name: "steps",
  label: "Menasik adımları",
  itemLabel: "Adım",
  titleField: "title",
  fields: [
    { type: "text", name: "title", label: "Adım başlığı" },
    { type: "textarea", name: "text", label: "Açıklama", rows: 2 },
  ],
};

export const CONTENT_BLOCKS = {
  /* ============================== ANA SAYFA ============================== */
  "home.hero": block({
    group: "home",
    title: "Hero Slider",
    description: "Ana sayfanın en üstündeki büyük slaytlar, rozet ve butonlar.",
    path: "/",
    fields: [
      { type: "text", name: "badge", label: "Üst rozet metni" },
      {
        type: "list",
        name: "slides",
        label: "Slaytlar",
        itemLabel: "Slayt",
        titleField: "title",
        min: 1,
        max: 6,
        fields: [
          { type: "image", name: "image", label: "Görsel" },
          { type: "text", name: "title", label: "Büyük başlık" },
          { type: "textarea", name: "subtitle", label: "Alt metin", rows: 2 },
        ],
      },
      { type: "text", name: "primaryLabel", label: "Birinci buton metni" },
      { type: "link", name: "primaryHref", label: "Birinci buton bağlantısı" },
      { type: "text", name: "secondaryLabel", label: "İkinci buton metni" },
      { type: "link", name: "secondaryHref", label: "İkinci buton bağlantısı" },
      { type: "text", name: "whatsappLabel", label: "WhatsApp buton metni" },
      { type: "textarea", name: "whatsappMessage", label: "WhatsApp hazır mesajı", rows: 2 },
    ],
    defaults: {
      badge: "TÜRSAB & Diyanet Yetki Belgeli",
      slides: [
        {
          image: "/images/hero-1.svg",
          title: "Rotamız Huzura",
          subtitle: "Yetkili acenta güvencesiyle, manevi ve konforlu hac & umre yolculukları.",
        },
        {
          image: "/images/hero-2.svg",
          title: "Kutsal Topraklara",
          subtitle: "Harem'e sıfır oteller, tecrübeli rehberlik ve unutulmaz bir manevi deneyim.",
        },
        {
          image: "/images/hero-3.svg",
          title: "Huzurun Adresi",
          subtitle: "2026-2027 umre sezonu ve 2027 hac programlarında kayıtlar başladı.",
        },
      ],
      primaryLabel: "Umre Turlarını İncele",
      primaryHref: "/umre",
      secondaryLabel: "Hac Programları",
      secondaryHref: "/hac/programlari",
      whatsappLabel: "WhatsApp'tan Bilgi Al",
      whatsappMessage: "Merhaba, hac/umre programları hakkında bilgi almak istiyorum.",
    },
  }),

  "home.stats": block({
    group: "home",
    title: "İstatistik Şeridi",
    description: "Hero altındaki rakamlar (mutlu misafir, tecrübe yılı vb.).",
    path: "/",
    fields: [
      {
        type: "list",
        name: "items",
        label: "İstatistikler",
        itemLabel: "İstatistik",
        titleField: "label",
        max: 6,
        fields: [
          { type: "icon", name: "icon", label: "İkon" },
          { type: "text", name: "value", label: "Değer", placeholder: "25.000+" },
          { type: "text", name: "label", label: "Etiket", placeholder: "Mutlu Misafir" },
        ],
      },
    ],
    defaults: {
      items: [
        { icon: "Users", value: "25.000+", label: "Mutlu Misafir" },
        { icon: "CalendarCheck", value: "20+ Yıl", label: "Sektör Tecrübesi" },
        { icon: "Building2", value: "50+", label: "Anlaşmalı Otel" },
        { icon: "Star", value: "4.9/5", label: "Misafir Memnuniyeti" },
      ],
    },
  }),

  "home.sections": block({
    group: "home",
    title: "Bölüm Başlıkları",
    description: "Öne çıkan turlar, kategoriler, oteller ve blog bölümlerinin başlıkları.",
    path: "/",
    fields: [
      { type: "group", name: "featured", label: "Öne çıkan turlar", fields: headingFields("Öne çıkan turlar") },
      { type: "group", name: "categories", label: "Kategoriler", fields: headingFields("Kategoriler") },
      { type: "group", name: "hotels", label: "Oteller", fields: headingFields("Oteller") },
      { type: "group", name: "blog", label: "Blog", fields: headingFields("Blog") },
    ],
    defaults: {
      featured: {
        eyebrow: "Öne Çıkan Programlar",
        title: "Sizin İçin Seçtiğimiz Turlar",
        description: "En çok tercih edilen hac, umre ve kültür turlarımızı keşfedin.",
      },
      categories: {
        eyebrow: "Hizmetlerimiz",
        title: "Yolculuk Kategorileri",
        description: "İhtiyacınıza ve bütçenize en uygun program türünü seçin.",
      },
      hotels: {
        eyebrow: "Konaklama",
        title: "Mekke & Medine Otellerimiz",
        description: "Harem-i Şerif ve Mescid-i Nebevi'ye yürüme mesafesindeki seçkin otellerimiz.",
      },
      blog: {
        eyebrow: "Blog & Rehber",
        title: "Güncel Yazılar",
        description: "Hac ve umre hakkında merak ettikleriniz.",
      },
    },
  }),

  "home.features": block({
    group: "home",
    title: "Neden Biz?",
    description: "Ana sayfada ve Hakkımızda sayfasında görünen avantaj kartları.",
    path: "/",
    fields: [
      ...headingFields(),
      {
        type: "list",
        name: "items",
        label: "Avantajlar",
        itemLabel: "Avantaj",
        titleField: "title",
        max: 12,
        fields: [
          { type: "icon", name: "icon", label: "İkon" },
          { type: "text", name: "title", label: "Başlık" },
          { type: "textarea", name: "text", label: "Açıklama", rows: 2 },
        ],
      },
    ],
    defaults: {
      eyebrow: "Neden Rotamız Huzura?",
      title: "Güvenle Emin Ellerdesiniz",
      description:
        "20 yılı aşkın tecrübemizle, manevi yolculuğunuzu en güzel şekilde tamamlamanız için buradayız.",
      items: [
        { icon: "ShieldCheck", title: "Yetkili Acenta", text: "TÜRSAB ve Diyanet İşleri Başkanlığı yetki belgeli, güvenilir seyahat acentası." },
        { icon: "Users", title: "Tecrübeli Ekip", text: "Alanında uzman din görevlileri ve rehberlerle usulüne uygun ibadet." },
        { icon: "Building2", title: "Merkezi Oteller", text: "Harem-i Şerif ve Mescid-i Nebevi'ye yürüme mesafesinde konforlu konaklama." },
        { icon: "Headphones", title: "7/24 Destek", text: "Yolculuğunuzun her anında yanınızda olan kesintisiz iletişim hattı." },
        { icon: "BadgeDollarSign", title: "Şeffaf Fiyat", text: "Gizli ücret yok. Her şey dâhil, net ve anlaşılır fiyatlandırma." },
        { icon: "Compass", title: "Profesyonel Rehberlik", text: "Menasik eğitimi, grup organizasyonu ve manevi rehberlik hizmeti." },
      ],
    },
  }),

  "home.prep": block({
    group: "home",
    title: "Hazırlık Rehberi Kartları",
    description: "Ana sayfadaki 'Yolculuk Öncesi Bilmeniz Gerekenler' kartları.",
    path: "/",
    fields: [
      ...headingFields(),
      {
        type: "list",
        name: "items",
        label: "Kartlar",
        itemLabel: "Kart",
        titleField: "title",
        max: 10,
        fields: [
          { type: "icon", name: "icon", label: "İkon" },
          { type: "text", name: "title", label: "Başlık" },
          { type: "textarea", name: "text", label: "Açıklama", rows: 2 },
          { type: "link", name: "href", label: "Bağlantı" },
        ],
      },
    ],
    defaults: {
      eyebrow: "Hazırlık Rehberi",
      title: "Yolculuk Öncesi Bilmeniz Gerekenler",
      description: "Umre ve hac yolculuğunuza hazırlanırken işinize yarayacak rehber içerikler.",
      items: [
        { icon: "Luggage", title: "Valiz Listesi", text: "Umre ve hac yolculuğunuzda yanınıza almanız gerekenlerin eksiksiz listesi.", href: "/gerekli-bilgiler#valiz" },
        { icon: "BookOpen", title: "Umreye Hazırlık", text: "Manevi ve fiziki hazırlık; niyet, tövbe ve menasik bilgisi.", href: "/umre/dua-ve-vazifeler" },
        { icon: "Scroll", title: "Hac Vazifeleri", text: "Haccın farzları, vacipleri ve sünnetleri hakkında rehber.", href: "/hac/dua-ve-vazifeler" },
        { icon: "Shirt", title: "İhram Bilgileri", text: "İhrama nasıl girilir, ihram yasakları nelerdir?", href: "/blog/ihram-nedir" },
        { icon: "MapPin", title: "Mikat Bilgileri", text: "Mikat sınırları ve ihrama girme noktaları hakkında bilgiler.", href: "/blog/mikat-nedir" },
      ],
    },
  }),

  "home.quote": block({
    group: "home",
    title: "Manevi Alıntı",
    description: "Ana sayfadaki koyu zeminli alıntı bölümü.",
    path: "/",
    fields: [
      { type: "textarea", name: "text", label: "Alıntı metni", rows: 3 },
      { type: "text", name: "source", label: "Kaynak" },
    ],
    defaults: {
      text: "Hac ve umre yapanlar Allah'ın misafirleridir. Kendisine dua ederlerse dualarını kabul eder, bağışlanma dilerlerse onları bağışlar.",
      source: "Hadis-i Şerif",
    },
  }),

  /* ============================== HAC ============================== */
  "page.hac": block({
    group: "hac",
    title: "Hac Ana Sayfası",
    description: "/hac sayfasının başlığı, giriş metni ve program bölümü.",
    path: "/hac",
    fields: [
      ...heroFields,
      { type: "text", name: "introEyebrow", label: "Giriş — üst etiket" },
      { type: "text", name: "introTitle", label: "Giriş — başlık" },
      { type: "lines", name: "introParagraphs", label: "Giriş paragrafları", help: "Her satır ayrı bir paragraf olur.", rows: 5 },
      { type: "text", name: "programsEyebrow", label: "Programlar — üst etiket" },
      { type: "text", name: "programsTitle", label: "Programlar — başlık" },
      { type: "textarea", name: "programsDescription", label: "Programlar — açıklama", rows: 2 },
      { type: "textarea", name: "emptyText", label: "Program yoksa gösterilecek metin", rows: 2 },
      { type: "text", name: "ctaTitle", label: "Alt çağrı başlığı" },
      { type: "textarea", name: "ctaDescription", label: "Alt çağrı açıklaması", rows: 2 },
      ...seoFields,
    ],
    defaults: {
      title: "Hac İbadeti",
      description: "İslam'ın beş şartından biri olan haccı, huzur ve güven içinde eda etmeniz için yanınızdayız.",
      image: "/images/kategori-hac.svg",
      introEyebrow: "Kutsal Vazife",
      introTitle: "Hayatın en anlamlı yolculuğu",
      introParagraphs: [
        "Hac, maddî ve bedenî imkânı olan her Müslümana ömründe bir kez farz olan büyük bir ibadettir. Arafat vakfesinden ziyaret tavafına kadar her menasiki usulüne uygun eda etmeniz için tecrübeli din görevlilerimiz ve rehberlerimiz yanınızda olacak.",
        "Merkezi oteller, müstakil çadır düzeni ve kesintisiz destek ile hac yolculuğunuzu kolaylaştırıyoruz. 2027 sezonu ön kayıtlarımız başlamıştır.",
      ],
      programsEyebrow: "Programlar",
      programsTitle: "Hac Programlarımız",
      programsDescription: "2027 hac sezonu için hazırlanan paketlerimiz.",
      emptyText: "Hac programları yakında yayınlanacaktır. Ön kayıt için bizimle iletişime geçin.",
      ctaTitle: "2027 Hac Ön Kaydınızı Yaptırın",
      ctaDescription: "Kontenjanlar sınırlıdır. Danışmanlarımız ön kayıt sürecinde size yardımcı olacaktır.",
      seoTitle: "Hac",
      seoDescription:
        "Ömürde bir kez farz olan hac ibadeti için Diyanet uyumlu, tecrübeli kadro ve merkezi otellerle hac programları.",
    },
  }),

  "page.hac-programlari": block({
    group: "hac",
    title: "Hac Programları",
    description: "/hac/programlari listeleme sayfası.",
    path: "/hac/programlari",
    fields: listingFields,
    defaults: {
      title: "Hac Programları",
      description: "Ömürde bir kez farz olan hac ibadetini huzur içinde eda etmeniz için özenle hazırlanmış programlarımız.",
      image: "/images/kategori-hac.svg",
      sectionTitle: "2027 Hac Programları",
      sectionDescription: "Kontenjanlar sınırlıdır. Ön kayıt için danışmanlarımızla iletişime geçin.",
      seoTitle: "Hac Programları",
      seoDescription: "2027 hac sezonu ön kayıtları başladı. Diyanet uyumlu, tecrübeli kadro ve merkezi otellerle hac programları.",
    },
  }),

  "page.hac-dua": block({
    group: "hac",
    title: "Hac Dua ve Vazifeler",
    description: "Hac menasik adımları ile farz, vacip ve sünnetler.",
    path: "/hac/dua-ve-vazifeler",
    fields: [
      ...heroFields,
      { type: "text", name: "stepsEyebrow", label: "Menasik — üst etiket" },
      { type: "text", name: "stepsTitle", label: "Menasik — başlık" },
      stepsField,
      { type: "text", name: "vazifelerEyebrow", label: "Vazifeler — üst etiket" },
      { type: "text", name: "vazifelerTitle", label: "Vazifeler — başlık" },
      {
        type: "list",
        name: "vazifeler",
        label: "Vazife grupları",
        itemLabel: "Grup",
        titleField: "title",
        max: 6,
        fields: [
          { type: "text", name: "title", label: "Grup adı" },
          { type: "lines", name: "items", label: "Maddeler (her satıra bir madde)", rows: 5 },
        ],
      },
      ...seoFields,
    ],
    defaults: {
      title: "Hac Dua ve Vazifeler",
      description: "Haccın menasikini adım adım öğrenin; farz, vacip ve sünnetleri ile okunacak duaları keşfedin.",
      image: "/images/kategori-hac.svg",
      stepsEyebrow: "Menasik",
      stepsTitle: "Hac Menasiki — Adım Adım",
      steps: [
        { title: "İhram", text: "Mikatta ihrama girilerek hacca niyet edilir." },
        { title: "Arafat Vakfesi", text: "Arefe günü Arafat'ta vakfeye durulur — haccın rüknüdür." },
        { title: "Müzdelife Vakfesi", text: "Arafat sonrası Müzdelife'de vakfe yapılır, taş toplanır." },
        { title: "Şeytan Taşlama", text: "Mina'da cemrelere taş atılır." },
        { title: "Kurban ve Tıraş", text: "Kurban kesilir, tıraş olunur ve ihramdan çıkılır." },
        { title: "Ziyaret Tavafı", text: "Kâbe tavaf edilir ve sa'y yapılır — haccın farzıdır." },
      ],
      vazifelerEyebrow: "Vazifeler",
      vazifelerTitle: "Farz, Vacip ve Sünnetler",
      vazifeler: [
        { title: "Farzlar", items: ["İhrama girmek (şart)", "Arafat'ta vakfe yapmak", "Ziyaret (ifada) tavafı"] },
        { title: "Vacipler", items: ["Müzdelife vakfesi", "Şeytan taşlama (cemre)", "Sa'y", "Tıraş / kısaltma", "Veda tavafı"] },
        { title: "Sünnetler", items: ["Kudüm tavafı", "Hutbeler", "Mina'da gecelemek", "Telbiye, tekbir ve dualar"] },
      ],
      seoTitle: "Hac Dua ve Vazifeler",
      seoDescription:
        "Haccın farzları, vacipleri, sünnetleri ve menasiki. İhram, Arafat vakfesi, şeytan taşlama ve okunacak dualar.",
    },
  }),

  "page.hac-yetki": block({
    group: "hac",
    title: "Hac Yetki Belgeleri",
    description: "/hac/yetki-belgeleri sayfasının başlığı ve giriş metni.",
    path: "/hac/yetki-belgeleri",
    fields: [...heroFields, { type: "textarea", name: "intro", label: "Giriş metni", rows: 4 }, ...seoFields],
    defaults: {
      title: "Hac Yetki Belgelerimiz",
      description: "Hac ibadetinizi resmî yetki belgelerine sahip, güvenilir bir acenta ile gerçekleştirin.",
      image: "/images/belge-diyanet.svg",
      intro:
        "Rotamız Huzura olarak hac organizasyonlarımızı, resmî kurumlar tarafından verilen yetki belgeleri çerçevesinde yürütüyoruz. TÜRSAB A grubu işletme belgemiz ve Diyanet İşleri Başkanlığı yetkimiz ile misafirlerimize güvenli bir hizmet sunuyoruz.",
      seoTitle: "Hac Yetki Belgeleri",
      seoDescription: "Hac organizasyonu için TÜRSAB, Diyanet ve IATA yetki belgelerimiz. Güvenle emin ellerdesiniz.",
    },
  }),

  /* ============================== UMRE ============================== */
  "page.umre": block({
    group: "umre",
    title: "Tüm Umre Turları",
    description: "/umre listeleme sayfası.",
    path: "/umre",
    fields: listingFields,
    defaults: {
      title: "Umre Turları",
      description: "Bütçenize ve tercihinize uygun, yıl boyunca farklı tarihlerde düzenlenen umre programlarımızı keşfedin.",
      image: "/images/kategori-umre.svg",
      sectionTitle: "Tüm Umre Programları",
      sectionDescription: "Aşağıdaki programlardan size en uygun olanı seçin veya danışmanlarımızdan destek alın.",
      seoTitle: "Umre Turları",
      seoDescription:
        "Ekonomik, standart ve lüks umre programları. Merkezi oteller, tecrübeli rehberlik ve şeffaf fiyatlarla kesin kayıtlı umre turları.",
    },
  }),

  "page.umre-kesin": block({
    group: "umre",
    title: "Kesin Tarihli Umre Turları",
    description: "/umre/kesin-tarihli-turlar — yalnızca tarihi belli turlar listelenir.",
    path: "/umre/kesin-tarihli-turlar",
    fields: listingFields,
    defaults: {
      title: "Kesin Tarihli Umre Turları",
      description: "Tarihleri belli, kontenjanı sınırlı ve kayıtları açık umre programlarımız. Planınızı bugünden netleştirin.",
      image: "/images/tur-20-gun-umre.svg",
      sectionTitle: "Tarihi Belli Programlar",
      sectionDescription: "Aşağıdaki turlarda gidiş tarihi kesinleşmiştir. Kontenjanlar sınırlıdır.",
      seoTitle: "Kesin Tarihli Umre Turları",
      seoDescription: "Gidiş-dönüş tarihleri kesinleşmiş, kayıtları açık umre turları. Yerinizi hemen ayırtın.",
    },
  }),

  "page.umre-luks": block({
    group: "umre",
    title: "Lüks Umre",
    description: "/umre/luks-umre listeleme sayfası.",
    path: "/umre/luks-umre",
    fields: listingFields,
    defaults: {
      title: "Lüks Umre",
      description:
        "Konforun zirvesinde bir manevi yolculuk. Harem manzaralı 5 yıldızlı oteller ve VIP hizmet ile ayrıcalıklı umre deneyimi.",
      image: "/images/kategori-luks.svg",
      sectionTitle: "Lüks Umre Programları",
      sectionDescription: "Harem'e sıfır konaklama ve sınırlı kişi sayısıyla özel kafileler.",
      seoTitle: "Lüks Umre Turları",
      seoDescription: "Harem'e sıfır 5 yıldızlı oteller, VIP transfer ve özel rehberlik ile ayrıcalıklı lüks umre programları.",
    },
  }),

  "page.umre-ramazan": block({
    group: "umre",
    title: "Ramazan Umresi",
    description: "/umre/ramazan-umresi listeleme sayfası.",
    path: "/umre/ramazan-umresi",
    fields: listingFields,
    defaults: {
      title: "Ramazan Umresi",
      description:
        "Ramazan ayında yapılan umrenin sevabı kat kat artar. Teravih, mukabele ve iftar organizasyonları ile Ramazan'ı kutsal topraklarda idrak edin.",
      image: "/images/kategori-ramazan.svg",
      sectionTitle: "Ramazan Umresi Programları",
      sectionDescription: "Ramazan'ın manevi ikliminde, özel programlarla düzenlenen umre turları.",
      seoTitle: "Ramazan Umresi",
      seoDescription:
        "Ramazan'ın bereketinde, mukabele ve iftar programları eşliğinde unutulmaz umre. Sevabı kat kat artan bir fırsat.",
    },
  }),

  "page.umre-dua": block({
    group: "umre",
    title: "Umre Dua ve Vazifeler",
    description: "Umre menasik adımları.",
    path: "/umre/dua-ve-vazifeler",
    fields: [
      ...heroFields,
      { type: "text", name: "stepsEyebrow", label: "Menasik — üst etiket" },
      { type: "text", name: "stepsTitle", label: "Menasik — başlık" },
      stepsField,
      ...seoFields,
    ],
    defaults: {
      title: "Umre Dua ve Vazifeler",
      description: "Umrenin adımlarını ve okunacak duaları öğrenerek ibadetinize hazırlanın.",
      image: "/images/kategori-umre.svg",
      stepsEyebrow: "Menasik",
      stepsTitle: "Umre Menasiki — Adım Adım",
      steps: [
        { title: "İhrama Girmek", text: "Mikatta niyet edip telbiye getirerek ihrama girilir. Erkekler dikişsiz iki parça beyaz örtüye bürünür." },
        { title: "Tavaf", text: "Hacerü'l-Esved hizasından başlanarak Kâbe'nin etrafında yedi şavt dönülür." },
        { title: "Sa'y", text: "Safa ve Merve tepeleri arasında yedi gidiş-geliş yapılır." },
        { title: "Tıraş (Halk/Taksir)", text: "Saçların kesilmesiyle ihramdan çıkılır ve umre tamamlanır." },
      ],
      seoTitle: "Umre Dua ve Vazifeler",
      seoDescription: "Umrenin nasıl yapıldığı, menasiki ve okunacak dualar. İhram, tavaf, sa'y ve tıraş adımları.",
    },
  }),

  "page.umre-yetki": block({
    group: "umre",
    title: "Umre Yetki Belgeleri",
    description: "/umre/yetki-belgeleri sayfasının başlığı ve giriş metni.",
    path: "/umre/yetki-belgeleri",
    fields: [...heroFields, { type: "textarea", name: "intro", label: "Giriş metni", rows: 4 }, ...seoFields],
    defaults: {
      title: "Umre Yetki Belgelerimiz",
      description: "Umre programlarımızı resmî yetki belgeleri ile düzenliyor, güveninize layık olmak için çalışıyoruz.",
      image: "/images/belge-tursab.svg",
      intro:
        "Umre organizasyonlarımız TÜRSAB A grubu işletme belgesi ve Diyanet İşleri Başkanlığı yetkisi ile yürütülmektedir. Tüm süreçlerimiz şeffaf, güvenli ve mevzuata uygun şekilde gerçekleştirilir.",
      seoTitle: "Umre Yetki Belgeleri",
      seoDescription: "Umre organizasyonu için TÜRSAB, Diyanet ve IATA yetki belgelerimiz. Şeffaf ve güvenilir hizmet.",
    },
  }),

  /* ============================== TUR / OTEL / BLOG ============================== */
  "page.turlar": block({
    group: "catalog",
    title: "Tüm Turlar",
    description: "/turlar sayfası (kategori filtreli liste).",
    path: "/turlar",
    fields: [...heroFields, ...seoFields],
    defaults: {
      title: "Tüm Turlarımız",
      description: "Hac ve umreden kültür turlarına, tüm programlarımızı tek bir yerde inceleyin.",
      image: "/images/hero-2.svg",
      seoTitle: "Tüm Turlar",
      seoDescription: "Hac, umre, lüks umre, Ramazan umresi ve kültür turlarının tamamı. Kategoriye göre filtreleyin.",
    },
  }),

  "page.oteller": block({
    group: "catalog",
    title: "Oteller",
    description: "/oteller sayfası.",
    path: "/oteller",
    fields: [
      ...heroFields,
      { type: "textarea", name: "mekkeDescription", label: "Mekke bölümü açıklaması", rows: 2 },
      { type: "textarea", name: "medineDescription", label: "Medine bölümü açıklaması", rows: 2 },
      ...seoFields,
    ],
    defaults: {
      title: "Otellerimiz",
      description: "Kutsal mekânlara yakın, konforlu ve güvenli konaklama seçeneklerimizle yolculuğunuz huzurlu geçsin.",
      image: "/images/otel-mekke-3.svg",
      mekkeDescription: "Harem-i Şerif'e yürüme mesafesindeki otellerimiz.",
      medineDescription: "Mescid-i Nebevi'ye yakın konforlu otellerimiz.",
      seoTitle: "Oteller",
      seoDescription: "Mekke ve Medine'de Harem'e yakın, konforlu otel seçeneklerimiz. Otel mesafeleri ve galeri görünümü.",
    },
  }),

  "page.oteller-mekke": block({
    group: "catalog",
    title: "Mekke Otelleri",
    description: "/oteller/mekke sayfası.",
    path: "/oteller/mekke",
    fields: [...heroFields, ...seoFields],
    defaults: {
      title: "Mekke Otelleri",
      description: "Mescid-i Haram'a yürüme mesafesinde, konforlu ve merkezi Mekke otelleri.",
      image: "/images/otel-mekke-3.svg",
      seoTitle: "Mekke Otelleri",
      seoDescription: "Harem-i Şerif'e yürüme mesafesindeki Mekke otellerimiz. Konfor, temizlik ve merkezi konum.",
    },
  }),

  "page.oteller-medine": block({
    group: "catalog",
    title: "Medine Otelleri",
    description: "/oteller/medine sayfası.",
    path: "/oteller/medine",
    fields: [...heroFields, ...seoFields],
    defaults: {
      title: "Medine Otelleri",
      description: "Mescid-i Nebevi ve Ravza-i Mutahhara'ya yakın, huzurlu Medine otelleri.",
      image: "/images/otel-medine-3.svg",
      seoTitle: "Medine Otelleri",
      seoDescription: "Mescid-i Nebevi'ye yakın Medine otellerimiz. Ravza-i Mutahhara'ya yürüme mesafesinde konaklama.",
    },
  }),

  "page.blog": block({
    group: "catalog",
    title: "Blog",
    description: "/blog liste sayfası.",
    path: "/blog",
    fields: [...heroFields, ...seoFields],
    defaults: {
      title: "Blog & Rehber",
      description: "Manevi yolculuğunuza hazırlanırken işinize yarayacak bilgiler ve rehber içerikler.",
      image: "/images/blog-ilk-umre.svg",
      seoTitle: "Blog & Rehber",
      seoDescription: "Hac ve umre hakkında rehber yazılar: hazırlık, ihram, mikat, menasik ve daha fazlası.",
    },
  }),

  /* ============================== KURUMSAL ============================== */
  "page.hakkimizda": block({
    group: "corporate",
    title: "Hakkımızda",
    description: "Hikâye, misyon-vizyon-değerler ve tecrübe rozeti.",
    path: "/hakkimizda",
    fields: [
      ...heroFields,
      { type: "text", name: "storyEyebrow", label: "Hikâye — üst etiket" },
      { type: "text", name: "storyTitle", label: "Hikâye — başlık", help: "Boş bırakılırsa site adı kullanılır." },
      { type: "lines", name: "storyParagraphs", label: "Hikâye paragrafları", help: "Her satır ayrı bir paragraf olur.", rows: 6 },
      { type: "image", name: "storyImage", label: "Hikâye görseli" },
      { type: "text", name: "badgeValue", label: "Rozet değeri", placeholder: "20+" },
      { type: "text", name: "badgeLabel", label: "Rozet etiketi", placeholder: "Yıllık Tecrübe" },
      {
        type: "list",
        name: "values",
        label: "Misyon / Vizyon / Değerler",
        itemLabel: "Kart",
        titleField: "title",
        max: 6,
        fields: [
          { type: "icon", name: "icon", label: "İkon" },
          { type: "text", name: "title", label: "Başlık" },
          { type: "textarea", name: "text", label: "Metin", rows: 2 },
        ],
      },
      { type: "text", name: "featuresEyebrow", label: "Avantajlar — üst etiket", help: "Kartların kendisi 'Ana Sayfa › Neden Biz?' bloğundan gelir." },
      { type: "text", name: "featuresTitle", label: "Avantajlar — başlık" },
      ...seoFields,
    ],
    defaults: {
      title: "Hakkımızda",
      description: "Manevi yolculuğunuzu bir emanet olarak görüyor, güven ve samimiyetle hizmet veriyoruz.",
      image: "/images/about.svg",
      storyEyebrow: "Biz Kimiz?",
      storyTitle: "",
      storyParagraphs: [
        "Rotamız Huzura, 20 yılı aşkın süredir hac, umre ve kültür turları alanında hizmet veren, TÜRSAB ve Diyanet İşleri Başkanlığı yetki belgelerine sahip bir seyahat acentasıdır. Her misafirimizin kutsal yolculuğunu bir emanet bilinciyle titizlikle organize ediyoruz.",
        "Merkezi oteller, tecrübeli din görevlileri, şeffaf fiyat politikası ve 7/24 destek anlayışımızla, ibadetinize huzur içinde odaklanmanızı sağlıyoruz. Bugüne kadar 25.000'den fazla misafirimizi kutsal topraklarla buluşturmanın mutluluğunu yaşadık.",
      ],
      storyImage: "/images/about.svg",
      badgeValue: "20+",
      badgeLabel: "Yıllık Tecrübe",
      values: [
        { icon: "Target", title: "Misyonumuz", text: "Her misafirimizin manevi yolculuğunu güven, konfor ve huzur içinde tamamlamasını sağlamak." },
        { icon: "Eye", title: "Vizyonumuz", text: "Hac ve umre organizasyonunda kalite ve güvenin öncü markası olmak." },
        { icon: "Heart", title: "Değerlerimiz", text: "Samimiyet, şeffaflık, emanet bilinci ve misafir memnuniyeti." },
      ],
      featuresEyebrow: "Farkımız",
      featuresTitle: "Neden Bizi Tercih Etmelisiniz?",
      seoTitle: "Hakkımızda",
      seoDescription:
        "Rotamız Huzura; TÜRSAB ve Diyanet yetki belgeli, 20 yılı aşkın tecrübesiyle hac, umre ve kültür turları düzenleyen premium seyahat acentası.",
    },
  }),

  "page.gerekli-bilgiler": block({
    group: "corporate",
    title: "Gerekli Bilgiler",
    description: "Pasaport, aşı, valiz listesi gibi bilgi bölümleri.",
    path: "/gerekli-bilgiler",
    fields: [
      ...heroFields,
      {
        type: "list",
        name: "sections",
        label: "Bilgi bölümleri",
        itemLabel: "Bölüm",
        titleField: "title",
        max: 20,
        fields: [
          {
            type: "text",
            name: "anchor",
            label: "Bağlantı kimliği",
            placeholder: "valiz",
            help: "Sayfa içi bağlantı için (ör. /gerekli-bilgiler#valiz). Sadece küçük harf, rakam ve tire.",
          },
          { type: "text", name: "title", label: "Bölüm başlığı" },
          { type: "lines", name: "items", label: "Maddeler (her satıra bir madde)", rows: 5 },
        ],
      },
      { type: "text", name: "ctaTitle", label: "Alt çağrı başlığı" },
      { type: "textarea", name: "ctaDescription", label: "Alt çağrı açıklaması", rows: 2 },
      ...seoFields,
    ],
    defaults: {
      title: "Gerekli Bilgiler",
      description: "Kutsal yolculuğunuza sorunsuz bir şekilde hazırlanmanız için bilmeniz gereken her şey.",
      image: "/images/blog-valiz.svg",
      sections: [
        {
          anchor: "pasaport",
          title: "Pasaport ve Vize",
          items: [
            "Pasaportunuzun dönüş tarihinden itibaren en az 6 ay geçerli olması gerekir.",
            "Umre vizesi işlemleri acentamız tarafından yürütülür.",
            "Vize için biyometrik fotoğraf ve gerekli evraklar önceden teslim edilmelidir.",
          ],
        },
        {
          anchor: "asi",
          title: "Sağlık ve Aşı",
          items: [
            "Meningokok (ACWY) aşısı zorunludur; aşı kartınızı yanınızda bulundurun.",
            "Kronik rahatsızlığı olanlar ilaçlarını reçetesiyle taşımalıdır.",
            "Seyahat sağlık sigortası tavsiye edilir.",
          ],
        },
        {
          anchor: "valiz",
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
          anchor: "para",
          title: "Döviz ve Harcama",
          items: [
            "Suudi Arabistan para birimi Riyal (SAR)'dir.",
            "Yanınızda bir miktar nakit bulundurmanız pratik olur.",
            "Kredi kartları büyük mağaza ve otellerde geçerlidir.",
          ],
        },
        {
          anchor: "iletisim",
          title: "İletişim ve Ulaşım",
          items: [
            "Yurt dışı görüşme için hat açtırmayı veya yerel SIM/eSIM almayı unutmayın.",
            "Grup kartınızı ve rehber telefonunu her zaman yanınızda taşıyın.",
            "Otel ve toplanma noktalarını önceden not edin.",
          ],
        },
      ],
      ctaTitle: "Sorularınız mı var?",
      ctaDescription: "Yolculuk hazırlıklarınızla ilgili tüm sorularınız için danışmanlarımız yanınızda.",
      seoTitle: "Gerekli Bilgiler",
      seoDescription:
        "Umre ve hac yolculuğu öncesi bilmeniz gerekenler: pasaport, vize, aşı, valiz listesi, döviz ve iletişim.",
    },
  }),

  "page.iletisim": block({
    group: "corporate",
    title: "İletişim",
    description: "İletişim sayfası başlıkları. Telefon, adres ve harita 'Site Ayarları'ndan gelir.",
    path: "/iletisim",
    fields: [
      ...heroFields,
      { type: "text", name: "formEyebrow", label: "Form — üst etiket" },
      { type: "text", name: "formTitle", label: "Form — başlık" },
      { type: "textarea", name: "formDescription", label: "Form — açıklama", rows: 2 },
      ...seoFields,
    ],
    defaults: {
      title: "İletişim",
      description:
        "Sorularınız, önerileriniz ve rezervasyon talepleriniz için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.",
      image: "/images/hero-3.svg",
      formEyebrow: "Bize Yazın",
      formTitle: "Mesaj Gönderin",
      formDescription: "Formu doldurun, en kısa sürede size dönüş yapalım.",
      seoTitle: "İletişim",
      seoDescription:
        "Bize ulaşın. Telefon, WhatsApp, e-posta ve adres bilgilerimiz. Hac ve umre programları için danışmanlarımız hazır.",
    },
  }),

  "page.rezervasyon": block({
    group: "corporate",
    title: "Rezervasyon",
    description: "Rezervasyon sayfası başlığı ve yan bilgi kutuları.",
    path: "/rezervasyon",
    fields: [
      ...heroFields,
      { type: "text", name: "benefitsTitle", label: "Avantaj kutusu başlığı" },
      { type: "lines", name: "benefits", label: "Avantajlar (her satıra bir madde)", rows: 4 },
      { type: "text", name: "whatsappTitle", label: "WhatsApp kutusu başlığı" },
      { type: "textarea", name: "whatsappText", label: "WhatsApp kutusu metni", rows: 2 },
      ...seoFields,
    ],
    defaults: {
      title: "Rezervasyon Talebi",
      description:
        "Aşağıdaki formu doldurarak rezervasyon talebinizi iletebilirsiniz. Ödeme öncesi danışmanlarımız sizi arayarak tüm detayları paylaşır.",
      image: "/images/hero-1.svg",
      benefitsTitle: "Neden bizimle rezervasyon?",
      benefits: [
        "Yetkili acenta güvencesi ve sözleşmeli hizmet",
        "Şeffaf fiyat, gizli ücret yok",
        "24 saat içinde geri dönüş",
      ],
      whatsappTitle: "Hemen bilgi alın",
      whatsappText: "Formu doldurmak istemiyorsanız, WhatsApp üzerinden de bize ulaşabilirsiniz.",
      seoTitle: "Rezervasyon",
      seoDescription:
        "Hac, umre veya kültür turu rezervasyon talebinizi oluşturun. Danışmanlarımız en kısa sürede sizinle iletişime geçsin.",
    },
  }),

  /* ============================== ORTAK BÖLÜMLER ============================== */
  "shared.cta": block({
    group: "shared",
    title: "Çağrı Bandı (CTA)",
    description: "Birçok sayfanın altındaki 'Rezervasyon Yap / WhatsApp' bandı.",
    path: "/turlar",
    fields: [
      { type: "text", name: "title", label: "Başlık" },
      { type: "textarea", name: "description", label: "Açıklama", rows: 2 },
      { type: "image", name: "image", label: "Arka plan görseli" },
      { type: "text", name: "primaryLabel", label: "Rezervasyon butonu metni" },
      { type: "text", name: "whatsappLabel", label: "WhatsApp butonu metni" },
    ],
    defaults: {
      title: "Manevi Yolculuğunuza Bugün Başlayın",
      description: "Uzman danışmanlarımız size en uygun programı belirlemek için hazır. Hemen iletişime geçin.",
      image: "/images/cta-bg.svg",
      primaryLabel: "Rezervasyon Yap",
      whatsappLabel: "WhatsApp'tan Yazın",
    },
  }),

  "shared.certificates": block({
    group: "shared",
    title: "Belgeler ve Yetki Bölümü",
    description: "Belgeler bölümünün başlığı ve yetki sayfalarındaki güven maddeleri. Belgelerin kendisi 'Belgeler' menüsünden yönetilir.",
    path: "/hac/yetki-belgeleri",
    fields: [
      ...headingFields(),
      {
        type: "list",
        name: "points",
        label: "Güven maddeleri (yetki sayfaları)",
        itemLabel: "Madde",
        titleField: "title",
        max: 8,
        fields: [
          { type: "icon", name: "icon", label: "İkon" },
          { type: "text", name: "title", label: "Başlık" },
          { type: "textarea", name: "text", label: "Açıklama", rows: 2 },
        ],
      },
    ],
    defaults: {
      eyebrow: "Güven ve Yetki",
      title: "Belgelerimiz ve Yetkilerimiz",
      description: "Resmî kurumlar tarafından onaylanmış belgelerimizle, güvenle emin ellerde olduğunuzu bilin.",
      points: [
        { icon: "BadgeCheck", title: "TÜRSAB A Grubu", text: "A grubu seyahat acentası işletme belgesine sahibiz." },
        { icon: "Award", title: "Diyanet Yetkisi", text: "Diyanet İşleri Başkanlığı'nca yetkilendirilmiş organizasyon." },
        { icon: "FileCheck2", title: "IATA Üyeliği", text: "Uluslararası hava taşımacılığı akreditasyonu." },
        { icon: "ShieldCheck", title: "Güvenli Ödeme", text: "Sözleşmeli, şeffaf ve güvenli ödeme altyapısı." },
      ],
    },
  }),

  "shared.dualar": block({
    group: "shared",
    title: "Dualar",
    description: "Hac ve umre dua sayfalarında gösterilen dualar.",
    path: "/umre/dua-ve-vazifeler",
    fields: [
      ...headingFields(),
      {
        type: "list",
        name: "items",
        label: "Dualar",
        itemLabel: "Dua",
        titleField: "title",
        max: 20,
        fields: [
          { type: "text", name: "title", label: "Dua adı" },
          { type: "textarea", name: "arabic", label: "Arapça metin", rows: 2 },
          { type: "textarea", name: "text", label: "Okunuşu", rows: 2 },
          { type: "textarea", name: "meaning", label: "Anlamı", rows: 2 },
        ],
      },
    ],
    defaults: {
      eyebrow: "Dualar",
      title: "Yolculukta Okunacak Dualar",
      description: "İhrama girerken ve ibadetler esnasında okunan başlıca dualar.",
      items: [
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
      ],
    },
  }),

  "shared.booking": block({
    group: "shared",
    title: "Başvuru Formu ve Tur Detay Metinleri",
    description: "Başvuru formu mesajları ve tur detay sayfasındaki rezervasyon kutusu.",
    path: "/rezervasyon",
    fields: [
      { type: "text", name: "submitLabel", label: "Gönder butonu metni" },
      { type: "textarea", name: "consentText", label: "Form altı onay metni", rows: 2 },
      { type: "text", name: "successTitle", label: "Başarılı gönderim başlığı" },
      { type: "textarea", name: "successText", label: "Başarılı gönderim metni", rows: 2 },
      { type: "text", name: "sidebarTitle", label: "Tur detay — form başlığı" },
      { type: "text", name: "sidebarText", label: "Tur detay — form alt metni" },
      { type: "text", name: "defaultPriceNote", label: "Başlangıç fiyatı altındaki varsayılan not", help: "Turda özel bir fiyat notu girilmemişse bu gösterilir." },
      { type: "textarea", name: "priceDisclaimer", label: "Oda fiyatları altındaki uyarı", rows: 2 },
      { type: "text", name: "pastTourTitle", label: "Tarihi geçmiş tur — başlık" },
      { type: "textarea", name: "pastTourText", label: "Tarihi geçmiş tur — açıklama", rows: 2 },
    ],
    defaults: {
      submitLabel: "Başvuruyu Gönder",
      consentText: "Formu göndererek bilgilerinizin başvurunuz kapsamında işlenmesini kabul edersiniz.",
      successTitle: "Başvurunuz Alındı",
      successText: "Talebiniz bize ulaştı. Danışmanlarımız en kısa sürede sizinle iletişime geçecek.",
      sidebarTitle: "Hemen Rezervasyon Yapın",
      sidebarText: "Formu doldurun, sizi arayalım.",
      defaultPriceNote: "kişi başı",
      priceDisclaimer: "* Fiyatlar kişi başıdır ve bilgilendirme amaçlıdır. Güncel fiyat için lütfen iletişime geçin.",
      pastTourTitle: "Bu programın tarihi geçti",
      pastTourText: "Benzer tarihlerdeki yeni programlarımız için danışmanlarımızla iletişime geçebilirsiniz.",
    },
  }),

  "shared.footer": block({
    group: "shared",
    title: "Alt Bilgi (Footer)",
    description: "Footer üstündeki çağrı şeridi, güven rozetleri ve en alt not.",
    path: "/",
    fields: [
      { type: "text", name: "ctaTitle", label: "Çağrı şeridi başlığı" },
      { type: "textarea", name: "ctaText", label: "Çağrı şeridi metni", rows: 2 },
      { type: "lines", name: "trustBadges", label: "Güven rozetleri (her satıra bir rozet)", rows: 4 },
      { type: "text", name: "bottomNote", label: "En alt sağ not", help: "Boş bırakılırsa gösterilmez." },
    ],
    defaults: {
      ctaTitle: "Kutsal yolculuğunuz için hazır mısınız?",
      ctaText: "Uzman danışmanlarımız size en uygun programı bulmak için hazır.",
      trustBadges: ["TÜRSAB A Grubu Belge", "Diyanet Yetki Belgeli", "IATA Üyesi", "Güvenli Ödeme"],
      bottomNote: "",
    },
  }),
} satisfies Record<string, BlockDef<Record<string, unknown>>>;

export type ContentKey = keyof typeof CONTENT_BLOCKS;
export type ContentData<K extends ContentKey> = (typeof CONTENT_BLOCKS)[K]["defaults"];

export function isContentKey(key: string): key is ContentKey {
  return Object.prototype.hasOwnProperty.call(CONTENT_BLOCKS, key);
}

export const CONTENT_KEYS = Object.keys(CONTENT_BLOCKS) as ContentKey[];
