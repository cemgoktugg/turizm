import { NextResponse, type NextRequest } from "next/server";
import { PATHNAME_HEADER, SESSION_COOKIE, isProfilePath, verifySession } from "@/lib/session";
import { SALES_BASE_HEADER, salesBaseOf } from "@/lib/sales-base";

/**
 * /admin ve /satis (Satış Programı) altını korur. Proxy JWT imzasını doğrular;
 * kullanıcının hâlâ var olup olmadığı, şifre değişikliği (tokenVersion) ve rol
 * kontrolü layout'larda ve giriş sayfasında getCurrentUser ile yapılır.
 *
 * Not: Giriş sayfası geçerli oturum görürse kendisi /admin'e yönlendirir.
 * Proxy'nin burada yönlendirme yapmaması, imzası geçerli ama iptal edilmiş
 * bir oturumda /admin ↔ /admin/login sonsuz döngüsünü önler.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);
  const valid = session !== null;

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

  // Geçici şifreyle giren kullanıcı kendi şifresini belirleyene kadar yalnızca Hesabım sayfasını açar.
  // Şifre değişince oturum işaretsiz yeniden oluşturulur. Bu özellikten önceki çerezleri layout'lar yakalar.
  if (session.tmp && !isProfilePath(pathname)) {
    return NextResponse.redirect(new URL(pathname.startsWith("/satis") ? "/satis/hesabim" : "/admin/profile", req.url));
  }

  // Satış sayfaları bağlantılarını hangi adresten (/satis veya eski /admin/satis)
  // açıldıklarına göre kurar; istemcinin gönderdiği değer her zaman ezilir.
  const headers = new Headers(req.headers);
  headers.set(SALES_BASE_HEADER, salesBaseOf(pathname));
  // Layout'lar geçici şifreli kullanıcıyı Hesabım'a yönlendirirken hangi sayfada olduğunu bilsin
  headers.set(PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/satis/:path*"],
};
