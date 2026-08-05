import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ordersHistoryColumns, getOrdersHistoryWindow, pairFills,
  TRADELOCKER_MAX_HISTORY_MS, TRADELOCKER_WINDOW_MS,
  type TradeLockerEnv, type TlFill,
} from "@/lib/tradelocker";
import { detectInstrumentType } from "@/lib/parsers/index";

// POST /api/integrations/tradelocker/sync
//
// ADÂNCIME MAXIMĂ: TradeLocker nu documentează retenție → mergem 3 ani în urmă
// (platforma există din ~2022). Cererea NU se face dintr-o bucată: API-ul are
// plafon de rânduri per răspuns FĂRĂ paginare, deci „tot istoricul" într-o
// singură cerere ar fi trunchiat silențios — exact ce vrem să evităm. Ferestre
// de 14 zile, config-ul de coloane citit o singură dată.
//
// Împerecherea FIFO vrea toate execuțiile într-o trecere (o poziție ținută
// peste graniță între două bucăți nu s-ar mai împerechea), de aceea bugetul e
// generos (40s, maxDuration 60) ca importul să încapă de obicei într-o singură
// invocare: 3 ani ≈ 78 de ferestre. Reluarea (hasMore + lastSyncedAt) rămâne
// plasă de siguranță pentru conturi uriașe sau API lent.

export const maxDuration = 60;
const BUDGET_MS = 40_000;
const DAY_MS = 86_400_000;

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
  const token = integration.apiKey;

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

  const now = Date.now();
  const floor = now - TRADELOCKER_MAX_HISTORY_MS;
  let start = account.lastSyncedAt
    ? Math.max(account.lastSyncedAt.getTime() - DAY_MS, floor)
    : floor;

  const t0 = Date.now();
  const fills: TlFill[] = [];
  try {
    const columns = await ordersHistoryColumns(env, token, accNum);
    while (start < now && Date.now() - t0 < BUDGET_MS) {
      const end = Math.min(start + TRADELOCKER_WINDOW_MS, now);
      fills.push(...(await getOrdersHistoryWindow(env, token, tlId, accNum, columns, start, end)));
      start = end;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/\b401\b|\b403\b/.test(msg)) {
      return NextResponse.json(
        { error: "Sesiunea TradeLocker a expirat. Reconectează-te.", needsReconnect: true },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: msg || "Eroare la TradeLocker" }, { status: 502 });
  }

  const { trades, openLots } = pairFills(fills);

  // Dedup în lot + față de bază, apoi createMany — nu findFirst+create per rând.
  const seen = new Set<string>();
  const unique = trades.filter((t) => {
    if (seen.has(t.brokerTradeId)) return false;
    seen.add(t.brokerTradeId);
    return true;
  });
  const existing = await prisma.trade.findMany({
    where: { accountId: account.id, brokerTradeId: { in: unique.map((t) => t.brokerTradeId) } },
    select: { brokerTradeId: true },
  });
  const have = new Set(existing.map((e) => e.brokerTradeId));
  const fresh = unique.filter((t) => !have.has(t.brokerTradeId));

  for (let i = 0; i < fresh.length; i += 500) {
    await prisma.trade.createMany({
      data: fresh.slice(i, i + 500).map((t) => {
        const diff = t.direction === "BUY" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
        return {
          accountId: account!.id,
          symbol: t.symbol,
          instrumentType: detectInstrumentType(t.symbol) as never,
          direction: t.direction,
          entryPrice: t.entryPrice,
          entryTime: t.entryTime,
          exitPrice: t.exitPrice,
          exitTime: t.exitTime,
          lotSize: t.lotSize,
          // P&L derivat din preț × volum — TradeLocker nu dă P&L realizat pe ordin.
          pnlMoney: diff * t.lotSize,
          pnlPercent: 0,
          commission: t.commission,
          swap: 0,
          status: "CLOSED" as never,
          brokerSource: "TRADELOCKER" as never,
          brokerTradeId: t.brokerTradeId,
          durationMinutes: Math.max(0, Math.round((t.exitTime.getTime() - t.entryTime.getTime()) / 60000)),
          tags: [],
        };
      }),
    });
  }

  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date(start) },
  });

  const hasMore = start < now;
  return NextResponse.json({
    success: true,
    tradingAccountId: account.id,
    imported: fresh.length,
    skipped: trades.length - fresh.length,
    fills: fills.length,
    openPositions: openLots,
    hasMore,
    progressPct: Math.min(100, Math.round(((start - floor) / (now - floor)) * 100)),
    warning: openLots > 0
      ? `${openLots} poziție(i) încă deschisă(e) — vor apărea după închidere.`
      : undefined,
  });
}
