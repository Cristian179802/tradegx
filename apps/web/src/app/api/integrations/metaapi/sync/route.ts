import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeals, pairDeals } from "@/lib/metaapi";
import { checkTradingRuleViolations } from "@/lib/trading-rules";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json();
  const { metaApiAccountId, tradingAccountId, daysBack = 90 } = body;

  if (!metaApiAccountId || !tradingAccountId) {
    return NextResponse.json({ error: "metaApiAccountId și tradingAccountId sunt obligatorii" }, { status: 400 });
  }

  // Verify ownership of the TradeGX account
  const tradingAccount = await prisma.tradingAccount.findFirst({
    where: { id: tradingAccountId, userId: session.user.id },
  });
  if (!tradingAccount) {
    return NextResponse.json({ error: "Cont de trading negăsit" }, { status: 404 });
  }

  // Get MetaAPI token
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId: session.user.id, service: "metaapi" } },
  });
  if (!integration?.isActive || !integration.apiKey) {
    return NextResponse.json({ error: "MetaAPI nu este conectat" }, { status: 400 });
  }

  try {
    const to = new Date();
    const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const deals = await getDeals(integration.apiKey, metaApiAccountId, from, to);
    const paired = pairDeals(deals);

    if (paired.length === 0) {
      // Link the MetaAPI account even if no trades
      await prisma.tradingAccount.update({
        where: { id: tradingAccountId },
        data: { metaApiId: metaApiAccountId, brokerSource: "METAAPI", lastSyncedAt: new Date() },
      });
      return NextResponse.json({ imported: 0, skipped: 0, message: "Nicio tranzacție găsită în perioada selectată." });
    }

    let imported = 0;
    let skipped = 0;

    for (const trade of paired) {
      // Skip if already imported (dedup by brokerTradeId)
      const existing = await prisma.trade.findFirst({
        where: { accountId: tradingAccountId, brokerTradeId: trade.positionId },
      });
      if (existing) { skipped++; continue; }

      const durationMinutes = Math.round(
        (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000
      );

      const balance = Number(tradingAccount.balance);
      const pnlPercent = balance > 0 ? (trade.pnlMoney / balance) * 100 : 0;

      await prisma.trade.create({
        data: {
          accountId: tradingAccountId,
          symbol: trade.symbol,
          instrumentType: trade.instrumentType as any,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          entryTime: trade.entryTime,
          exitPrice: trade.exitPrice,
          exitTime: trade.exitTime,
          lotSize: trade.lotSize,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
          pnlMoney: trade.pnlMoney,
          pnlPercent: Math.round(pnlPercent * 10000) / 10000,
          commission: trade.commission,
          swap: trade.swap,
          status: "CLOSED",
          brokerSource: "METAAPI",
          brokerTradeId: trade.positionId,
          durationMinutes,
          tags: [],
        },
      });

      // Update account balance
      const net = trade.pnlMoney - trade.commission - trade.swap;
      await prisma.tradingAccount.update({
        where: { id: tradingAccountId },
        data: { balance: { increment: net } },
      });

      // Reguli de risc DOAR pe tranzacții închise recent (live), nu la backfill istoric.
      if (Date.now() - trade.exitTime.getTime() < 15 * 60 * 1000) {
        void checkTradingRuleViolations({
          userId: session.user.id,
          accountId: tradingAccountId,
          tradePnl: trade.pnlMoney,
        }).catch(() => {});
      }

      imported++;
    }

    // Link MetaAPI account + update sync timestamp
    await prisma.tradingAccount.update({
      where: { id: tradingAccountId },
      data: {
        metaApiId: metaApiAccountId,
        brokerSource: "METAAPI",
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      imported,
      skipped,
      total: paired.length,
      message: `${imported} tranzacții importate, ${skipped} deja existente.`,
    });
  } catch (err) {
    console.error("[METAAPI/SYNC]", err);
    return NextResponse.json(
      { error: "Eroare la sincronizare. Verifică ID-ul contului MetaAPI." },
      { status: 502 }
    );
  }
}
