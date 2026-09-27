import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * /admin altını korur. Proxy JWT imzasını doğrular; kullanıcının hâlâ var
 * olup olmadığı ve şifre değişikliği (tokenVersion) kontrolü panel layout'unda
 * ve giriş sayfasında getCurrentUser ile yapılır.
 *
 * Not: Giriş sayfası geçerli oturum görürse kendisi /admin'e yönlendirir.
 * Proxy'nin burada yönlendirme yapmaması, imzası geçerli ama iptal edilmiş
 * bir oturumda /admin ↔ /admin/login sonsuz döngüsünü önler.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = verifySession(token) !== null;

  if (pathname === "/admin/login") {
    // Geçersiz / süresi dolmuş çerezi temizle
    if (token && (!valid || req.nextUrl.searchParams.has("expired"))) {
      const res = NextResponse.next();
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (!valid) {
    const url = new URL("/admin/login", req.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
