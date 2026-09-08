import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

// SECURITY_AUDIT.md S1/S4: this is an *optimistic* UX guard, not a security
// boundary — the API is the real authority and 403s any non-admin token.
// Previously this only checked whether the cookie existed at all, so any
// cookie named pk_admin_token (e.g. "pk_admin_token=x") would pass. Decoding
// the payload (no signature check possible without the JWT secret, which
// must never live in frontend code) at least catches expired/garbage/
// non-admin tokens before rendering the shell.
function readValidSession(rawToken: string): { role: string; exp: number } | null {
  try {
    const payload = rawToken.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    const claims = JSON.parse(json) as { role?: string; exp?: number };
    if (!claims.exp || claims.exp * 1000 <= Date.now()) return null;
    if (claims.role !== "superadmin") return null;
    return { role: claims.role, exp: claims.exp };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const rawToken = request.cookies.get(AUTH_COOKIE)?.value;
  const session = rawToken ? readValidSession(rawToken) : null;

  if (!isPublicPath && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (rawToken) response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  if (isPublicPath && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Excludes API routes, Next's own internals, and any path with a file
// extension (images, icons, fonts, etc.) — public static assets like the
// logo must be reachable from /login itself, which has no session yet.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
