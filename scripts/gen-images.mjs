// Marka renkli, premium görünümlü SVG placeholder görselleri üretir.
// Gerçek fotoğraflar admin panelinden değiştirilebilir.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "images");
mkdirSync(OUT, { recursive: true });

// Nemira logo paleti: turkuaz #008499 · lacivert #000f20 · altın #c9934a
const PALETTES = {
  teal: ["#000f20", "#0b4a5c", "#00788c"],
  night: ["#000a16", "#072236", "#1d2c43"],
  gold: ["#52381f", "#9c6b2e", "#c9934a"],
  dawn: ["#072236", "#0b4a5c", "#7f5626"],
  sand: ["#654423", "#9c6b2e", "#ebd2ae"],
};

/** Küçük yıldız serpiştirmesi (deterministik) */
function stars(seed, count = 26) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = Math.round(rnd() * 1600);
    const y = Math.round(rnd() * 500);
    const r = (rnd() * 1.6 + 0.4).toFixed(2);
    const o = (rnd() * 0.5 + 0.2).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5e9d7" opacity="${o}"/>`;
  }
  return out;
}

/** Cami silüeti (kubbe + minareler) */
function mosque(cx, baseY, scale = 1, fill = "#000f20", op = 0.9) {
  const w = 260 * scale;
  const domeR = 70 * scale;
  const bodyH = 90 * scale;
  const x = cx - w / 2;
  return `
    <g fill="${fill}" opacity="${op}">
      <rect x="${x}" y="${baseY - bodyH}" width="${w}" height="${bodyH}" rx="6"/>
      <path d="M ${cx - domeR} ${baseY - bodyH}
               Q ${cx} ${baseY - bodyH - domeR * 1.5} ${cx + domeR} ${baseY - bodyH} Z"/>
      <rect x="${cx - 4 * scale}" y="${baseY - bodyH - domeR * 1.5 - 26 * scale}" width="${8 * scale}" height="${28 * scale}" rx="3"/>
      <circle cx="${cx}" cy="${baseY - bodyH - domeR * 1.5 - 30 * scale}" r="${6 * scale}"/>
      <rect x="${x - 30 * scale}" y="${baseY - bodyH - 60 * scale}" width="${16 * scale}" height="${bodyH + 60 * scale}" rx="4"/>
      <path d="M ${x - 30 * scale} ${baseY - bodyH - 60 * scale} q ${8 * scale} ${-24 * scale} ${16 * scale} 0 Z"/>
      <rect x="${x + w + 14 * scale}" y="${baseY - bodyH - 60 * scale}" width="${16 * scale}" height="${bodyH + 60 * scale}" rx="4"/>
      <path d="M ${x + w + 14 * scale} ${baseY - bodyH - 60 * scale} q ${8 * scale} ${-24 * scale} ${16 * scale} 0 Z"/>
    </g>`;
}

/** Tekrarlayan İslami geometrik arka plan deseni */
function pattern(id, color) {
  return `
  <pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="${color}" stroke-width="1" opacity="0.35"/>
    <circle cx="30" cy="30" r="6" fill="none" stroke="${color}" stroke-width="1" opacity="0.25"/>
  </pattern>`;
}

/** SVG metinlerinde XML özel karakterlerini kaçışlar (ör. "Hac & Umre") */
function xml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svg({
  w = 1600,
  h = 1000,
  palette = "teal",
  label = "",
  sub = "",
  withMosque = true,
  withStars = true,
  seed = 7,
}) {
  const [c1, c2, c3] = PALETTES[palette];
  const id = `g${seed}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="0.55" stop-color="${c2}"/>
      <stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="${id}g" cx="0.5" cy="0.1" r="0.9">
      <stop offset="0" stop-color="#c9934a" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#c9934a" stop-opacity="0"/>
    </radialGradient>
    ${pattern(id + "p", "#c9934a")}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${id})"/>
  <rect width="${w}" height="${h}" fill="url(#${id}p)"/>
  <rect width="${w}" height="${h}" fill="url(#${id}g)"/>
  ${withStars ? stars(seed * 31) : ""}
  <ellipse cx="${w * 0.78}" cy="${h * 0.22}" rx="70" ry="70" fill="#f5e9d7" opacity="0.9"/>
  <ellipse cx="${w * 0.8}" cy="${h * 0.2}" rx="70" ry="70" fill="url(#${id})" opacity="0.55"/>
  ${withMosque ? mosque(w * 0.5, h * 0.92, w / 1600, "#000a16", 0.55) : ""}
  ${withMosque ? mosque(w * 0.2, h * 0.95, (w / 1600) * 0.7, "#00060e", 0.4) : ""}
  ${withMosque ? mosque(w * 0.82, h * 0.96, (w / 1600) * 0.8, "#00060e", 0.4) : ""}
  ${
    label
      ? `<text x="${w / 2}" y="${h * 0.46}" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.05}" fill="#f8f5ef" font-weight="700" letter-spacing="1">${xml(label)}</text>`
      : ""
  }
  ${
    sub
      ? `<text x="${w / 2}" y="${h * 0.55}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${w * 0.02}" fill="#ebd2ae" letter-spacing="4" text-transform="uppercase">${xml(sub)}</text>`
      : ""
  }
</svg>`;
}

function write(name, content) {
  writeFileSync(join(OUT, name), content.trim());
  console.log("✓", name);
}

// Hero slaytları
// Hero görselleri arka plan olarak kullanıldığı için yazısız üretilir (başlık sitede ayrıca yazılır)
write("hero-1.svg", svg({ h: 900, palette: "night", label: "", sub: "", seed: 3 }));
write("hero-2.svg", svg({ h: 900, palette: "teal", label: "", sub: "", seed: 5 }));
write("hero-3.svg", svg({ h: 900, palette: "dawn", label: "", sub: "", seed: 9 }));

// Kategoriler
write("kategori-hac.svg", svg({ palette: "night", label: "Hac", seed: 11 }));
write("kategori-umre.svg", svg({ palette: "teal", label: "Umre", seed: 13 }));
write("kategori-luks.svg", svg({ palette: "gold", label: "Lüks Umre", seed: 15 }));
write("kategori-ramazan.svg", svg({ palette: "dawn", label: "Ramazan", seed: 17 }));
write("kategori-kultur.svg", svg({ palette: "sand", label: "Kültür Turları", withMosque: false, seed: 19 }));

// Turlar
const tours = [
  ["tur-ekonomik-umre", "night", "13 Gün Umre"],
  ["tur-20-gun-umre", "teal", "20 Gün Umre"],
  ["tur-luks-umre", "gold", "Lüks Umre"],
  ["tur-ramazan-umresi", "dawn", "Ramazan Umresi"],
  ["tur-hac-2026", "night", "Hac 2026"],
  ["tur-kudus", "sand", "Kudüs Turu"],
  ["tur-balkan", "teal", "Balkan Turu"],
];
tours.forEach(([name, pal, label], i) =>
  write(`${name}.svg`, svg({ palette: pal, label, seed: 21 + i * 2, withMosque: pal !== "sand" })),
);

// Oteller
const hotels = [
  ["otel-mekke-1", "gold", "Mekke Oteli"],
  ["otel-mekke-2", "dawn", "Mekke Oteli"],
  ["otel-mekke-3", "teal", "Mekke Oteli"],
  ["otel-medine-1", "night", "Medine Oteli"],
  ["otel-medine-2", "teal", "Medine Oteli"],
  ["otel-medine-3", "gold", "Medine Oteli"],
];
hotels.forEach(([name, pal, label], i) =>
  write(`${name}.svg`, svg({ palette: pal, label, sub: "5★ KONAKLAMA", seed: 41 + i * 2 })),
);

// Blog
const blogs = [
  ["blog-valiz", "sand", "Umre Valizi"],
  ["blog-ilk-umre", "teal", "İlk Umre Rehberi"],
  ["blog-hac-umre-fark", "night", "Hac & Umre"],
  ["blog-ihram", "dawn", "İhram"],
  ["blog-mikat", "gold", "Mikat"],
];
blogs.forEach(([name, pal, label], i) =>
  write(`${name}.svg`, svg({ palette: pal, label, withMosque: false, seed: 61 + i * 2 })),
);

// Sertifikalar
write("belge-tursab.svg", svg({ w: 900, h: 1200, palette: "night", label: "TÜRSAB", sub: "A GRUBU BELGE", withMosque: false, seed: 81 }));
write("belge-diyanet.svg", svg({ w: 900, h: 1200, palette: "teal", label: "Diyanet", sub: "YETKİ BELGESİ", withMosque: false, seed: 83 }));
write("belge-iata.svg", svg({ w: 900, h: 1200, palette: "gold", label: "IATA", sub: "ÜYELİK", withMosque: false, seed: 85 }));

// Genel / OG / hakkımızda
write("about.svg", svg({ palette: "teal", label: "Hakkımızda", seed: 91 }));
write("cta-bg.svg", svg({ h: 700, palette: "night", withMosque: true, withStars: true, seed: 93 }));
// Paylaşım görseli ve logolar logodan üretilmiştir: nemira-og.png, nemira-logo*.png, nemira-icon.png
write("logo-mark.svg", svg({ w: 200, h: 200, palette: "teal", withMosque: true, withStars: false, seed: 97 }));

console.log("\nTüm görseller oluşturuldu →", OUT);
