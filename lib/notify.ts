import "server-only";
import nodemailer from "nodemailer";
import { fill } from "./content/template";
import { LEAD_SOURCES, type LeadSource } from "./validations";

/**
 * Yeni başvuru bildirimleri. Ortam değişkenleri:
 *  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM  → e-posta gönderimi
 *  NOTIFY_EMAIL                                            → bildirimin gideceği adres(ler), virgülle
 *  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID                    → isteğe bağlı Telegram bildirimi
 *  CALLMEBOT_APIKEY (+ isteğe bağlı CALLMEBOT_PHONE)        → WhatsApp numaranıza bildirim (CallMeBot);
 *                                                            numara verilmezse Site Ayarları'ndaki WhatsApp kullanılır
 * Ayarlanmamış kanal sessizce atlanır; hatalar başvuruyu asla engellemez.
 */

export type LeadNotice = {
  fullName: string;
  phone: string;
  email: string | null;
  personCount: number | null;
  tourTitle: string | null;
  message: string | null;
  source: LeadSource | null;
};

type Brand = { siteName: string; phone: string; whatsapp: string; adminUrl: string };
type AutoReply = { subject: string; text: string };

function smtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    from: process.env.SMTP_FROM || user,
    transport: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }),
  };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function leadLines(lead: LeadNotice): [string, string][] {
  const rows: [string, string | null | undefined][] = [
    ["Ad soyad", lead.fullName],
    ["Telefon", lead.phone],
    ["E-posta", lead.email],
    ["Kişi sayısı", lead.personCount ? String(lead.personCount) : null],
    ["Program", lead.tourTitle],
    ["Kaynak", lead.source ? LEAD_SOURCES[lead.source] : null],
    ["Mesaj", lead.message],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]));
}

async function emailAdmin(lead: LeadNotice, brand: Brand) {
  const mail = smtp();
  const to = process.env.NOTIFY_EMAIL;
  if (!mail || !to) return;
  const rows = leadLines(lead);
  const waPhone = waNumber(lead.phone);
  await mail.transport.sendMail({
    from: `"${brand.siteName}" <${mail.from}>`,
    to,
    replyTo: lead.email || undefined,
    subject: `Yeni başvuru: ${lead.fullName}${lead.tourTitle ? ` — ${lead.tourTitle}` : ""}`,
    text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nPanel: ${brand.adminUrl}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0b1b2b">
      <h2 style="color:#006b7d;margin:0 0 12px">Yeni başvuru</h2>
      <table cellpadding="6" style="border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="color:#5d6b78">${esc(k)}</td><td><b>${esc(v).replace(/\n/g, "<br>")}</b></td></tr>`)
        .join("")}</table>
      <p style="margin-top:16px">
        <a href="https://wa.me/${waPhone}" style="background:#25D366;color:#fff;padding:8px 14px;border-radius:20px;text-decoration:none">WhatsApp'tan yaz</a>
        &nbsp;<a href="${brand.adminUrl}" style="color:#006b7d">Panelde aç</a>
      </p></div>`,
  });
}

async function emailCustomer(lead: LeadNotice, brand: Brand, reply: AutoReply) {
  const mail = smtp();
  if (!mail || !lead.email || !reply.subject.trim() || !reply.text.trim()) return;
  const vars = { ad: lead.fullName, tur: lead.tourTitle || "", telefon: brand.phone, site: brand.siteName };
  const body = fill(reply.text, vars);
  await mail.transport.sendMail({
    from: `"${brand.siteName}" <${mail.from}>`,
    to: lead.email,
    subject: fill(reply.subject, vars),
    text: body,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0b1b2b">${esc(body).replace(/\n/g, "<br>")}</div>`,
  });
}

async function telegram(lead: LeadNotice, brand: Brand) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const text = `🔔 Yeni başvuru\n\n${leadLines(lead)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n\n${brand.adminUrl}`;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}`);
}

/** Müşterinin numarasını WhatsApp bağlantısı biçimine çevirir (0555… → 90555…) */
function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "90" + d.slice(1);
  else if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return d;
}

/** WhatsApp numaranıza bildirim (CallMeBot — yalnızca kendi numaranıza mesaj gönderir) */
async function whatsapp(lead: LeadNotice, brand: Brand) {
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!apikey) return;
  const phone = (process.env.CALLMEBOT_PHONE || brand.whatsapp).replace(/[^\d]/g, "");
  if (!phone) return;
  const text = [
    "🔔 *Yeni başvuru*",
    "",
    ...leadLines(lead).map(([k, v]) => `*${k}:* ${v}`),
    "",
    `Müşteriye yaz: https://wa.me/${waNumber(lead.phone)}`,
    `Panel: ${brand.adminUrl}`,
  ].join("\n");
  const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await res.text();
  // Servis hata durumunda da 200 dönebildiği için metne bakılır
  if (!res.ok || /error|invalid|not (allowed|activated)/i.test(body)) {
    throw new Error(`WhatsApp (CallMeBot) ${res.status}: ${body.replace(/<[^>]+>/g, " ").slice(0, 160)}`);
  }
}

/** Tüm kanallara bildirim gönderir; hatalar yalnızca loglanır */
export async function notifyNewLead(lead: LeadNotice, brand: Brand, reply: AutoReply) {
  const results = await Promise.allSettled([
    emailAdmin(lead, brand),
    emailCustomer(lead, brand, reply),
    telegram(lead, brand),
    whatsapp(lead, brand),
  ]);
  for (const r of results) if (r.status === "rejected") console.error("[bildirim]", r.reason);
}
