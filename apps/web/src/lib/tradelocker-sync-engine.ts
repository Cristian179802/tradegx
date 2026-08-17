import { prisma } from "@/lib/prisma";
import {
  ordersHistoryColumns, getOrdersHistoryWindow, pairFills,
  TRADELOCKER_MAX_HISTORY_MS, TRADELOCKER_WINDOW_MS,
  type TradeLockerEnv, type TlFill,
} from "@/lib/tradelocker";
import { detectInstrumentType } from "@/lib/parsers/index";
import { SyncError } from "@/lib/exchange-sync-engine";

// ── Motorul de sincronizare TradeLocker ──────────────────────────────────────
//
// Extras din corpul rutei HTTP pentru același motiv ca la burse: cron-ul nu are
// sesiune de utilizator, deci nu putea chema nimic din interiorul unui handler.
//
// ADÂNCIME MAXIMĂ: TradeLocker nu documentează retenție → mergem 3 ani în urmă
// (platforma există din ~2022). Cererea NU se face dintr-o bucată: API-ul are
// plafon de rânduri per răspuns FĂRĂ paginare, deci „tot istoricul" într-o
// singură cerere ar fi trunchiat silențios — exact ce vrem să evităm. Ferestre de
// 14 zile, config-ul de coloane citit o singură dată.
//
// Împerecherea FIFO vrea toate execuțiile într-o trecere (o poziție ținută peste
// graniță între două bucăți nu s-ar mai împerechea), de aceea bugetul implicit e
// generos: 3 ani ≈ 78 de ferestre. Reluarea (hasMore + lastSyncedAt) rămâne plasă
// de siguranță pentru conturi uriașe sau API lent.

const DAY_MS = 86_400_000;
export const TRADELOCKER_DEFAULT_BUDGET_MS = 40_000;

export interface TradeLockerSyncResult {
  tradingAccountId: string;
  imported: number;
  skipped: number;
  fills: number;
  openPositions: number;
  hasMore: boolean;
  progressPct: number;
  warning?: string;
}

export async function runTradeLockerSync(opts: {
  userId: string;
  tradeLockerAccountId: string;
  accNum: number;
  tradingAccountId?: string;
  name?: string;
  currency?: string;
  budgetMs?: number;
}): Promise<TradeLockerSyncResult> {
  const { userId, tradeLockerAccountId: tlId } = opts;
  const accNum = Number(opts.accNum);
  const BUDGET_MS = opts.budgetMs ?? TRADELOCKER_DEFAULT_BUDGET_MS;

  if (!tlId || !Number.isFinite(accNum)) {
    throw new SyncError("tradeLockerAccountId și accNum sunt obligatorii", 400);
  }

  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId, service: "tradelocker" } },
  });
  if (!integration?.apiKey) {
    throw new SyncError("Conectează-te mai întâi la TradeLocker.", 400);
  }

  const cfg = (integration.config ?? {}) as Record<string, unknown>;
  const env: TradeLockerEnv = cfg.env === "live" ? "live" : "demo";
  const token = integration.apiKey;

  let account = opts.tradingAccountId
    ? await prisma.tradingAccount.findFirst({ where: { id: opts.tradingAccountId, userId } })
    : await prisma.tradingAccount.findFirst({ where: { userId, brokerAccountId: tlId } });

  if (!account) {
    await prisma.tradingAccount.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Contul nou devine SINGURUL activ. `isActive` are implicit `true` in
    // schema, iar nimeni nu le stingea pe celelalte — asa se ajungea la mai
    // multe conturi active simultan, iar aplicatia alegea pe cel mai vechi.
    account = await prisma.tradingAccount.create({
      data: {
        userId,
        name: opts.name?.trim() || `TradeLocker ${accNum}`,
        type: env === "live" ? "LIVE" : "DEMO",
        broker: "TradeLocker",
        accountNumber: String(accNum),
        currency: (opts.currency as never) ?? "USD",
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
    // Tokenul TradeLocker expiră. E o stare pe care numai utilizatorul o poate
    // rezolva, deci se semnalează explicit: cron-ul o folosește ca să nu mai
    // încerce la fiecare cinci minute degeaba.
    if (/\b401\b|\b403\b/.test(msg)) {
      throw new SyncError("Sesiunea TradeLocker a expirat. Reconectează-te.", 401, {
        needsReconnect: true,
      });
    }
    throw new SyncError(msg || "Eroare la TradeLocker", 502);
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

  const accountId = account.id;
  for (let i = 0; i < fresh.length; i += 500) {
    await prisma.trade.createMany({
      data: fresh.slice(i, i + 500).map((t) => {
        const diff = t.direction === "BUY" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
        return {
          accountId,
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
    where: { id: accountId },
    data: { lastSyncedAt: new Date(start) },
  });

  const hasMore = start < now;
  return {
    tradingAccountId: accountId,
    imported: fresh.length,
    skipped: trades.length - fresh.length,
    fills: fills.length,
    openPositions: openLots,
    hasMore,
    progressPct: Math.min(100, Math.round(((start - floor) / (now - floor)) * 100)),
    warning: openLots > 0
      ? `${openLots} poziție(i) încă deschisă(e) — vor apărea după închidere.`
      : undefined,
  };
}
