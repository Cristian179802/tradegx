import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/twofactor";
import { detectInstrumentType } from "@/lib/parsers/index";
import type { ExchangeTrade } from "@/lib/exchanges/bybit";

// POST /api/integrations/exchange/sync   { provider, tradingAccountId?, name? }
//
// Importă tranzacțiile închise și le păstrează sincronizate. Reapelat, aduce
// doar ce e nou (de la lastSyncedAt minus o zi de suprapunere, ca să nu pierdem
// nimic la graniță; duplicatele cad oricum pe brokerTradeId).
//
// Prima sincronizare merge 90 de zile în urmă — limita reală a istoricului
// Binance. Bybit ține mai mult, dar păstrăm o singură fereastră inițială ca
// experiența să fie previzibilă.

const FIRST_SYNC_DAYS = 90;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (session.user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }
  const userId = session.user.id;

  let body: { provider?: string; tradingAccountId?: string; name?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 }); }

  const provider = body.provider === "bybit" ? "bybit" : body.provider === "binance" ? "binance" : null;
  if (!provider) return NextResponse.json({ error: "Bursă nesuportată" }, { status: 400 });

  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId, service: provider } },
  });
  if (!integration?.apiKey) {
    return NextResponse.json({ error: "Conectează mai întâi cheile API." }, { status: 400 });
  }

  const cfg = (integration.config ?? {}) as Record<string, unknown>;
  let apiSecret: string;
  try {
    apiSecret = decryptSecret(String(cfg.secret ?? ""));
  } catch {
    return NextResponse.json(
      { error: "Secretul stocat nu poate fi descifrat. Reconectează cheile.", needsReconnect: true },
      { status: 400 }
    );
  }

  const brokerSource = provider === "bybit" ? "BYBIT" : "BINANCE";
  const label = provider === "bybit" ? "Bybit" : "Binance Futures";

  let account = body.tradingAccountId
    ? await prisma.tradingAccount.findFirst({ where: { id: body.tradingAccountId, userId } })
    : await prisma.tradingAccount.findFirst({ where: { userId, brokerSource } });

  if (!account) {
    account = await prisma.tradingAccount.create({
      data: {
        userId,
        name: body.name?.trim() || label,
        type: "LIVE",
        broker: label,
        accountNumber: "",
        currency: "USD",   // burse crypto raportează în USDT; USD e cel mai apropiat
        leverage: 1,
        brokerSource,
        lastSyncedAt: null,
      },
    });
  }

  const sinceMs = account.lastSyncedAt
    ? account.lastSyncedAt.getTime() - 86_400_000
    : Date.now() - FIRST_SYNC_DAYS * 86_400_000;

  let trades: ExchangeTrade[] = [];
  let note: string | undefined;
  try {
    if (provider === "bybit") {
      const { getClosedTrades } = await import("@/lib/exchanges/bybit");
      trades = await getClosedTrades(integration.apiKey, apiSecret, sinceMs);
    } else {
      const { getClosedTrades } = await import("@/lib/exchanges/binance");
      const r = await getClosedTrades(integration.apiKey, apiSecret, sinceMs);
      trades = r.trades;
      if (r.truncated) {
        note = "Binance păstrează doar ultimele 3 luni de istoric — mai vechi de atât nu se poate importa.";
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare la bursă";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  let imported = 0, skipped = 0;
  for (const t of trades) {
    if (!t.symbol) continue;
    const exists = await prisma.trade.findFirst({
      where: { accountId: account.id, brokerTradeId: t.brokerTradeId },
      select: { id: true },
    });
    if (exists) { skipped++; continue; }

    await prisma.trade.create({
      data: {
        accountId: account.id,
        symbol: t.symbol,
        instrumentType: detectInstrumentType(t.symbol) as never,
        direction: t.direction,
        entryPrice: t.entryPrice,
        entryTime: t.entryTime,
        exitPrice: t.exitPrice,
        exitTime: t.exitTime,
        lotSize: t.lotSize,
        // P&L vine RAPORTAT de bursă, nu estimat de noi — la crypto, funding
        // și taxele fac ca o estimare din preț × cantitate să fie greșită.
        pnlMoney: t.pnlMoney,
        pnlPercent: 0,
        commission: t.commission,
        swap: 0,
        status: "CLOSED",
        brokerSource,
        brokerTradeId: t.brokerTradeId,
        durationMinutes: Math.max(0, Math.round((t.exitTime.getTime() - t.entryTime.getTime()) / 60000)),
        tags: [],
      },
    });
    imported++;
  }

  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    tradingAccountId: account.id,
    imported, skipped, total: trades.length,
    note,
  });
}
