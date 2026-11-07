// Canlı ortam: ADMIN_EMAIL / ADMIN_PASSWORD ortam değişkenleriyle yönetici hesabını hazırlar.
// - Bu e-postayla hesap varsa hiçbir şeye dokunmaz (her açılışta şifreyi ezmez).
// - İlk kurulumdaki varsayılan hesap (admin@turizm.com / admin123) duruyorsa onu bu bilgilere çevirir.
// Panel kullanıcıları (ALPEREN_PASSWORD vb.): şifresi girilmişse ve hesap yoksa oluşturur.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEFAULT_EMAIL = "admin@turizm.com";
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const prisma = new PrismaClient();

const PANEL_USERS = [
  { name: "Ömer Ali Gültekin", email: "omer@nemiraturizm.com", password: process.env.OMER_PASSWORD, role: "STAFF" },
  { name: "Alperen Gültekin", email: "alperen@nemiraturizm.com", password: process.env.ALPEREN_PASSWORD, role: "STAFF" },
  // SALES: yalnızca Satış Programı (/satis)
  { name: "Ofis", email: "ofis@nemiraturizm.com", password: process.env.OFIS_PASSWORD, role: "SALES" },
  { name: "Personel", email: "personel@nemiraturizm.com", password: process.env.PERSONEL_PASSWORD, role: "SALES" },
];

const isWeak = (p) => p.length < 10 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(p) || !/\d/.test(p);

try {
  const seeded = await prisma.user.findFirst({ where: { email: DEFAULT_EMAIL, passwordChangedAt: null } });

  if (!email || !password) {
    if (seeded) {
      console.warn(
        `[yönetici] UYARI: Varsayılan hesap (${DEFAULT_EMAIL} / admin123) kullanılıyor. ` +
          "ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenlerini girip yeniden başlatın.",
      );
    }
  } else if (isWeak(password)) {
    console.warn("[yönetici] ADMIN_PASSWORD en az 10 karakter olmalı, harf ve rakam içermeli; hesap değiştirilmedi.");
  } else if (await prisma.user.findUnique({ where: { email } })) {
    console.log(`[yönetici] ${email} hesabı mevcut; dokunulmadı.`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    if (seeded) {
      await prisma.user.update({
        where: { id: seeded.id },
        data: { email, password: hash, passwordChangedAt: new Date(), tokenVersion: { increment: 1 } },
      });
      console.log(`[yönetici] Varsayılan hesap ${email} olarak güncellendi.`);
    } else {
      await prisma.user.create({
        data: { name: "Site Yöneticisi", email, password: hash, role: "ADMIN", passwordChangedAt: new Date() },
      });
      console.log(`[yönetici] ${email} hesabı oluşturuldu.`);
    }
  }

  // passwordChangedAt boş = geçici şifre: panel ilk girişte kendi şifresini belirlemeden içeri almaz.
  // Hesap henüz geçici şifredeyse (kullanıcı kendi şifresini belirlemediyse) ad ve geçici şifre
  // buradaki değerlere eşitlenir; kullanıcı kendi şifresini belirledikten sonra hesaba hiç dokunulmaz.
  for (const u of PANEL_USERS) {
    if (!u.password) continue;
    if (isWeak(u.password)) {
      console.warn(`[yönetici] ${u.name} şifresi en az 10 karakter olmalı, harf ve rakam içermeli; hesap değiştirilmedi.`);
      continue;
    }
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({ data: { name: u.name, email: u.email, password: await bcrypt.hash(u.password, 12), role: u.role } });
      console.log(`[yönetici] ${u.email} hesabı geçici şifreyle oluşturuldu.`);
      continue;
    }
    if (existing.passwordChangedAt) continue; // kendi şifresini belirlemiş
    const samePassword = await bcrypt.compare(u.password, existing.password);
    if (samePassword && existing.name === u.name) continue;
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: u.name,
        ...(samePassword ? {} : { password: await bcrypt.hash(u.password, 12), tokenVersion: { increment: 1 } }),
      },
    });
    console.log(`[yönetici] ${u.email} hesabı güncellendi (${samePassword ? "ad" : "geçici şifre"}).`);
  }
} finally {
  await prisma.$disconnect();
}
