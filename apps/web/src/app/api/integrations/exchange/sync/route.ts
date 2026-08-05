import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/twofactor";
import { detectInstrumentType } from "@/lib/parsers/index";
import type { ExchangeTrade } from "@/lib/exchanges/bybit";

// POST /api/integrations/exchange/sync
//   { provider, tradingAccountId?, name?, cursor? }
//
// IMPORT RELUABIL, LA ADÂNCIMEA MAXIMĂ A FIECĂRUI API
// Cerința: tot istoricul disponibil, nu o felie arbitrară. Maximul e al bursei:
//   · Bybit — 2 ani (titlul oficial al endpoint-ului: „Get Closed PnL (2 years)")
//   · Binance — 6 luni („Only support querying trade in the past 6 months")
//
// 2 ani Bybit = ~104 ferestre de 7 zile — nu încape într-o invocare serverless.
// De aceea protocolul e reluabil: serverul procesează cât ține bugetul de timp
// și răspunde cu { hasMore, cursor, progressPct }; clientul cheamă din nou până
// la hasMore=false, afișând progresul.
//
// Cursoarele diferă pentru că structura datelor diferă:
//   · Bybit: cursor TEMPORAL, persistat în lastSyncedAt — rândurile closed-pnl
//     sunt tranzacții complete, deci orice tăietură în timp e sigură.
//   · Binance: cursor PE SIMBOL (lista rămasă, prin client) — execuțiile unui
//     simbol se împerechează FIFO și trebuie procesate atomic; o tăietură în
//     timp în mijlocul unui simbol ar produce perechi greșite.

export const maxDuration = 60;
const BUDGET_MS = 20_000;
const DAY_MS = 86_400_000;

async function insertTrades(
  accountId: string,
  brokerSource: "BINANCE" | "BYBIT",
  trades: ExchangeTrade[]
): Promise<{ imported: number; skipped: number }> {
  if (trades.length === 0) return { imported: 0, skipped: 0 };

  // Dedup în interiorul lotului + față de baza de date, apoi createMany în
  // loturi de 500. Varianta veche (findFirst + create per tranzacție) însemna
  // două interogări per rând — la mii de rânduri, mai lentă decât bugetul.
  const seen = new Set<string>();
  const unique = trades.filter((t) => {
    if (!t.symbol || seen.has(t.brokerTradeId)) return false;
    seen.add(t.brokerTradeId);
    return true;
  });

  const existing = await prisma.trade.findMany({
    where: { accountId, brokerTradeId: { in: unique.map((t) => t.brokerTradeId) } },
    select: { brokerTradeId: true },
  });
  const have = new Set(existing.map((e) => e.brokerTradeId));
  const fresh = unique.filter((t) => !have.has(t.brokerTradeId));

  for (let i = 0; i < fresh.length; i += 500) {
    await prisma.trade.createMany({
      data: fresh.slice(i, i + 500).map((t) => ({
        accountId,
        symbol: t.symbol,
        instrumentType: detectInstrumentType(t.symbol) as never,
        direction: t.direction,
        entryPrice: t.entryPrice,
        entryTime: t.entryTime,
        exitPrice: t.exitPrice,
        exitTime: t.exitTime,
        lotSize: t.lotSize,
        pnlMoney: t.pnlMoney,
        pnlPercent: 0,
        commission: t.commission,
        swap: 0,
        status: "CLOSED" as never,
        brokerSource: brokerSource as never,
        brokerTradeId: t.brokerTradeId,
        durationMinutes: Math.max(0, Math.round((t.exitTime.getTime() - t.entryTime.getTime()) / 60000)),
        tags: [],
      })),
    });
  }

  return { imported: fresh.length, skipped: trades.length - fresh.length };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (session.user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }
  const userId = session.user.id;

  let body: { provider?: string; tradingAccountId?: string; name?: string; cursor?: string };
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

  let apiSecret: string;
  try {
    apiSecret = decryptSecret(String(((integration.config ?? {}) as Record<string, unknown>).secret ?? ""));
  } catch {
    return NextResponse.json(
      { error: "Secretul stocat nu poate fi descifrat. Reconectează cheile.", needsReconnect: true },
      { status: 400 }
    );
  }

  const brokerSource = provider === "bybit" ? ("BYBIT" as const) : ("BINANCE" as const);
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
        currency: "USD",
        leverage: 1,
        brokerSource,
        lastSyncedAt: null,
      },
    });
  }

  const t0 = Date.now();
  let imported = 0, skipped = 0;

  try {
    if (provider === "bybit") {
      const { getClosedTradesWindow, BYBIT_MAX_HISTORY_MS, BYBIT_WINDOW_MS } =
        await import("@/lib/exchanges/bybit");

      const now = Date.now();
      const floor = now - BYBIT_MAX_HISTORY_MS;
      let start = account.lastSyncedAt
        ? Math.max(account.lastSyncedAt.getTime() - DAY_MS, floor)
        : floor;

      const batch: ExchangeTrade[] = [];
      while (start < now && Date.now() - t0 < BUDGET_MS) {
        batch.push(...(await getClosedTradesWindow(
          integration.apiKey, apiSecret, start, Math.min(start + BYBIT_WINDOW_MS, now)
        )));
        start = Math.min(start + BYBIT_WINDOW_MS, now);
      }

      const r = await insertTrades(account.id, brokerSource, batch);
      imported = r.imported; skipped = r.skipped;

      // Cursorul temporal se persistă: reluarea continuă exact de aici.
      await prisma.tradingAccount.update({
        where: { id: account.id },
        data: { lastSyncedAt: new Date(start) },
      });

      const hasMore = start < now;
      return NextResponse.json({
        success: true,
        tradingAccountId: account.id,
        imported, skipped, hasMore,
        progressPct: Math.min(100, Math.round(((start - floor) / (now - floor)) * 100)),
      });
    }

    // ── Binance ──
    const { discoverSymbols, tradesForSymbol, BINANCE_MAX_HISTORY_MS } =
      await import("@/lib/exchanges/binance");

    const sinceMs = account.lastSyncedAt
      ? account.lastSyncedAt.getTime() - DAY_MS
      : Date.now() - BINANCE_MAX_HISTORY_MS;

    let pending: string[]; let total: number;
    if (body.cursor) {
      try {
        const c = JSON.parse(body.cursor) as { pending?: string[]; total?: number };
        pending = Array.isArray(c.pending) ? c.pending : [];
        total = Number(c.total) || pending.length;
      } catch {
        return NextResponse.json({ error: "Cursor invalid" }, { status: 400 });
      }
    } else {
      pending = await discoverSymbols(integration.apiKey, apiSecret);
      total = pending.length;
    }

    // Fiecare simbol e atomic; inserăm după fiecare, ca progresul să fie durabil
    // înainte să-l scoatem din listă.
    while (pending.length > 0 && Date.now() - t0 < BUDGET_MS) {
      const symbol = pending[0];
      const trades = await tradesForSymbol(integration.apiKey, apiSecret, symbol, sinceMs);
      const r = await insertTrades(account.id, brokerSource, trades);
      imported += r.imported; skipped += r.skipped;
      pending.shift();
    }

    const hasMore = pending.length > 0;
    if (!hasMore) {
      await prisma.tradingAccount.update({
        where: { id: account.id },
        data: { lastSyncedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      tradingAccountId: account.id,
      imported, skipped, hasMore,
      cursor: hasMore ? JSON.stringify({ pending, total }) : undefined,
      progressPct: total > 0 ? Math.round(((total - pending.length) / total) * 100) : 100,
      note: "Binance oferă prin API maxim 6 luni de istoric. Pentru mai vechi: exportul CSV din Binance + importul CSV de aici.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Eroare la bursă";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
