import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest): NextResponse {
  const res = NextResponse.next();

  // Basic hardening headers
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Allow Next.js assets and images
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      // Google Analytics
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
      "font-src 'self' data:",
      "frame-ancestors 'self'",
    ].join("; ")
  );

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


