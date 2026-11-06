/**
 * Tam sayı tutarı ağırlıklara orantılı böler (grup tahsilatı / grup peşinatı).
 * Parçaların toplamı her zaman `total`a eşittir; yuvarlamadan kalan birimler
 * küsuratı en büyük olanlara dağıtılır. Hiçbir parça kendi ağırlığını aşmaz
 * (ağırlık = kişinin kalan borcu); toplam ağırlıktan büyük tutar verilirse
 * fazlası dağıtılmaz.
 */
export function splitProportional(total: number, weights: number[]): number[] {
  const w = weights.map((x) => Math.max(0, Math.floor(x)));
  const sum = w.reduce((a, b) => a + b, 0);
  const amount = Math.min(Math.max(0, Math.floor(total)), sum);
  if (amount === 0 || sum === 0) return w.map(() => 0);

  const exact = w.map((x) => (amount * x) / sum);
  const parts = exact.map(Math.floor);
  let left = amount - parts.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left === 0) break;
    if (parts[i] < w[i]) {
      parts[i]++;
      left--;
    }
  }
  return parts;
}
