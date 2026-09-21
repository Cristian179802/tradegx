import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signTokenPair, verifyExchangeCode } from "@/lib/mobile-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Preschimbă codul primit prin `tradegx://auth?cod=…` în perechea de token-uri.
//
// Codul singur NU ajunge: cere și secretul din spatele amprentei cu care a fost
// emis, secret pe care doar telefonul care a pornit conectarea îl are.

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`mobile-google-exchange:${ip}`, { limit: 20, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Prea multe încercări. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }

  const cod = String((body as { cod?: unknown })?.cod ?? "");
  const secret = String((body as { secret?: unknown })?.secret ?? "");
  if (!cod || !secret) {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }

  const userId = verifyExchangeCode(cod, secret);
  if (!userId) {
    return NextResponse.json({ error: "Conectare expirată. Încearcă din nou." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }

  // Aceeași regulă ca la login-ul cu parolă: contul demo e doar pe web.
  if (user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este disponibil doar pe web." }, { status: 403 });
  }

  return NextResponse.json({
    ...signTokenPair(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
}
