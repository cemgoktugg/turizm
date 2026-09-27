import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

/**
 * /admin altını korur. Edge çalışma zamanında JWT imzasını doğrulamak yerine
 * çerez varlığını kontrol eder (hızlı yönlendirme için). Asıl imza doğrulaması
 * admin panel layout'unda (Node runtime) getCurrentUser ile yapılır.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login sayfası serbest
  if (pathname === "/admin/login") {
    // Zaten oturum varsa panele yönlendir
    if (req.cookies.get(SESSION_COOKIE)?.value) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
