"use server";

import { prisma } from "@/lib/prisma";
import { cleanRoomNo } from "@/lib/rooming";
import { clientIp, registerHit, retryAfter } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types";

/**
 * Görevli ekranı (/oda/<gizli bağlantı>): giriş yoktur, yetki bağlantıdaki anahtardır.
 * Görevli yalnızca o turun odalarına otelin verdiği oda numaralarını yazabilir.
 */

const invalidLink = { ok: false, message: "Bağlantı geçersiz ya da kapatılmış. Ofisten yeni bağlantı isteyin." } as const;

export async function guideSetRoomNumber(token: string, roomIdIn: number, field: string, value: string): Promise<ActionResult> {
  try {
    const key = `gorevli:${await clientIp()}`;
    if (retryAfter(key, 300, 10 * 60_000)) return { ok: false, message: "Çok fazla işlem yapıldı; birkaç dakika sonra tekrar deneyin." };
    registerHit(key);

    if (typeof token !== "string" || token.length < 20 || token.length > 64) return invalidLink;
    const tour = await prisma.serviceTour.findUnique({ where: { guideToken: token }, select: { id: true } });
    if (!tour) return invalidLink;
    const roomId = Number(roomIdIn);
    if (!Number.isInteger(roomId) || roomId <= 0 || (field !== "meccaNo" && field !== "medinaNo")) return { ok: false, message: "Geçersiz istek." };
    const room = await prisma.tourRoom.findUnique({ where: { id: roomId }, select: { tourId: true } });
    if (!room || room.tourId !== tour.id) return { ok: false, message: "Oda bulunamadı; sayfayı yenileyin." };
    const v = cleanRoomNo(value);
    if (v === false) return { ok: false, message: "Oda numarasında yalnızca harf, rakam, boşluk ve - / kullanılabilir (en fazla 12 karakter)." };

    await prisma.tourRoom.update({ where: { id: roomId }, data: { [field]: v } });
    await prisma.activityLog.create({
      data: {
        userName: "Görevli (bağlantı)",
        entity: "ServiceTour",
        entityId: String(tour.id),
        detail: `Odalama: ${field === "meccaNo" ? "Mekke" : "Medine"} oda no ${v ?? "silindi"} (görevli ekranından)`,
      },
    });
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    console.error("[görevli-ekranı]", e);
    return { ok: false, message: "Kaydedilemedi; bağlantınızı kontrol edip tekrar deneyin." };
  }
}
