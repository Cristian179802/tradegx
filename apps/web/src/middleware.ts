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

  // Utilizatorul conectat care nimerește pe /register e trimis în aplicație:
  // e deja client, nu are ce căuta în pâlnia de înregistrare, iar cele cinci
  // CTA „Începe gratuit" din landing duc toate acolo.
  //
  // /login NU e inclus, deliberat. Sesiunea ține 30 de zile, deci cineva care
  // revine pe site e recunoscut automat — dar trebuie să poată alege oricând să
  // intre cu alt cont. Redirecționarea de aici îi lua exact această opțiune și
  // făcea pagina de autentificare inaccesibilă. Pe un calculator folosit de mai
  // multe persoane, asta chiar blochează pe cineva afară din contul lui.
  if (pathname === "/register" && req.auth?.user?.id) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

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
      // Era bilingv cu bară — un compromis de pe vremea când erorile de API
      // n-aveau cum să fie traduse. Acum le traduce dicționarul la afișare,
      // deci fiecare vede o singură propoziție, în limba lui.
      { error: "Cont demo — doar vizualizare.", demo: true },
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
