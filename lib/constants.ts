export type NavChild = { label: string; href: string; desc?: string };
export type NavItem = { label: string; href: string; children?: NavChild[] };

export const NAV: NavItem[] = [
  { label: "Ana Sayfa", href: "/" },
  {
    label: "Hac",
    href: "/hac",
    children: [
      { label: "Hac Programları", href: "/hac/programlari", desc: "Hac paketleri ve ön kayıt" },
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

// Sayfa metinleri, avantajlar, menasik adımları ve dualar artık
// admin panelindeki "Sayfa İçerikleri" bölümünden yönetilir (lib/content/registry.ts).
