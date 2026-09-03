import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PLATFORM_OWNER_PREFIX = "/control";
const BUSINESS_PREFIX = "/dashboard";
const PUBLIC_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const user = request.auth?.user;

  const isProtected =
    pathname.startsWith(PLATFORM_OWNER_PREFIX) || pathname.startsWith(BUSINESS_PREFIX);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && PUBLIC_ONLY_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith(PLATFORM_OWNER_PREFIX) && user?.role !== "platform_owner") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith(BUSINESS_PREFIX) &&
    user?.role !== "business_owner" &&
    user?.role !== "business_member"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
});

// Nota: las rutas públicas de MISE LINK (`/{username}`) pasan por este middleware
// pero no matchean ningún prefijo protegido ni PUBLIC_ONLY_PATHS, así que caen en
// NextResponse.next(). La colisión de nombres se previene con RESERVED_USERNAMES
// en lib/miselink/reserved-usernames.ts al reclamar el username.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
