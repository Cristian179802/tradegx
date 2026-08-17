import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runExchangeSync, SyncError } from "@/lib/exchange-sync-engine";

// POST /api/integrations/exchange/sync
//   { provider, tradingAccountId?, name?, cursor? }
//
// Doar autentificare, validare și traducerea rezultatului în HTTP. Motorul stă în
// `lib/exchange-sync-engine` fiindcă mai are un client: cron-ul, care sincronizează
// periodic fără nicio sesiune de utilizator. Cât timp logica trăia aici, în corpul
// handler-ului, nimic fără cookie n-o putea folosi.
//
// Protocolul rămâne același, reluabil: serverul lucrează cât îi ține bugetul de
// timp și răspunde cu { hasMore, cursor, progressPct }; clientul cheamă din nou
// până la hasMore=false. Doi ani de istoric Bybit nu încap într-o invocare
// serverless, iar execuțiile unui simbol Binance trebuie împerecheate atomic.

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (session.user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }

  let body: { provider?: string; tradingAccountId?: string; name?: string; cursor?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 }); }

  const provider = body.provider === "bybit" ? "bybit" : body.provider === "binance" ? "binance" : null;
  if (!provider) return NextResponse.json({ error: "Bursă nesuportată" }, { status: 400 });

  try {
    const result = await runExchangeSync({
      userId: session.user.id,
      provider,
      tradingAccountId: body.tradingAccountId,
      name: body.name,
      cursor: body.cursor,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof SyncError) {
      return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
    }
    return NextResponse.json({ error: "Eroare la bursă" }, { status: 502 });
  }
}
