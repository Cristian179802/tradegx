import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authenticate, listAccounts, type TradeLockerEnv } from "@/lib/tradelocker";

// POST /api/integrations/tradelocker/connect
//
// Pasul 1 din conectare: validează credențialele la TradeLocker și întoarce
// lista de conturi, ca utilizatorul să aleagă pe care îl importă.
//
// DE CE NU SALVĂM PAROLA: TradeLocker emite un accessToken JWT la login.
// Stocăm token-ul (plus datele minime necesare pentru reînnoire), nu parola.
// Parola trece o singură dată prin server, către TradeLocker, și nu e persistată.

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (session.user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }

  let body: { email?: string; password?: string; server?: string; env?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  const server = body.server?.trim();
  const env: TradeLockerEnv = body.env === "live" ? "live" : "demo";

  if (!email || !password || !server) {
    return NextResponse.json({ error: "Email, parolă și server sunt obligatorii" }, { status: 400 });
  }

  try {
    const { accessToken, refreshToken } = await authenticate(env, email, password, server);
    const accounts = await listAccounts(env, accessToken);

    if (accounts.length === 0) {
      return NextResponse.json({ error: "Autentificare reușită, dar nu am găsit conturi." }, { status: 422 });
    }

    // Token-ul se păstrează în UserIntegration; parola NU se salvează niciodată.
    await prisma.userIntegration.upsert({
      where: { userId_service: { userId: session.user.id, service: "tradelocker" } },
      create: {
        userId: session.user.id,
        service: "tradelocker",
        apiKey: accessToken,
        config: { env, server, email, refreshToken: refreshToken ?? null },
        isActive: true,
      },
      update: {
        apiKey: accessToken,
        config: { env, server, email, refreshToken: refreshToken ?? null },
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, env, accounts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare necunoscută";
    // 401 de la broker = credențiale greșite; îl traducem ca atare.
    const bad = /\b401\b|\b403\b/.test(msg);
    return NextResponse.json(
      { error: bad ? "Credențiale sau server invalide pentru TradeLocker." : msg },
      { status: bad ? 400 : 502 }
    );
  }
}
