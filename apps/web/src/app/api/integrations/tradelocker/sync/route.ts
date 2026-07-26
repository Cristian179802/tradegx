import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  authenticate, getOrdersHistory, pairFills, type TradeLockerEnv,
} from "@/lib/tradelocker";
import { detectInstrumentType } from "@/lib/parsers/index";

// POST /api/integrations/tradelocker/sync
//
// Pasul 2: leagă un cont TradeLocker la un cont TradeGx și importă istoricul.
// Reapelat, aduce doar ce e nou (sincronizare incrementală de la lastSyncedAt).
//
// Corp: { tradeLockerAccountId, accNum, name?, currency?, tradingAccountId? }
//   · cu `tradingAccountId` → leagă la un cont existent
//   · fără → creează un cont TradeGx nou

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (session.user.role === "DEMO") {
    return NextResponse.json({ error: "Contul demo este doar pentru vizualizare" }, { status: 403 });
  }
  const userId = session.user.id;

  let body: {
    tradeLockerAccountId?: string; accNum?: number;
    name?: string; currency?: string; tradingAccountId?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corp de cerere invalid" }, { status: 400 }); }

  const tlId = body.tradeLockerAccountId;
  const accNum = Number(body.accNum);
  if (!tlId || !Number.isFinite(accNum)) {
    return NextResponse.json({ error: "tradeLockerAccountId și accNum sunt obligatorii" }, { status: 400 });
  }

  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId, service: "tradelocker" } },
  });
  if (!integration?.apiKey) {
    return NextResponse.json({ error: "Conectează-te mai întâi la TradeLocker." }, { status: 400 });
  }

  const cfg = (integration.config ?? {}) as Record<string, unknown>;
  const env: TradeLockerEnv = cfg.env === "live" ? "live" : "demo";
  let token = integration.apiKey;

  // Contul TradeGx țintă
  let account = body.tradingAccountId
    ? await prisma.tradingAccount.findFirst({ where: { id: body.tradingAccountId, userId } })
    : await prisma.tradingAccount.findFirst({ where: { userId, brokerAccountId: tlId } });

  if (!account) {
    account = await prisma.tradingAccount.create({
      data: {
        userId,
        name: body.name?.trim() || `TradeLocker ${accNum}`,
        type: env === "live" ? "LIVE" : "DEMO",
        broker: "TradeLocker",
        accountNumber: String(accNum),
        currency: (body.currency as never) ?? "USD",
        leverage: 100,
        brokerSource: "TRADELOCKER",
        brokerAccountId: tlId,
        brokerAccNum: accNum,
      },
    });
  } else if (account.brokerAccountId !== tlId) {
    account = await prisma.tradingAccount.update({
      where: { id: account.id },
      data: { brokerSource: "TRADELOCKER", brokerAccountId: tlId, brokerAccNum: accNum },
    });
  }

  // Incremental: de la ultima sincronizare, cu o zi de suprapunere ca să nu
  // pierdem ordine închise chiar la graniță. Duplicatele sunt oprite oricum
  // mai jos, prin brokerTradeId.
  const fromMs = account.lastSyncedAt
    ? account.lastSyncedAt.getTime() - 86_400_000
    : undefined;

  let fills;
  try {
    fills = await getOrdersHistory(env, token, tlId, accNum, fromMs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // Token expirat → reautentificare, dacă avem datele necesare în config.
    if (/\b401\b|\b403\b/.test(msg) && typeof cfg.email === "string" && typeof cfg.server === "string") {
      return NextResponse.json(
        { error: "Sesiunea TradeLocker a expirat. Reconectează-te.", needsReconnect: true },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: msg || "Eroare la TradeLocker" }, { status: 502 });
  }

  const { trades, openLots } = pairFills(fills);

  let imported = 0, skipped = 0;
  for (const t of trades) {
    const exists = await prisma.trade.findFirst({
      where: { accountId: account.id, brokerTradeId: t.brokerTradeId },
      select: { id: true },
    });
    if (exists) { skipped++; continue; }

    // P&L din diferența de preț × volum. TradeLocker nu dă P&L realizat pe
    // ordin, deci îl derivăm — la fel ca la importul de blotter CSV.
    const diff = t.direction === "BUY" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
    const pnl = diff * t.lotSize;

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
        pnlMoney: pnl,
        pnlPercent: 0,
        commission: t.commission,
        swap: 0,
        status: "CLOSED",
        brokerSource: "TRADELOCKER",
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
    imported,
    skipped,
    fills: fills.length,
    openPositions: openLots,
    warning: openLots > 0
      ? `${openLots} poziție(i) încă deschisă(e) — vor apărea după închidere.`
      : undefined,
  });
}
