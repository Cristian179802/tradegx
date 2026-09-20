import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-bridge";
import { SyncError } from "@/lib/exchange-sync-engine";
import { runTradeLockerSync } from "@/lib/tradelocker-sync-engine";

// POST /api/integrations/tradelocker/sync
//   { tradeLockerAccountId, accNum, name?, currency?, tradingAccountId? }
//
// Doar autentificare, validare și traducerea rezultatului în HTTP. Motorul stă în
// `lib/tradelocker-sync-engine`, ca să-l poată folosi și cron-ul — care nu are
// sesiune de utilizator și deci nu putea atinge nimic din interiorul unui handler.

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const utilizator = await getAuthUser();
  if (!utilizator) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (utilizator.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }

  let body: {
    tradeLockerAccountId?: string; accNum?: number;
    name?: string; currency?: string; tradingAccountId?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 }); }

  try {
    const result = await runTradeLockerSync({
      userId: utilizator.id,
      tradeLockerAccountId: String(body.tradeLockerAccountId ?? ""),
      accNum: Number(body.accNum),
      tradingAccountId: body.tradingAccountId,
      name: body.name,
      currency: body.currency,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof SyncError) {
      return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
    }
    return NextResponse.json({ error: "Eroare la TradeLocker" }, { status: 502 });
  }
}
