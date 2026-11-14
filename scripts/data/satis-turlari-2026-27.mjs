// Satış Programı turları: 2026-27 umre seferleri (sitedeki seferlerle aynı tarih ve fiyatlar).
// Bir kez çalışır; bkz. scripts/data-updates.mjs. Aynı gidiş tarihi ve gün sayısında satış turu
// zaten varsa (ör. panelden elle girilmişse) o sefer atlanır.
// - Kontenjanlar sefer listesindeki parantez içi sayılardır (135, 45, …)
// - 19 günlük sefer sitedeki gibi 20 günlük fiyatla
// - Çocuk ücretleri bütün seferlerde aynı: 0-2 yaş 550 $, 2-6 yaş 850 $, 6-11 yaş 1000 $
// - Görevliler sonradan panelden atanır

const PERIOD = "2026-27 Umre Sezonu";
const P20 = { price2: 1690, price3: 1640, price4: 1590 };
const P14 = { price2: 1590, price3: 1540, price4: 1490 };
const PRAMAZAN = { price2: 2220, price3: 2050, price4: 1900 };
const KIDS = { priceAge0to2: 550, priceAge2to6: 850, priceAge6to11: 1000 };

const STANDART = "Mekke: Kudi Tower · Medine: Grand Alshahba Hotel";
const RAMAZAN = "Mekke: Harem'e servisli otel (3–4 km) · Medine: Grand Alshahba Hotel";

const SEFERLER = [
  { name: "20 Günlük Umre — 15 Aralık", date: "2026-12-15", days: 20, capacity: 135, prices: P20, accommodation: STANDART, note: "Sivas direkt uçuş" },
  { name: "14 Günlük Umre — 20 Aralık", date: "2026-12-20", days: 14, capacity: 45, prices: P14, accommodation: STANDART, note: "İstanbul uçuşlu" },
  { name: "20 Günlük Miraç Kandili Umresi — 30 Aralık", date: "2026-12-30", days: 20, capacity: 149, prices: P20, accommodation: STANDART, note: "Sivas direkt uçuş · Miraç Kandili" },
  { name: "19 Günlük Sömestr Umresi — 18 Ocak", date: "2027-01-18", days: 19, capacity: 160, prices: P20, accommodation: STANDART, note: "Sivas direkt uçuş · Sömestr tatili" },
  { name: "14 Günlük Sömestr Umresi — 22 Ocak", date: "2027-01-22", days: 14, capacity: 140, prices: P14, accommodation: STANDART, note: "Sivas direkt uçuş · Sömestr tatili" },
  { name: "Tam Ramazan Umresi — 35 Gün (5 Şubat)", date: "2027-02-05", days: 35, capacity: 69, prices: PRAMAZAN, accommodation: RAMAZAN, note: "Tam Ramazan" },
  { name: "14 Günlük Şevval Umresi — 12 Mart", date: "2027-03-12", days: 14, capacity: 140, prices: P14, accommodation: STANDART, note: "Şevval umresi" },
  { name: "20 Günlük Şevval Umresi — 12 Mart", date: "2027-03-12", days: 20, capacity: 60, prices: P20, accommodation: STANDART, note: "Şevval umresi" },
];

/** "2026-12-15" + n gün (UTC gece yarısı; formdaki tarihlerle aynı biçim) */
function day(date, plus = 0) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + plus);
  return d;
}

export const satisTurlari202627 = {
  id: "satis-turlari-2026-27",
  /** @param {import("@prisma/client").Prisma.TransactionClient} tx */
  async run(tx) {
    const log = [];
    for (const s of SEFERLER) {
      const departureDate = day(s.date);
      const existing = await tx.serviceTour.findFirst({ where: { departureDate, days: s.days }, select: { id: true, name: true } });
      if (existing) {
        log.push(`atlandı (zaten var: #${existing.id} ${existing.name}): ${s.name}`);
        continue;
      }
      const t = await tx.serviceTour.create({
        data: {
          name: s.name,
          period: PERIOD,
          departureDate,
          returnDate: day(s.date, s.days - 1),
          days: s.days,
          capacity: s.capacity,
          ...s.prices,
          ...KIDS,
          currency: "USD",
          accommodation: s.accommodation,
          note: s.note,
          isActive: true,
        },
      });
      log.push(`eklendi: #${t.id} ${s.name} (kontenjan ${s.capacity})`);
    }
    return log;
  },
};
