import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/pricing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  // Pagini legale + prezentare — obligatoriu publice (vizitatori, scannere, GDPR)
  "/terms",
  "/privacy",
  "/contact",
  "/about",
  "/roadmap",
  "/robots.txt",
  "/sitemap.xml",
  // PWA — manifestul și iconițele trebuie accesibile fără login
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  // Service worker Web Push — trebuie servit public, de la rădăcină (scope "/")
  "/sw.js",
];

const publicPrefixes = [
  "/api/auth",
  "/api/webhooks",       // webhook routes use their own HMAC token auth, no session needed
  "/api/stripe/webhook", // Stripe events — protected by stripe-signature (constructEvent)
  "/api/cron",           // Vercel cron jobs — protected by CRON_SECRET bearer token
  "/share",          // public share pages — protected by per-trade HMAC token
  "/api/share",      // share token validation endpoint
  "/_next",
  "/favicon",
  "/images",
  "/ea",             // pre-compiled EA files in /public/ea/
  "/.well-known",    // security.txt și alte standarde web
];

export default auth((req: NextRequest & { auth: { user?: { id?: string; role?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  const isPublic =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    return NextResponse.next();
  }

  // Cererile API cu Bearer token (mobile) trec mai departe — auth bridge-ul
  // le validează în route handler (verify JWT crypto/Node, nu aici în Edge).
  if (
    pathname.startsWith("/api/") &&
    req.headers.get("authorization")?.startsWith("Bearer ")
  ) {
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!req.auth?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Contul DEMO e read-only: orice mutație pe API e refuzată central.
  // (GET/HEAD trec — vizitatorul vede tot, nu poate strica nimic.)
  if (
    req.auth.user.role === "DEMO" &&
    pathname.startsWith("/api/") &&
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    return NextResponse.json(
      { error: "Cont demo — doar vizualizare. / Demo account is read-only.", demo: true },
      { status: 403 }
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|otf|woff|woff2)$).*)",
  ],
};
