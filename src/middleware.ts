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
];

const publicPrefixes = [
  "/api/auth",
  "/api/webhooks",   // webhook routes use their own HMAC token auth, no session needed
  "/_next",
  "/favicon",
  "/images",
  "/ea",             // pre-compiled EA files in /public/ea/
];

export default auth((req: NextRequest & { auth: { user?: { id?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  const isPublic =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!req.auth?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
