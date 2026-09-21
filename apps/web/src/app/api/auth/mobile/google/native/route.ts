import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bootstrapNewUser } from "@/lib/auth";
import { signTokenPair } from "@/lib/mobile-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// ── Conectare nativă cu Google (din aplicație) ───────────────────────────────
//
// Aplicația deschide selectorul de conturi AL TELEFONULUI, fără browser, și
// primește de la Google un `idToken`. Ruta asta îl verifică și întoarce
// perechea noastră de token-uri.
//
// DE CE E SIGUR SĂ PRIMIM UN TOKEN DE LA CLIENT: `idToken` e semnat de Google
// și îl verificăm LA GOOGLE, nu pe cuvânt. Contează trei lucruri, în ordine:
// cine l-a emis (`iss`), PENTRU CINE a fost emis (`aud` — trebuie să fie
// clientul NOSTRU, altfel o aplicație străină ar putea folosi un token primit
// de ea ca să intre în conturile noastre) și dacă adresa e confirmată.
//
// LEGAREA CONTURILOR urmează exact regula web-ului. NextAuth NU leagă automat
// un cont Google de unul cu parolă pe aceeași adresă (n-am pornit
// `allowDangerousEmailAccountLinking`), deci nici noi. Dacă am lega aici dar
// nu și pe web, același om ar primi două răspunsuri diferite pe cele două
// ecrane — iar cel permisiv ar fi exact cel pe care nu l-a ales nimeni.

interface Tokeninfo {
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  exp?: string;
}

const EMITENTI = new Set(["accounts.google.com", "https://accounts.google.com"]);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`mobile-google-native:${ip}`, { limit: 20, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Prea multe încercări. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Conectarea cu Google nu e pornită pe server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }
  const idToken = String((body as { idToken?: unknown })?.idToken ?? "").trim();
  if (!idToken) return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });

  // Verificarea o face Google, nu noi: dacă tokenul e stricat, expirat sau
  // semnat de altcineva, endpointul ăsta refuză să-l descrie.
  let info: Tokeninfo;
  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: "no-store" },
    );
    if (!r.ok) {
      return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
    }
    info = (await r.json()) as Tokeninfo;
  } catch {
    return NextResponse.json(
      { error: "Nu am putut verifica la Google. Încearcă din nou." },
      { status: 502 },
    );
  }

  // Tokenul trebuie să fie emis de Google, PENTRU clientul nostru, și nu expirat.
  if (!info.iss || !EMITENTI.has(info.iss)) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }
  if (info.aud !== clientId) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }
  if (info.exp && Number(info.exp) * 1000 < Date.now()) {
    return NextResponse.json({ error: "Conectare expirată. Încearcă din nou." }, { status: 401 });
  }

  const sub = info.sub;
  const email = info.email?.toLowerCase();
  const confirmat = info.email_verified === true || info.email_verified === "true";
  if (!sub || !email) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }
  if (!confirmat) {
    return NextResponse.json(
      { error: "Adresa ta Google nu e confirmată." },
      { status: 403 },
    );
  }

  // 1. Contul Google e deja legat → intrăm direct.
  const legat = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: sub } },
    select: { user: { select: { id: true, email: true, name: true, role: true } } },
  });

  let user = legat?.user ?? null;

  if (!user) {
    const dupaEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (dupaEmail) {
      // Există un cont pe adresa asta, dar nelegat de Google. Aceeași regulă ca
      // pe web: nu legăm singuri, fiindcă nici NextAuth n-o face.
      return NextResponse.json(
        {
          error:
            "Ai deja un cont pe adresa asta, făcut cu parolă. Intră cu parola, apoi leagă Google din setările de pe site.",
        },
        { status: 409 },
      );
    }

    // 2. Om nou: cont + legătura Google + abonamentul de probă, ca pe web.
    const nou = await prisma.user.create({
      data: {
        email,
        name: info.name ?? null,
        emailVerified: new Date(), // Google ne-a spus deja că adresa e a lui.
        accounts: {
          create: { type: "oauth", provider: "google", providerAccountId: sub },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });
    await bootstrapNewUser(nou.id);
    user = nou;
  }

  if (user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este disponibil doar pe web." }, { status: 403 });
  }

  return NextResponse.json({
    ...signTokenPair(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
}
