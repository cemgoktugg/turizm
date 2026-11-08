// Umre seferlerinin Medine oteli: "Konak grup otelleri" → "Grand Alshahba Hotel".
// Bir kez çalışır; bkz. scripts/data-updates.mjs. Yalnızca hâlâ eski adı taşıyan kayıtlar
// değişir (panelden düzeltilmiş olanlara dokunulmaz). Mesafe (300 m) olduğu gibi kalır.

const OLD = "Konak grup otelleri";
const NEW = "Grand Alshahba Hotel";

export const medineOteliGrandAlshahba = {
  id: "medine-oteli-grand-alshahba",
  /** @param {import("@prisma/client").Prisma.TransactionClient} tx */
  async run(tx) {
    const hotels = await tx.tourHotel.updateMany({ where: { name: OLD }, data: { name: NEW } });
    const tours = await tx.tour.findMany({ where: { description: { contains: OLD } }, select: { id: true, description: true } });
    for (const t of tours) {
      await tx.tour.update({ where: { id: t.id }, data: { description: t.description.split(OLD).join(NEW) } });
    }
    return [`otel kartı: ${hotels.count}`, `tur açıklaması: ${tours.length}`];
  },
};
