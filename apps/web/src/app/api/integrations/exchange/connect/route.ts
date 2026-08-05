import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/twofactor";

// POST /api/integrations/exchange/connect   { provider, apiKey, apiSecret }
//
// Validează cheile citind DOAR soldul, apoi le păstrează criptate.
//
// SECURITATE — două decizii deliberate:
//
// 1. Secretul se criptează AES-256-GCM înainte de a atinge baza de date, cu
//    același helper folosit la secretele 2FA. Un dump de bază nu expune chei
//    utilizabile. Cheia publică (apiKey) rămâne în clar: singură nu autorizează
//    nimic fără semnătură.
//
// 2. Verificarea se face cu un apel STRICT de citire (sold). Nu trimitem
//    niciodată ordine, iar în interfață cerem explicit chei read-only. O cheie
//    cu drept de retragere într-un jurnal de tranzacții nu are ce căuta.
//
// Importurile de bursă sunt dinamice: ambele librării folosesc `node:crypto` la
// nivel de modul, iar încărcarea lor doar când sunt cerute ține rutele ușoare.

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (session.user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }

  let body: { provider?: string; apiKey?: string; apiSecret?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 }); }

  const provider = body.provider === "bybit" ? "bybit" : body.provider === "binance" ? "binance" : null;
  const apiKey = body.apiKey?.trim();
  const apiSecret = body.apiSecret?.trim();

  if (!provider) return NextResponse.json({ error: "Bursă nesuportată" }, { status: 400 });
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cheia API și secretul sunt obligatorii" }, { status: 400 });
  }

  try {
    const mod = provider === "bybit"
      ? await import("@/lib/exchanges/bybit")
      : await import("@/lib/exchanges/binance");
    const info = await mod.validateKeys(apiKey, apiSecret);

    await prisma.userIntegration.upsert({
      where: { userId_service: { userId: session.user.id, service: provider } },
      create: {
        userId: session.user.id,
        service: provider,
        apiKey,
        config: { secret: encryptSecret(apiSecret) },
        isActive: true,
      },
      update: {
        apiKey,
        config: { secret: encryptSecret(apiSecret) },
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, provider, ...info });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare necunoscută";
    // Chei greșite / permisiuni insuficiente → mesaj util, nu stack trace.
    const bad = /\b401\b|\b403\b|\b10003\b|\b10004\b|signature|api.?key/i.test(msg);
    return NextResponse.json(
      { error: bad ? "Chei invalide sau fără permisiune de citire." : msg },
      { status: bad ? 400 : 502 }
    );
  }
}
