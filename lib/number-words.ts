/** Makbuzlardaki "Yalnız: ..." satırı için tutarın Türkçe yazılışı (istemci ve sunucuda kullanılabilir) */

const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
const SCALES = ["", "bin", "milyon", "milyar"];

const CURRENCY_NAMES: Record<string, string> = {
  USD: "ABD Doları",
  EUR: "Euro",
  TRY: "Türk Lirası",
  SAR: "Suudi Riyali",
};

/** 0-999 */
function threeDigits(n: number): string[] {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  return [h === 0 ? "" : h === 1 ? "yüz" : `${ONES[h]} yüz`, TENS[t], ONES[o]].filter(Boolean);
}

/** 1550 → "bin beş yüz elli" (tam sayı; eksi işaret yok sayılır) */
export function numberToWords(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return "sıfır";
  const words: string[] = [];
  for (let i = 0; n > 0 && i < SCALES.length; i++) {
    const chunk = n % 1000;
    n = Math.floor(n / 1000);
    if (chunk === 0) continue;
    // "bir bin" denmez, yalnızca "bin"
    const part = i === 1 && chunk === 1 ? [] : threeDigits(chunk);
    words.unshift([...part, SCALES[i]].filter(Boolean).join(" "));
  }
  return words.join(" ");
}

/** 1550, "USD" → "Bin beş yüz elli ABD Doları" */
export function amountInWords(value: number, currency: string): string {
  const text = `${numberToWords(value)} ${CURRENCY_NAMES[currency] ?? currency}`;
  return text.charAt(0).toLocaleUpperCase("tr") + text.slice(1);
}
