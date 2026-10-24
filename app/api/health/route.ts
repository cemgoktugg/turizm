import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Çalışma durumu kontrolü (UptimeRobot, Better Stack vb. izleme servisleri için).
 * Site ve veritabanı yanıt veriyorsa 200, veritabanına ulaşılamıyorsa 503 döner.
 */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", db: "ok", ms: Date.now() - started, uptime: Math.round(process.uptime()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[sağlık]", err instanceof Error ? err.message : err);
    return Response.json({ status: "error", db: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
