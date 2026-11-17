import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const APEX_HOST = "bureau21.io";
const CANONICAL_HOST = "www.bureau21.io";
const SIGN_IN_PATH = "/";
const AUTH_PATHS = ["/lobby", "/admin"];

function needsAuth(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Next.js 16 renamed the `middleware` file convention to `proxy`. With a
// `src/` layout this file must live at `src/proxy.ts` (next to `app/`); a
// copy at the repo root is silently ignored.
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Redirect the apex domain to www in production. Only the apex host is
  // redirected, so the canonical host can never bounce back.
  if (host === APEX_HOST) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Optimistic gate for /lobby and /admin: a NextAuth JWT must be present.
  // The pages still do their own session and role checks. The sign-in page
  // ("/") is not in AUTH_PATHS, so this redirect cannot loop.
  const { pathname, search } = request.nextUrl;

  if (needsAuth(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signInUrl = new URL(SIGN_IN_PATH, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals, and static files served from /public.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
};
