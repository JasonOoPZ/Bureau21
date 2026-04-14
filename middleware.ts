import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_PATHS = ["/lobby", "/admin"];

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Redirect non-www to www in production
  if (host === "bureau21.io") {
    const url = request.nextUrl.clone();
    url.host = "www.bureau21.io";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Protect /lobby and /admin with NextAuth JWT check
  const pathname = request.nextUrl.pathname;
  const needsAuth = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (needsAuth) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signInUrl = new URL("/", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
